import type { Resort } from '@/lib/types';

export const RESORT_COLORS: Record<Resort, string> = {
  Hakuba: 'bg-blue-400',
  Myoko: 'bg-emerald-400',
  'Shiga Kogen': 'bg-orange-400',
  Other: 'bg-gray-400',
};

export const RESORT_LABELS: Record<Resort, string> = {
  Hakuba: 'Hakuba',
  Myoko: 'Myoko',
  'Shiga Kogen': 'Shiga Kogen',
  Other: 'Otro',
};

export const RESORTS: Resort[] = ['Hakuba', 'Myoko', 'Shiga Kogen', 'Other'];
