'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/lib/dateLocale';
import { isHalfDaySlot } from '@/lib/bookingUtils';
import type { AvailabilitySlot, Resort } from '@/lib/types';

interface Props {
  slots: AvailabilitySlot[];
  resort: Resort;
  resortOther: string;
  onBack: () => void;
}

type ServiceType = 'private' | 'kids' | 'offPiste';
type Status = 'idle' | 'submitting' | 'success' | 'error';

function parseSlotDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export default function BookingForm({ slots, resort, resortOther, onBack }: Props) {
  const t = useTranslations('booking');
  const dateFnsLocale = getDateFnsLocale(useLocale());
  const [status, setStatus] = useState<Status>('idle');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    service: '' as ServiceType | '',
    message: '',
  });

  const sortedSlots = [...slots].sort((a, b) => a.date.localeCompare(b.date));
  const resortLabel = resort === 'Other' ? resortOther : resort;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          slots: sortedSlots.map((s) => ({ date: s.date, start_time: s.start_time, end_time: s.end_time })),
          resort,
          resort_other: resort === 'Other' ? resortOther : '',
        }),
      });
      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  const serviceOptions: [ServiceType, string][] = [
    ['private', t('form.serviceOptions.private')],
    ['kids', t('form.serviceOptions.kids')],
    ['offPiste', t('form.serviceOptions.offPiste')],
  ];

  if (status === 'success') {
    return (
      <div className="bg-brand-navy border border-brand-border p-10 text-center flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-brand-ice/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-brand-ice" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3
          className="text-white text-2xl"
          style={{ fontFamily: 'var(--font-barlow)', fontWeight: 800, textTransform: 'uppercase' }}
        >
          {t('form.success')}
        </h3>
        <div className="text-brand-subtext text-sm max-w-sm">
          <p>{t('form.confirmationIntro')}</p>
          <ul className="mt-2 flex flex-col gap-1">
            {sortedSlots.map((slot) => (
              <li key={slot.id} className="text-white">
                {format(parseSlotDate(slot.date), 'MMMM d', { locale: dateFnsLocale })} · {slot.start_time.slice(0, 5)}
                {' — '}
                {isHalfDaySlot(slot) ? t('form.durationOptions.3h') : t('form.durationOptions.fullDay')}
              </li>
            ))}
          </ul>
          <p className="mt-2">📍 {resortLabel}</p>
        </div>
        <a
          href={`https://wa.me/5492616103962?text=${encodeURIComponent(t('form.whatsappMessage'))}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-ice text-sm hover:text-white transition-colors"
        >
          {t('form.whatsappCta')}
        </a>
      </div>
    );
  }

  return (
    <div className="bg-brand-navy border border-brand-border">
      {/* Slots summary + back */}
      <div className="flex items-start justify-between px-6 py-4 border-b border-brand-border gap-4">
        <div>
          <p className="text-brand-ice text-xs tracking-widest uppercase" style={{ fontFamily: 'var(--font-barlow)', fontWeight: 600 }}>
            {t('datesSelected')}
          </p>
          <ul className="mt-1 flex flex-col gap-0.5">
            {sortedSlots.map((slot) => (
              <li key={slot.id} className="text-white text-sm font-medium">
                {format(parseSlotDate(slot.date), 'MMMM d', { locale: dateFnsLocale })} · {slot.start_time.slice(0, 5)}
                {' – '}
                {slot.end_time.slice(0, 5)}
              </li>
            ))}
          </ul>
          <p className="text-brand-subtext text-xs mt-1">📍 {resortLabel}</p>
        </div>
        <button
          onClick={onBack}
          className="shrink-0 text-brand-subtext hover:text-white transition-colors text-xs tracking-widest uppercase"
          style={{ fontFamily: 'var(--font-barlow)' }}
        >
          {t('form.back')}
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 grid sm:grid-cols-2 gap-5">
        <h3
          className="sm:col-span-2 text-white text-xl mb-1"
          style={{ fontFamily: 'var(--font-barlow)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}
        >
          {t('form.title')}
        </h3>

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-brand-subtext tracking-widest uppercase" style={{ fontFamily: 'var(--font-barlow)' }}>
            {t('form.name')} *
          </label>
          <input
            name="name"
            type="text"
            required
            value={form.name}
            onChange={handleChange}
            placeholder={t('form.namePlaceholder')}
            className="bg-brand-dark border border-brand-border px-4 py-2.5 text-white text-sm placeholder:text-brand-muted focus:outline-none focus:border-brand-ice transition-colors"
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-brand-subtext tracking-widest uppercase" style={{ fontFamily: 'var(--font-barlow)' }}>
            {t('form.email')} *
          </label>
          <input
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder={t('form.emailPlaceholder')}
            className="bg-brand-dark border border-brand-border px-4 py-2.5 text-white text-sm placeholder:text-brand-muted focus:outline-none focus:border-brand-ice transition-colors"
          />
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-brand-subtext tracking-widest uppercase" style={{ fontFamily: 'var(--font-barlow)' }}>
            {t('form.phone')}
          </label>
          <input
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder={t('form.phonePlaceholder')}
            className="bg-brand-dark border border-brand-border px-4 py-2.5 text-white text-sm placeholder:text-brand-muted focus:outline-none focus:border-brand-ice transition-colors"
          />
        </div>

        {/* Service */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-brand-subtext tracking-widest uppercase" style={{ fontFamily: 'var(--font-barlow)' }}>
            {t('form.service')} *
          </label>
          <select
            name="service"
            required
            value={form.service}
            onChange={handleChange}
            className="bg-brand-dark border border-brand-border px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-ice transition-colors appearance-none"
          >
            <option value="" disabled>{t('form.servicePlaceholder')}</option>
            {serviceOptions.map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        {/* Message */}
        <div className="sm:col-span-2 flex flex-col gap-1.5">
          <label className="text-xs text-brand-subtext tracking-widest uppercase" style={{ fontFamily: 'var(--font-barlow)' }}>
            {t('form.message')}
          </label>
          <textarea
            name="message"
            rows={3}
            value={form.message}
            onChange={handleChange}
            placeholder={t('form.messagePlaceholder')}
            className="bg-brand-dark border border-brand-border px-4 py-2.5 text-white text-sm placeholder:text-brand-muted focus:outline-none focus:border-brand-ice transition-colors resize-none"
          />
        </div>

        {/* Submit */}
        <div className="sm:col-span-2">
          {status === 'error' && (
            <p className="text-red-400 text-sm mb-3">{t('form.error')}</p>
          )}
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full py-4 bg-brand-ice text-brand-dark text-sm tracking-widest uppercase font-bold hover:bg-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ fontFamily: 'var(--font-barlow)', fontWeight: 700 }}
          >
            {status === 'submitting' ? t('form.submitting') : t('form.submit')}
          </button>
        </div>
      </form>
    </div>
  );
}
