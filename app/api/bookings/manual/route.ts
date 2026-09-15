import { NextRequest, NextResponse } from 'next/server';
import { supabase, createServerSupabase } from '@/lib/supabase';
import { resolveSlotId } from '@/lib/slots';
import { sendBookingConfirmationEmail } from '@/lib/notify';

interface RequestedDay {
  date: string;
  start_time: string;
  end_time: string;
}

// Lets Florencia log a booking she took outside the site (Instagram, WhatsApp,
// in person) so it blocks the day like any other confirmed booking. Unlike the
// public /api/bookings route, this one requires an admin session, doesn't
// require a client email (she may not have one), and creates the booking
// already confirmed — there's no approval step for something she's entering
// herself.
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !userData?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slots, name, email, phone, service, resort, resort_other, message } = body;

    if (!Array.isArray(slots) || slots.length === 0 || !name || !service || !resort) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (resort === 'Other' && !resort_other) {
      return NextResponse.json({ error: 'Missing resort_other' }, { status: 400 });
    }

    const serverSupabase = createServerSupabase();
    const dates: string[] = slots.map((s: RequestedDay) => s.date);

    const { data: blockedRows } = await serverSupabase.from('blocked_dates').select('date').in('date', dates);
    if (blockedRows && blockedRows.length > 0) {
      return NextResponse.json({ error: 'One or more days are no longer available' }, { status: 409 });
    }

    const { data: existingSlots } = await serverSupabase
      .from('availability_slots')
      .select('date, is_booked')
      .in('date', dates);
    if (existingSlots?.some((s) => s.is_booked)) {
      return NextResponse.json({ error: 'One or more days are no longer available' }, { status: 409 });
    }

    const slotIds = await Promise.all(slots.map((day: RequestedDay) => resolveSlotId(serverSupabase, day)));

    const { data: booking, error: bookingError } = await serverSupabase
      .from('booking_requests')
      .insert({
        slot_id: slotIds[0],
        client_name: name,
        client_email: email || '',
        client_phone: phone ?? '',
        service_type: service,
        resort,
        resort_other: resort === 'Other' ? resort_other : '',
        message: message ?? '',
        status: 'confirmed',
        locale: 'es',
      })
      .select('id')
      .single();

    if (bookingError || !booking) throw bookingError;

    const links = slotIds.map((slot_id: string) => ({ booking_request_id: booking.id, slot_id }));
    const { error: linkError } = await serverSupabase.from('booking_request_slots').insert(links);
    if (linkError) throw linkError;

    await serverSupabase.from('availability_slots').update({ is_booked: true }).in('id', slotIds);

    let emailSent: boolean | null = null;
    if (email) {
      emailSent = await sendBookingConfirmationEmail({
        bookingId: booking.id,
        name,
        email,
        resort,
        resortOther: resort === 'Other' ? resort_other : '',
        locale: 'es',
        days: slots,
      });
    }

    return NextResponse.json({ success: true, id: booking.id, emailSent });
  } catch (err) {
    console.error('manual booking POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
