'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import BookingCalendar from '../booking/BookingCalendar';
import BookingSummary from '../booking/BookingSummary';
import BookingForm from '../booking/BookingForm';
import CopyEmailButton from '@/components/CopyEmailButton';
import type { AvailabilitySlot, Resort } from '@/lib/types';

type Stage = 'calendar' | 'summary' | 'form';

export default function BookingSection() {
  const t = useTranslations('booking');
  const tFooter = useTranslations('footer');
  const [stage, setStage] = useState<Stage>('calendar');
  const [chosenSlots, setChosenSlots] = useState<AvailabilitySlot[]>([]);
  const [resort, setResort] = useState<Resort | null>(null);
  const [resortOther, setResortOther] = useState('');
  const whatsappHref = `https://wa.me/5492616103962?text=${encodeURIComponent(tFooter('whatsappMessage'))}`;

  function handleRemoveFromSummary(slotId: string) {
    setChosenSlots((prev) => {
      const next = prev.filter((s) => s.id !== slotId);
      if (next.length === 0) setStage('calendar');
      return next;
    });
  }

  function handleConfirmSummary(chosenResort: Resort, chosenResortOther: string) {
    setResort(chosenResort);
    setResortOther(chosenResortOther);
    setStage('form');
  }

  return (
    <section id="booking" className="bg-brand-dark py-24 md:py-32 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <p
            className="text-brand-ice text-xs tracking-[0.3em] uppercase mb-4"
            style={{ fontFamily: 'var(--font-barlow)', fontWeight: 600 }}
          >
            {t('sectionLabel')}
          </p>
          <h2
            className="text-white mb-4"
            style={{
              fontFamily: 'var(--font-barlow)',
              fontWeight: 900,
              fontSize: 'clamp(1.6rem, 4vw, 2.75rem)',
              textTransform: 'uppercase',
              lineHeight: 1,
            }}
          >
            {t('title')}
          </h2>
          <p className="text-brand-subtext max-w-xl">{t('subtitle')}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          viewport={{ once: true }}
        >
          {stage === 'calendar' && (
            <BookingCalendar
              onContinue={(slots) => {
                setChosenSlots(slots);
                setStage('summary');
              }}
            />
          )}
          {stage === 'summary' && (
            <BookingSummary
              slots={chosenSlots}
              initialResort={resort}
              initialResortOther={resortOther}
              onRemove={handleRemoveFromSummary}
              onConfirm={handleConfirmSummary}
              onBack={() => setStage('calendar')}
            />
          )}
          {stage === 'form' && resort && (
            <BookingForm
              slots={chosenSlots}
              resort={resort}
              resortOther={resortOther}
              onBack={() => setStage('summary')}
            />
          )}
        </motion.div>

        {/* Direct contact */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-12 pt-8 border-t border-brand-border flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <p className="text-brand-subtext text-sm">
            {t('directContact')}
          </p>
          <div className="flex items-start gap-4">
            <CopyEmailButton
              buttonClassName="flex items-center gap-2 px-5 py-2.5 border border-brand-border text-brand-subtext text-xs tracking-widest uppercase font-semibold hover:border-white hover:text-white transition-all"
              buttonStyle={{ fontFamily: 'var(--font-barlow)', fontWeight: 600 }}
            />
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 border border-brand-border text-brand-subtext text-xs tracking-widest uppercase font-semibold hover:border-green-400 hover:text-green-400 transition-all"
              style={{ fontFamily: 'var(--font-barlow)', fontWeight: 600 }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
