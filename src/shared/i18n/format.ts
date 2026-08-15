import { Locale } from '@/shared/i18n/translations';

export function formatDate(dateStr: string, locale: Locale): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export function formatTime(dateStr: string, locale: Locale): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatDateShort(dateStr: string, locale: Locale): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatNumber(num: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en').format(num);
}
