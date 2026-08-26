'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

export default function Logo() {
  const locale = useLocale();
  const t = useTranslations('logo');
  return (
    <Link href={`/${locale}`} className="flex items-center gap-3 group">
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Mountain peak shape */}
        <path
          d="M18 4L32 28H4L18 4Z"
          stroke="#bae6fd"
          strokeWidth="1.5"
          fill="none"
          strokeLinejoin="round"
        />
        {/* Inner smaller peak */}
        <path
          d="M18 11L26 25H10L18 11Z"
          fill="#bae6fd"
          fillOpacity="0.15"
        />
        {/* Snow cap */}
        <path
          d="M18 4L22 11H14L18 4Z"
          fill="#bae6fd"
          fillOpacity="0.7"
        />
      </svg>
      <div className="flex flex-col leading-none">
        <span
          className="font-heading font-800 text-lg tracking-widest text-white uppercase group-hover:text-brand-ice transition-colors"
          style={{ fontFamily: 'var(--font-barlow)', fontWeight: 800 }}
        >
          Florencia Segovia
        </span>
        <span
          className="text-xs tracking-[0.2em] text-brand-subtext uppercase"
          style={{ fontFamily: 'var(--font-barlow)', fontWeight: 400 }}
        >
          {t('tagline')}
        </span>
      </div>
    </Link>
  );
}
