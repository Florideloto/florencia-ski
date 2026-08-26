'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import Image from 'next/image';

const serviceKeys = ['private', 'kids', 'offPiste'] as const;
type ServiceKey = (typeof serviceKeys)[number];

const photos: Record<ServiceKey, { src: string; position: string }> = {
  private: { src: '/service-private.jpg', position: 'center 35%' },
  kids: { src: '/service-kids.jpg', position: 'center 25%' },
  offPiste: { src: '/service-offpiste.jpg', position: '25% 55%' },
};

export default function ServicesSection() {
  const t = useTranslations('services');

  return (
    <section id="services" className="bg-brand-navy py-24 md:py-32 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <p
            className="text-brand-ice text-xs tracking-[0.3em] uppercase mb-4"
            style={{ fontFamily: 'var(--font-barlow)', fontWeight: 600 }}
          >
            {t('sectionLabel')}
          </p>
          <h2
            className="text-white"
            style={{
              fontFamily: 'var(--font-barlow)',
              fontWeight: 900,
              fontSize: 'clamp(2rem, 5vw, 3.75rem)',
              textTransform: 'uppercase',
              lineHeight: 1,
            }}
          >
            {t('title')}
          </h2>
        </motion.div>

        {/* Service cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10">
          {serviceKeys.map((key, i) => (
            <ServiceCard key={key} serviceKey={key} index={i} />
          ))}
        </div>

        {/* Price note */}
        <p className="mt-6 text-center text-brand-subtext/70 text-xs italic max-w-lg mx-auto">
          {t('priceNote')}
        </p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-12 flex justify-center"
        >
          <a
            href="#booking"
            className="inline-flex items-center gap-3 px-10 py-4 bg-brand-ice text-brand-dark text-sm tracking-widest uppercase font-bold hover:bg-white transition-all duration-200"
            style={{ fontFamily: 'var(--font-barlow)', fontWeight: 700 }}
          >
            {t('inquire')}
          </a>
        </motion.div>
      </div>
    </section>
  );
}

function ServiceCard({ serviceKey, index }: { serviceKey: ServiceKey; index: number }) {
  const t = useTranslations('services');
  const [duration, setDuration] = useState<'3h' | 'full'>('3h');

  const priceText = duration === '3h' ? t('consult3h') : t('consultFull');

  const durationLabel = duration === '3h' ? t('durationToggle.threeHours') : t('durationToggle.fullDay');

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.08 }}
      viewport={{ once: true }}
      className="bg-brand-navy p-8 flex flex-col gap-6 group hover:bg-brand-dark transition-colors duration-300"
    >
      <div className="relative w-24 h-24 rounded-full overflow-hidden ring-2 ring-white/15 shadow-lg shadow-black/30 group-hover:ring-white/30 transition-all duration-300">
        <Image
          src={photos[serviceKey].src}
          alt={t(`items.${serviceKey}.title`)}
          fill
          sizes="96px"
          className="object-cover"
          style={{ objectPosition: photos[serviceKey].position }}
        />
      </div>

      <div>
        <h3
          className="text-white text-lg mb-3"
          style={{
            fontFamily: 'var(--font-barlow)',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {t(`items.${serviceKey}.title`)}
        </h3>
        <p className="text-brand-subtext text-sm leading-relaxed">
          {t(`items.${serviceKey}.description`)}
        </p>
      </div>

      {/* Duration toggle */}
      <div className="flex border border-white/10">
        <button
          type="button"
          onClick={() => setDuration('3h')}
          className={`flex-1 py-2.5 px-2 text-xs tracking-widest uppercase font-bold transition-all duration-150 ${
            duration === '3h' ? 'bg-white/90 text-brand-dark' : 'text-brand-subtext hover:text-white'
          }`}
          style={{ fontFamily: 'var(--font-barlow)' }}
        >
          {t('durationToggle.threeHours')}
        </button>
        <button
          type="button"
          onClick={() => setDuration('full')}
          className={`flex-1 py-2.5 px-2 text-xs tracking-widest uppercase font-bold border-l border-white/10 transition-all duration-150 ${
            duration === 'full' ? 'bg-white/90 text-brand-dark' : 'text-brand-subtext hover:text-white'
          }`}
          style={{ fontFamily: 'var(--font-barlow)' }}
        >
          {t('durationToggle.fullDay')}
        </button>
      </div>

      <div className="mt-auto pt-6 border-t border-white/10 flex flex-col gap-2 text-xs text-brand-subtext">
        <div className="flex justify-between">
          <span style={{ fontFamily: 'var(--font-barlow)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {t('duration')}
          </span>
          <span>{durationLabel}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ fontFamily: 'var(--font-barlow)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {t('language')}
          </span>
          <span>{t('languages')}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span style={{ fontFamily: 'var(--font-barlow)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {t('price')}
          </span>
          <span className="text-white/90 font-bold text-right" style={{ fontFamily: 'var(--font-barlow)' }}>
            {priceText}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
