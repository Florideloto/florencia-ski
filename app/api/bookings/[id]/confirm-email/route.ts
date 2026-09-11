import { NextRequest, NextResponse } from 'next/server';
import { supabase, createServerSupabase } from '@/lib/supabase';
import { sendBookingConfirmationEmail } from '@/lib/notify';
import type { Locale } from '@/lib/types';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !userData?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const serverSupabase = createServerSupabase();

  const { data: booking, error: bookingError } = await serverSupabase
    .from('booking_requests')
    .select('*, booking_request_slots(slot:availability_slots(*))')
    .eq('id', id)
    .maybeSingle();

  if (bookingError || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  const days = (booking.booking_request_slots ?? [])
    .map((r: { slot: { date: string; start_time: string; end_time: string } | null }) => r.slot)
    .filter(Boolean) as { date: string; start_time: string; end_time: string }[];

  const sent = await sendBookingConfirmationEmail({
    bookingId: booking.id,
    name: booking.client_name,
    email: booking.client_email,
    resort: booking.resort ?? '',
    resortOther: booking.resort_other ?? '',
    locale: (booking.locale as Locale) ?? 'es',
    days,
  });

  return NextResponse.json({ success: sent });
}
