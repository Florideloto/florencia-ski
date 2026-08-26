'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/lib/dateLocale';
import { isHalfDaySlot } from '@/lib/bookingUtils';
import type { AvailabilitySlot, Resort } from '@/lib/types';

interface Props {
  slots: AvailabilitySlot[];
  initialResort: Resort | null;
  initialResortOther: string;
  onRemove: (slotId: string) => void;
  onConfirm: (resort: Resort, resortOther: string) => void;
  onBack: () => void;
}

const RESORTS: Resort[] = ['Hakuba', 'Myoko', 'Shiga Kogen', 'Other'];

function parseSlotDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export default function BookingSummary({ slots, initialResort, initialResortOther, onRemove, onConfirm, onBack }: Props) {
  const t = useTranslations('booking');
  const dateFnsLocale = getDateFnsLocale(useLocale());
  const [resort, setResort] = useState<Resort | null>(initialResort);
  const [resortOther, setResortOther] = useState(initialResortOther);
  const [showError, setShowError] = useState(false);

  const sorted = [...slots].sort((a, b) => a.date.localeCompare(b.date));

  function handleConfirm() {
    if (!resort || (resort === 'Other' && !resortOther.trim())) {
      setShowError(true);
      return;
    }
    onConfirm(resort, resort === 'Other' ? resortOther.trim() : '');
  }

  return (
    <div className="bg-brand-navy border border-brand-border max-w-xl mx-auto">
      <h3
        className="px-6 py-4 border-b border-brand-border text-white text-xl"
        style={{ fontFamily: 'var(--font-barlow)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}
      >
        {t('summary.title')}
      </h3>

      <div className="divide-y divide-brand-border">
        {sorted.map((slot) => (
          <div key={slot.id} className="flex items-center justify-between px-6 py-4">
            <div>
              <span className="text-white text-sm font-bold uppercase" style={{ fontFamily: 'var(--font-barlow)' }}>
                {format(parseSlotDate(slot.date), 'MMMM d, yyyy', { locale: dateFnsLocale })}
              </span>
              <span className="text-brand-ice text-sm ml-2">
                {isHalfDaySlot(slot) ? t('form.durationOptions.3h') : t('form.durationOptions.fullDay')}
              </span>
              <span className="block text-brand-subtext text-xs mt-0.5">
                {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onRemove(slot.id)}
              className="border border-brand-border text-brand-subtext hover:border-red-400 hover:text-red-400 transition-colors px-3 py-1.5 text-xs tracking-widest uppercase"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              {t('summary.remove')}
            </button>
          </div>
        ))}
      </div>

      {/* Resort selector */}
      <div className="px-6 py-5 border-t border-brand-border">
        <p className="text-xs text-brand-subtext tracking-widest uppercase mb-3" style={{ fontFamily: 'var(--font-barlow)' }}>
          {t('resort.label')} *
        </p>
        <div className="grid grid-cols-2 gap-2">
          {RESORTS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => { setResort(r); setShowError(false); }}
              className={`px-3 py-2.5 text-sm font-bold uppercase tracking-wide transition-all duration-150 ${
                resort === r
                  ? 'bg-brand-ice text-brand-dark'
                  : 'border border-brand-border text-brand-subtext hover:border-brand-ice hover:text-white'
              }`}
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              {r === 'Other' ? t('resort.other') : r}
            </button>
          ))}
        </div>
        {resort === 'Other' && (
          <input
            type="text"
            value={resortOther}
            onChange={(e) => { setResortOther(e.target.value); setShowError(false); }}
            placeholder={t('resort.otherPlaceholder')}
            className="mt-3 w-full bg-brand-dark border border-brand-border px-4 py-2.5 text-white text-sm placeholder:text-brand-muted focus:outline-none focus:border-brand-ice transition-colors"
          />
        )}
        {showError && (
          <p className="text-red-400 text-xs mt-2">{t('resort.error')}</p>
        )}
      </div>

      <div className="px-6 py-5">
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full py-3.5 bg-brand-ice text-brand-dark text-sm tracking-widest uppercase font-bold hover:bg-white transition-all duration-200"
          style={{ fontFamily: 'var(--font-barlow)' }}
        >
          {t('summary.confirm')}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="mt-3 w-full text-brand-subtext hover:text-white transition-colors text-xs tracking-widest uppercase text-center"
          style={{ fontFamily: 'var(--font-barlow)' }}
        >
          {t('summary.backToCalendar')}
        </button>
      </div>
    </div>
  );
}
