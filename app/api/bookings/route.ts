import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slot_ids, name, email, phone, service, resort, resort_other, message } = body;

    if (!Array.isArray(slot_ids) || slot_ids.length === 0 || !name || !email || !service || !resort) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (resort === 'Other' && !resort_other) {
      return NextResponse.json({ error: 'Missing resort_other' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // Check all slots are still available
    const { data: slots, error: slotsError } = await supabase
      .from('availability_slots')
      .select('id, is_booked')
      .in('id', slot_ids);

    if (slotsError || !slots || slots.length !== slot_ids.length) {
      return NextResponse.json({ error: 'One or more slots not found' }, { status: 404 });
    }
    if (slots.some((s) => s.is_booked)) {
      return NextResponse.json({ error: 'One or more slots are already booked' }, { status: 409 });
    }

    // Create the booking request (pending status — Florencia confirms manually)
    const { data: booking, error: bookingError } = await supabase
      .from('booking_requests')
      .insert({
        slot_id: slot_ids[0],
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
    const links = slot_ids.map((slot_id: string) => ({ booking_request_id: booking.id, slot_id }));
    const { error: linkError } = await supabase.from('booking_request_slots').insert(links);
    if (linkError) throw linkError;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('bookings POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
