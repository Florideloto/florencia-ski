export const HALF_DAY_MAX_HOURS = 4;

export interface SlotTimes {
  start_time: string;
  end_time: string;
}

export function slotHours(slot: SlotTimes): number {
  const [sh, sm] = slot.start_time.split(':').map(Number);
  const [eh, em] = slot.end_time.split(':').map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
}

export function isHalfDaySlot(slot: SlotTimes): boolean {
  return slotHours(slot) <= HALF_DAY_MAX_HOURS;
}
