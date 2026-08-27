'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function AboutSection() {
  const t = useTranslations('about');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return (
    <section id="about" className="bg-brand-navy py-24 md:py-32 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-[0.9fr_1.5fr_0.9fr] gap-16 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative aspect-[3/4] max-w-sm mx-auto md:mx-0 lg:h-[460px] lg:w-auto lg:max-w-none overflow-hidden">
              <Image
                src="/about.jpeg"
                alt={t('imageAlt')}
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 90vw, 40vw"
              />
              {/* Decorative border offset */}
              <div className="absolute -bottom-4 -right-4 w-full h-full border border-brand-ice/20 -z-10" />
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
            viewport={{ once: true }}
          >
            <p
              className="text-brand-ice text-xs tracking-[0.3em] uppercase mb-4"
              style={{ fontFamily: 'var(--font-barlow)', fontWeight: 600 }}
            >
              {t('sectionLabel')}
            </p>

            <h2
              className="text-white leading-none mb-6"
              style={{
                fontFamily: 'var(--font-barlow)',
                fontWeight: 900,
                fontSize: 'clamp(2rem, 5vw, 3.75rem)',
                textTransform: 'uppercase',
              }}
            >
              {t('title')}
            </h2>

            <p
              className="text-brand-subtext text-sm tracking-widest uppercase mb-8 leading-relaxed"
              style={{ fontFamily: 'var(--font-barlow)', fontWeight: 600 }}
            >
              {t('credentials')}
            </p>

            <div className="w-12 h-px bg-brand-ice mb-8" />

            <p className="text-brand-text/80 leading-relaxed mb-10 text-lg">
              {t('bio')}
            </p>

            <div className="flex flex-col gap-3 mb-10">
              {(['wordPassion', 'wordProfessionalism', 'wordSafety'] as const).map((key) => (
                <span
                  key={key}
                  className="text-white text-2xl"
                  style={{
                    fontFamily: 'var(--font-barlow)',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {t(key)}
                </span>
              ))}
            </div>

            <a
              href="#method"
              className="inline-flex items-center gap-3 px-6 py-3 border border-brand-border text-brand-subtext text-xs tracking-widest uppercase font-bold hover:border-brand-ice hover:text-white transition-all duration-200 group"
              style={{ fontFamily: 'var(--font-barlow)', fontWeight: 700 }}
            >
              {t('cta')}
              <svg
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </motion.div>

          {/* Video — desktop/tablet only; on mobile the Hero already plays this clip */}
          {!isMobile && (
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
              viewport={{ once: true }}
              className="relative md:col-span-2 lg:col-span-1"
            >
              <div className="relative aspect-[9/16] max-w-[220px] sm:max-w-xs md:max-w-[260px] mx-auto lg:h-[460px] lg:w-auto lg:max-w-none rounded-2xl overflow-hidden shadow-xl shadow-black/40 ring-1 ring-brand-ice/20">
                <video
                  src="/video_esquiando_estable.mp4"
                  poster="/video_esquiando_poster.jpg"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  aria-label={t('videoAriaLabel')}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
