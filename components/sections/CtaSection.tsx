'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function CtaSection() {
  const t = useTranslations('cta');

  return (
    <section className="bg-brand-dark py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-white mb-10"
          style={{
            fontFamily: 'var(--font-barlow)',
            fontWeight: 700,
            fontSize: 'clamp(1.4rem, 3.2vw, 2rem)',
          }}
        >
          {t('subtitle')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          viewport={{ once: true }}
          className="relative w-full max-w-md sm:max-w-xl aspect-[60/61] rounded-2xl overflow-hidden shadow-xl shadow-black/40"
        >
          <Image
            src="/cta-group-ski-crop.jpg"
            alt={t('imageAlt')}
            fill
            className="object-cover object-center"
            sizes="(max-width: 640px) 90vw, 576px"
          />
          <div className="absolute inset-x-0 bottom-0 h-[26%] bg-gradient-to-t from-brand-dark via-brand-dark/70 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 flex flex-col items-center">
            <a
              href="#booking"
              className="inline-flex items-center gap-3 px-8 py-3.5 bg-brand-ice text-brand-dark text-xs tracking-widest uppercase font-bold hover:bg-white transition-all duration-200"
              style={{ fontFamily: 'var(--font-barlow)', fontWeight: 700 }}
            >
              {t('button')}
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
