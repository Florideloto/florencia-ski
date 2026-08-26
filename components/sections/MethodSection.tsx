'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import Image from 'next/image';

const DEFAULT_GRADIENT = 'h-[22%] bg-gradient-to-t from-brand-dark from-0% via-brand-dark/85 via-40% to-transparent';

const methodItems = [
  { key: 'offPiste', image: '/offpiste.jpeg', gradient: DEFAULT_GRADIENT },
  { key: 'kids', image: '/kids.jpeg', gradient: DEFAULT_GRADIENT },
  { key: 'safety', image: '/group.jpeg', gradient: 'h-[14%] bg-gradient-to-t from-brand-dark from-0% via-brand-dark/80 via-45% to-transparent' },
  { key: 'approach', image: '/technique.jpeg', gradient: DEFAULT_GRADIENT },
] as const;

export default function MethodSection() {
  const t = useTranslations('method');

  return (
    <section id="method" className="bg-brand-dark py-24 md:py-32 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="mb-20"
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

        {/* Grid */}
        <div className="grid md:grid-cols-2 gap-px bg-brand-border">
          {methodItems.map((item, i) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-brand-dark p-0 overflow-hidden group relative"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={item.image}
                  alt={t(`items.${item.key}.alt`)}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className={`absolute inset-x-0 bottom-0 ${item.gradient}`} />
              </div>

              <div className="p-8">
                <h3
                  className="text-white text-xl mb-3"
                  style={{
                    fontFamily: 'var(--font-barlow)',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {t(`items.${item.key}.title`)}
                </h3>
                <p className="text-brand-subtext leading-relaxed">
                  {t(`items.${item.key}.text`)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-12 flex justify-center"
        >
          <a
            href="#services"
            className="inline-flex items-center gap-3 px-8 py-4 border border-brand-ice text-brand-ice text-xs tracking-widest uppercase font-bold hover:bg-brand-ice hover:text-brand-dark transition-all duration-200 group"
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
      </div>
    </section>
  );
}
