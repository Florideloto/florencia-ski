'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import ReviewsCarousel from '../reviews/ReviewsCarousel';
import ReviewForm from '../reviews/ReviewForm';
import type { Review } from '@/lib/types';

export default function ReviewsSection() {
  const t = useTranslations('reviews');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch('/api/reviews');
        if (res.ok) {
          const data: Review[] = await res.json();
          setReviews(data);
        }
      } catch {
        // silently fail — section still renders
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, []);

  return (
    <section id="reviews" className="bg-brand-dark py-24 md:py-32 scroll-mt-16">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="mb-14 text-center"
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
              fontSize: 'clamp(1.6rem, 4vw, 2.75rem)',
              textTransform: 'uppercase',
              lineHeight: 1,
            }}
          >
            {t('title')}
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          viewport={{ once: true }}
        >
          {!loading && reviews.length === 0 ? (
            <p className="text-center text-brand-subtext">{t('empty')}</p>
          ) : (
            reviews.length > 0 && <ReviewsCarousel reviews={reviews} />
          )}
        </motion.div>

        <div className="mt-10 flex justify-center">
          {showForm ? (
            <div className="w-full max-w-xl">
              <ReviewForm />
              <button
                onClick={() => setShowForm(false)}
                className="mt-4 w-full text-brand-subtext hover:text-white transition-colors text-xs tracking-widest uppercase"
                style={{ fontFamily: 'var(--font-barlow)' }}
              >
                {t('hideForm')}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2.5 border border-brand-ice text-brand-ice text-xs tracking-widest uppercase font-bold hover:bg-brand-ice hover:text-brand-dark transition-all duration-200"
              style={{ fontFamily: 'var(--font-barlow)', fontWeight: 700 }}
            >
              {t('writeReview')}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
