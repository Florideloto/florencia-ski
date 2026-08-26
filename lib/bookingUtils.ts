import type { AvailabilitySlot } from '@/lib/types';

export const HALF_DAY_MAX_HOURS = 4;

export function slotHours(slot: AvailabilitySlot): number {
  const [sh, sm] = slot.start_time.split(':').map(Number);
  const [eh, em] = slot.end_time.split(':').map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
}

export function isHalfDaySlot(slot: AvailabilitySlot): boolean {
  return slotHours(slot) <= HALF_DAY_MAX_HOURS;
}
