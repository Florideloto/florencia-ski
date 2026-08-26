'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function HeroSection() {
  const t = useTranslations('hero');
  const tNav = useTranslations('nav');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return (
    <section className="relative h-screen min-h-[600px] flex items-end overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        {isMobile ? (
          <video
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster="/hero.jpeg"
            aria-hidden="true"
          >
            <source src="/video_esquiando_estable.mp4" type="video/mp4" />
          </video>
        ) : (
          <Image
            src="/hero.jpeg"
            alt={t('imageAlt')}
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
        )}
        {/* Dark overlay concentrated behind the text, not across the whole shot */}
        <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-brand-dark/95 via-brand-dark/55 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pb-14 md:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="max-w-lg"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-brand-ice text-xs tracking-[0.3em] uppercase mb-4"
            style={{ fontFamily: 'var(--font-barlow)', fontWeight: 600 }}
          >
            {t('location')}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className={isMobile ? 'text-white leading-[0.95] mb-6' : 'text-white leading-[0.95] mb-2'}
            style={{
              fontFamily: 'var(--font-barlow)',
              fontWeight: 900,
              fontSize: isMobile ? 'clamp(2.3rem, 10vw, 3.2rem)' : 'clamp(1.75rem, 4.2vw, 3rem)',
              textTransform: 'uppercase',
              letterSpacing: '-0.01em',
            }}
          >
            {t('title')}
          </motion.h1>

          {!isMobile && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="text-brand-ice/90 mb-6"
              style={{
                fontFamily: 'var(--font-barlow)',
                fontWeight: 600,
                fontSize: 'clamp(0.8rem, 1.8vw, 1.05rem)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {t('subtitle')}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <a
              href="#about"
              className="inline-flex items-center gap-3 px-6 py-3 border border-white text-white text-xs tracking-widest uppercase font-bold hover:bg-white hover:text-brand-dark transition-all duration-200 group"
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
            <a
              href="#booking"
              className="inline-flex items-center gap-3 px-6 py-3 bg-brand-ice text-brand-dark text-xs tracking-widest uppercase font-bold hover:bg-white transition-all duration-200"
              style={{ fontFamily: 'var(--font-barlow)', fontWeight: 700 }}
            >
              {tNav('book')}
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute bottom-6 right-6 hidden sm:flex flex-col items-center gap-2"
      >
        <span className="text-white/40 text-xs tracking-widest uppercase" style={{ fontFamily: 'var(--font-barlow)' }}>
          {t('scroll')}
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-px h-10 bg-gradient-to-b from-white/40 to-transparent"
        />
      </motion.div>
    </section>
  );
}
