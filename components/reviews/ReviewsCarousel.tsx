'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import type { Review } from '@/lib/types';
import StarRating from './StarRating';

interface Props {
  reviews: Review[];
}

export default function ReviewsCarousel({ reviews }: Props) {
  const t = useTranslations('reviews');
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  function go(delta: number) {
    setDirection(delta);
    setIndex((i) => (i + delta + reviews.length) % reviews.length);
  }

  function goTo(target: number) {
    setDirection(target > index ? 1 : -1);
    setIndex(target);
  }

  const review = reviews[index];

  return (
    <div className="bg-brand-navy border border-brand-border p-6 sm:p-10">
      <div className="flex items-center gap-4">
        {reviews.length > 1 && (
          <button
            onClick={() => go(-1)}
            aria-label={t('prevAria')}
            className="shrink-0 text-brand-subtext hover:text-white transition-colors p-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={review.id}
              custom={direction}
              initial={{ opacity: 0, x: direction >= 0 ? 40 : -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction >= 0 ? -40 : 40 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left"
            >
              {review.image_url && (
                <div className="shrink-0 w-24 h-24 sm:w-32 sm:h-32 relative overflow-hidden border border-brand-border">
                  <Image
                    src={review.image_url}
                    alt={review.reviewer_name}
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex flex-col items-center sm:items-start gap-3">
                <StarRating rating={review.rating} />
                <p className="text-brand-text text-base sm:text-lg leading-relaxed">
                  &ldquo;{review.text}&rdquo;
                </p>
                <p
                  className="text-brand-ice text-xs tracking-widest uppercase"
                  style={{ fontFamily: 'var(--font-barlow)', fontWeight: 700 }}
                >
                  {review.reviewer_name}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {reviews.length > 1 && (
          <button
            onClick={() => go(1)}
            aria-label={t('nextAria')}
            className="shrink-0 text-brand-subtext hover:text-white transition-colors p-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {reviews.length > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {reviews.map((r, i) => (
            <button
              key={r.id}
              onClick={() => goTo(i)}
              aria-label={t('goToAria', { n: i + 1 })}
              className={`h-1.5 transition-all duration-200 ${
                i === index ? 'w-6 bg-brand-ice' : 'w-1.5 bg-brand-border'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
