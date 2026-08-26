'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

const EMAIL = 'Floriseg@proton.me';

export default function CopyEmailButton({
  buttonClassName,
  buttonStyle,
}: {
  buttonClassName: string;
  buttonStyle?: React.CSSProperties;
}) {
  const t = useTranslations('footer');
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — the mailto link below still works
    }
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button type="button" onClick={handleCopy} className={buttonClassName} style={buttonStyle}>
        {copied ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
        {copied ? t('copied') : t('copyEmail')}
      </button>
      <a href={`mailto:${EMAIL}`} className="text-brand-muted hover:text-brand-subtext text-xs transition-colors">
        {EMAIL}
      </a>
    </div>
  );
}
