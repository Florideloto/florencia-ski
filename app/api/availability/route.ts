import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { eachDayOfInterval, format, max, min, parseISO } from 'date-fns';

const SEASON_START = new Date(2026, 11, 1);
const SEASON_END = new Date(2027, 1, 28);

// Availability is open by default for the whole season: every date offers
// both "Día Completo" (09:00-16:00) and "Medio Día" (09:00-12:00) unless
// Florencia blocked it, or a confirmed booking already took that date
// (the two franjas overlap, so a confirmed slot takes the whole date).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!from || !to) {
    return NextResponse.json({ error: 'Missing from/to params' }, { status: 400 });
  }

  try {
    const supabase = createServerSupabase();

    const [{ data: blockedRows }, { data: bookedRows }] = await Promise.all([
      supabase.from('blocked_dates').select('date').gte('date', from).lte('date', to),
      supabase.from('availability_slots').select('date').eq('is_booked', true).gte('date', from).lte('date', to),
    ]);

    const unavailable = new Set([
      ...(blockedRows ?? []).map((r) => r.date),
      ...(bookedRows ?? []).map((r) => r.date),
    ]);

    const rangeStart = max([parseISO(from), SEASON_START]);
    const rangeEnd = min([parseISO(to), SEASON_END]);
    if (rangeStart > rangeEnd) return NextResponse.json([]);

    const slots = eachDayOfInterval({ start: rangeStart, end: rangeEnd }).flatMap((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      if (unavailable.has(dateStr)) return [];
      return [
        { id: `${dateStr}::full`, date: dateStr, start_time: '09:00:00', end_time: '16:00:00', is_booked: false, created_at: '' },
        { id: `${dateStr}::half`, date: dateStr, start_time: '09:00:00', end_time: '12:00:00', is_booked: false, created_at: '' },
      ];
    });

    return NextResponse.json(slots);
  } catch (err) {
    console.error('availability GET error:', err);
    return NextResponse.json([], { status: 200 });
  }
}
