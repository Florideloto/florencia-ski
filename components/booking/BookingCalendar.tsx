'use client';

import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, isBefore, startOfToday, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { useTranslations, useLocale } from 'next-intl';
import { getDateFnsLocale } from '@/lib/dateLocale';
import { isHalfDaySlot } from '@/lib/bookingUtils';
import type { AvailabilitySlot } from '@/lib/types';
import 'react-day-picker/style.css';

interface Props {
  onContinue: (slots: AvailabilitySlot[]) => void;
}

const SEASON_START = new Date(2026, 11, 1); // Dec 2026
const SEASON_END = new Date(2027, 1, 28);   // Feb 2027

export default function BookingCalendar({ onContinue }: Props) {
  const t = useTranslations('booking');
  const dateFnsLocale = getDateFnsLocale(useLocale());
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [chosenSlots, setChosenSlots] = useState<Record<string, AvailabilitySlot>>({});
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState<Date>(SEASON_START);

  // Fetch all available dates for the currently displayed month
  useEffect(() => {
    async function fetchSlots() {
      setLoading(true);
      try {
        const from = format(startOfMonth(month), 'yyyy-MM-dd');
        const to = format(endOfMonth(month), 'yyyy-MM-dd');
        const res = await fetch(`/api/availability?from=${from}&to=${to}`);
        if (res.ok) {
          const data: AvailabilitySlot[] = await res.json();
          setAvailableSlots(data);
        }
      } catch {
        // silently fail — calendar still renders
      } finally {
        setLoading(false);
      }
    }
    fetchSlots();
  }, [month]);

  const availableDates = new Set(
    availableSlots.filter((s) => !s.is_booked).map((s) => s.date)
  );

  function isDateAvailable(date: Date) {
    return availableDates.has(format(date, 'yyyy-MM-dd'));
  }

  function isDisabled(date: Date) {
    return (
      isBefore(date, startOfToday()) ||
      !isWithinInterval(date, { start: SEASON_START, end: SEASON_END }) ||
      !isDateAvailable(date)
    );
  }

  function handleSelectDates(days: Date[] | undefined) {
    const next = days ?? [];
    setSelectedDates(next);
    const nextKeys = new Set(next.map((d) => format(d, 'yyyy-MM-dd')));
    setChosenSlots((prev) => {
      const filtered: Record<string, AvailabilitySlot> = {};
      for (const [key, slot] of Object.entries(prev)) {
        if (nextKeys.has(key)) filtered[key] = slot;
      }
      return filtered;
    });
  }

  function removeDate(dateStr: string) {
    setSelectedDates((prev) => prev.filter((d) => format(d, 'yyyy-MM-dd') !== dateStr));
    setChosenSlots((prev) => {
      const next = { ...prev };
      delete next[dateStr];
      return next;
    });
  }

  function chooseSlot(dateStr: string, slot: AvailabilitySlot) {
    setChosenSlots((prev) => ({ ...prev, [dateStr]: slot }));
  }

  const sortedDateKeys = selectedDates
    .map((d) => format(d, 'yyyy-MM-dd'))
    .sort((a, b) => a.localeCompare(b));

  const allChosen = sortedDateKeys.length > 0 && sortedDateKeys.every((key) => chosenSlots[key]);

  return (
    <div>
      {/* How to book — 3 steps */}
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        {(
          [
            [t('steps.pickDay'), 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'],
            [t('steps.pickDuration'), 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'],
            [t('steps.fillDetails'), 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'],
          ] as const
        ).map(([label, icon], i) => (
          <div
            key={label}
            className="flex items-center gap-3 bg-brand-navy border border-brand-border px-4 py-3"
          >
            <span
              className="shrink-0 w-8 h-8 rounded-full bg-brand-ice text-brand-dark flex items-center justify-center text-sm"
              style={{ fontFamily: 'var(--font-barlow)', fontWeight: 800 }}
            >
              {i + 1}
            </span>
            <svg className="w-5 h-5 text-brand-ice shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
            </svg>
            <span className="text-white text-sm font-semibold leading-tight">{label}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Calendar */}
        <div className="flex-1">
          <div className="bg-brand-navy border-2 border-brand-ice/25 p-6 md:p-8">
            <DayPicker
              mode="multiple"
              locale={dateFnsLocale}
              selected={selectedDates}
              onSelect={handleSelectDates}
              month={month}
              onMonthChange={setMonth}
              disabled={isDisabled}
              startMonth={SEASON_START}
              endMonth={SEASON_END}
              labels={{
                labelPrevious: () => t('prevMonth'),
                labelNext: () => t('nextMonth'),
              }}
              modifiers={{
                available: (date) =>
                  isWithinInterval(date, { start: SEASON_START, end: SEASON_END }) &&
                  !isBefore(date, startOfToday()) &&
                  isDateAvailable(date),
              }}
              modifiersClassNames={{
                available: '!text-brand-ice !font-bold !border-2 !border-brand-ice/60 !rounded-full',
              }}
              classNames={{
                root: 'rdp-custom w-full',
                months: 'flex flex-col',
                month: 'w-full',
                month_caption: 'flex justify-between items-center mb-5 px-2',
                caption_label: 'text-white text-base md:text-lg tracking-widest uppercase font-bold',
                nav: 'flex gap-2',
                button_previous: 'text-brand-subtext hover:text-white transition-colors p-2',
                button_next: 'text-brand-subtext hover:text-white transition-colors p-2',
                chevron: 'fill-brand-ice w-5 h-5',
                weeks: 'w-full',
                weekdays: 'grid grid-cols-7 mb-2',
                weekday: 'text-brand-subtext text-xs text-center py-2 tracking-widest uppercase font-semibold',
                week: 'grid grid-cols-7 gap-1 mb-1',
                day: 'aspect-square flex items-center justify-center',
                day_button:
                  'w-full h-full flex items-center justify-center text-base md:text-lg rounded-full transition-all duration-150 text-brand-subtext disabled:opacity-20 disabled:cursor-not-allowed hover:enabled:bg-brand-ice/10',
                selected:
                  '!bg-brand-ice !text-brand-dark !font-extrabold !border-2 !border-brand-ice',
                today: 'ring-2 ring-white/50',
                outside: 'opacity-20',
              }}
            />
            {loading && (
              <p className="text-center text-brand-subtext text-xs mt-2">{t('loading')}</p>
            )}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-6 mt-5 pt-5 border-t border-brand-border">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-brand-ice/60" />
                <span className="text-xs text-brand-subtext tracking-wider uppercase font-semibold" style={{ fontFamily: 'var(--font-barlow)' }}>
                  {t('available')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-brand-ice" />
                <span className="text-xs text-brand-subtext tracking-wider uppercase font-semibold" style={{ fontFamily: 'var(--font-barlow)' }}>
                  {t('chosen')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-brand-border opacity-40" />
                <span className="text-xs text-brand-subtext tracking-wider uppercase font-semibold" style={{ fontFamily: 'var(--font-barlow)' }}>
                  {t('unavailable')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected days + duration per day */}
        <div className="lg:w-80">
          <div className="bg-brand-navy border-2 border-brand-ice/25 p-6 h-full flex flex-col">
            {sortedDateKeys.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <svg className="w-10 h-10 text-brand-border mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-brand-subtext text-sm">{t('selectDate')}</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3 mb-4">
                  {sortedDateKeys.map((dateStr) => {
                    const date = selectedDates.find((d) => format(d, 'yyyy-MM-dd') === dateStr)!;
                    const slotsForDay = availableSlots.filter((s) => s.date === dateStr && !s.is_booked);
                    return (
                      <DaySlotPicker
                        key={dateStr}
                        date={date}
                        slots={slotsForDay}
                        chosen={chosenSlots[dateStr]}
                        onChoose={(slot) => chooseSlot(dateStr, slot)}
                        onRemove={() => removeDate(dateStr)}
                        dateFnsLocale={dateFnsLocale}
                      />
                    );
                  })}
                </div>
                <button
                  type="button"
                  disabled={!allChosen}
                  onClick={() => onContinue(sortedDateKeys.map((key) => chosenSlots[key]))}
                  className="mt-auto w-full py-3.5 bg-brand-ice text-brand-dark text-sm tracking-widest uppercase font-bold hover:bg-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'var(--font-barlow)' }}
                >
                  {t('continueCta')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DaySlotPicker({
  date,
  slots,
  chosen,
  onChoose,
  onRemove,
  dateFnsLocale,
}: {
  date: Date;
  slots: AvailabilitySlot[];
  chosen: AvailabilitySlot | undefined;
  onChoose: (slot: AvailabilitySlot) => void;
  onRemove: () => void;
  dateFnsLocale: ReturnType<typeof getDateFnsLocale>;
}) {
  const t = useTranslations('booking');
  const halfDaySlots = slots.filter(isHalfDaySlot);
  const fullDaySlots = slots.filter((s) => !isHalfDaySlot(s));

  function pick(bucket: AvailabilitySlot[]) {
    if (bucket.length > 0) onChoose(bucket[0]);
  }

  return (
    <div className="border-2 border-brand-border p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white text-sm font-bold uppercase" style={{ fontFamily: 'var(--font-barlow)' }}>
          {format(date, 'MMMM d', { locale: dateFnsLocale })}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={t('summary.remove')}
          className="text-brand-subtext hover:text-red-400 transition-colors px-1"
        >
          ✕
        </button>
      </div>
      <div className="flex border border-brand-border">
        <button
          type="button"
          disabled={halfDaySlots.length === 0}
          onClick={() => pick(halfDaySlots)}
          className={`flex-1 py-2 px-1 text-xs tracking-wide uppercase font-bold transition-all duration-150 disabled:opacity-20 disabled:cursor-not-allowed ${
            chosen && halfDaySlots.some((s) => s.id === chosen.id) ? 'bg-brand-ice text-brand-dark' : 'text-brand-subtext hover:text-white'
          }`}
          style={{ fontFamily: 'var(--font-barlow)' }}
        >
          {t('form.durationOptions.3h')}
        </button>
        <button
          type="button"
          disabled={fullDaySlots.length === 0}
          onClick={() => pick(fullDaySlots)}
          className={`flex-1 py-2 px-1 text-xs tracking-wide uppercase font-bold border-l border-brand-border transition-all duration-150 disabled:opacity-20 disabled:cursor-not-allowed ${
            chosen && fullDaySlots.some((s) => s.id === chosen.id) ? 'bg-brand-ice text-brand-dark' : 'text-brand-subtext hover:text-white'
          }`}
          style={{ fontFamily: 'var(--font-barlow)' }}
        >
          {t('form.durationOptions.fullDay')}
        </button>
      </div>
      {chosen && (
        <p className="text-brand-subtext text-xs mt-1.5">
          {chosen.start_time.slice(0, 5)} – {chosen.end_time.slice(0, 5)}
        </p>
      )}
    </div>
  );
}
