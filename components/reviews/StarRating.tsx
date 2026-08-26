'use client';

import { useTranslations } from 'next-intl';

interface Props {
  rating: number;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
};

export default function StarRating({ rating, onChange, size = 'md' }: Props) {
  const t = useTranslations('reviews.form');
  const interactive = Boolean(onChange);
  const sizeClass = SIZE_CLASSES[size];

  return (
    <div className="flex items-center gap-1" role={interactive ? 'radiogroup' : undefined}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= rating;
        const Star = (
          <svg
            className={`${sizeClass} ${filled ? 'text-brand-ice' : 'text-brand-border'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.448a1 1 0 00-.364 1.118l1.287 3.957c.299.922-.756 1.688-1.54 1.118l-3.367-2.447a1 1 0 00-1.176 0l-3.367 2.447c-.783.57-1.838-.196-1.539-1.118l1.286-3.957a1 1 0 00-.363-1.118L2.063 9.385c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.285-3.958z" />
          </svg>
        );

        return interactive ? (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === rating}
            aria-label={t('starAria', { count: star })}
            onClick={() => onChange?.(star)}
            className="transition-transform hover:scale-110"
          >
            {Star}
          </button>
        ) : (
          <span key={star}>{Star}</span>
        );
      })}
    </div>
  );
}
