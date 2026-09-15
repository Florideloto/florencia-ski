import { createServerSupabase } from '@/lib/supabase';

interface RequestedDay {
  date: string;
  start_time: string;
  end_time: string;
}

// Availability is "open by default": a slot row only exists once it's been
// blocked by Florencia or booked by a client. Resolve the real row for a
// requested day, creating it if this is the first booking on that day/franja.
export async function resolveSlotId(
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
