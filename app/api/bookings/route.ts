import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { sendBookingNotificationEmail } from '@/lib/notify';

interface RequestedDay {
  date: string;
  start_time: string;
  end_time: string;
}

// Availability is "open by default": a slot row only exists once it's been
// blocked by Florencia or booked by a client. Resolve the real row for a
// requested day, creating it if this is the first booking on that day/franja.
async function resolveSlotId(
  supabase: ReturnType<typeof createServerSupabase>,
  day: RequestedDay
): Promise<string> {
  const { data: existing } = await supabase
    .from('availability_slots')
    .select('id')
    .eq('date', day.date)
    .eq('start_time', day.start_time)
    .eq('end_time', day.end_time)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: inserted, error } = await supabase
    .from('availability_slots')
    .insert({ date: day.date, start_time: day.start_time, end_time: day.end_time, is_booked: false })
    .select('id')
    .single();

  if (error || !inserted) throw error;
  return inserted.id;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slots, name, email, phone, service, resort, resort_other, message } = body;

    if (!Array.isArray(slots) || slots.length === 0 || !name || !email || !service || !resort) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (resort === 'Other' && !resort_other) {
      return NextResponse.json({ error: 'Missing resort_other' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const dates: string[] = slots.map((s: RequestedDay) => s.date);

    // Blocked by Florencia?
    const { data: blockedRows } = await supabase.from('blocked_dates').select('date').in('date', dates);
    if (blockedRows && blockedRows.length > 0) {
      return NextResponse.json({ error: 'One or more days are no longer available' }, { status: 409 });
    }

    // Already booked? Día Completo and Medio Día overlap (both start at 09:00),
    // so any confirmed slot on a date takes the whole date, not just its own franja.
    const { data: existingSlots } = await supabase
      .from('availability_slots')
      .select('date, is_booked')
      .in('date', dates);
    if (existingSlots?.some((s) => s.is_booked)) {
      return NextResponse.json({ error: 'One or more days are no longer available' }, { status: 409 });
    }

    const slotIds = await Promise.all(slots.map((day: RequestedDay) => resolveSlotId(supabase, day)));

    // Create the booking request (pending status — Florencia confirms manually)
    const { data: booking, error: bookingError } = await supabase
      .from('booking_requests')
      .insert({
        slot_id: slotIds[0],
        client_name: name,
        client_email: email,
        client_phone: phone ?? '',
        service_type: service,
        resort,
        resort_other: resort === 'Other' ? resort_other : '',
        message: message ?? '',
        status: 'pending',
      })
      .select('id')
      .single();

    if (bookingError || !booking) throw bookingError;

    // Link every selected day to this booking request
    const links = slotIds.map((slot_id: string) => ({ booking_request_id: booking.id, slot_id }));
    const { error: linkError } = await supabase.from('booking_request_slots').insert(links);
    if (linkError) throw linkError;

    await sendBookingNotificationEmail({
      name,
      email,
      phone: phone ?? '',
      service,
      resort,
      resortOther: resort === 'Other' ? resort_other : '',
      message: message ?? '',
      days: slots,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('bookings POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
