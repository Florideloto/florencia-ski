import { es, enUS, th } from 'date-fns/locale';

const DATE_FNS_LOCALES: Record<string, typeof enUS> = { en: enUS, es, th };

export function getDateFnsLocale(locale: string): typeof enUS {
  return DATE_FNS_LOCALES[locale] ?? enUS;
}
