import i18n from '@/i18n';

export function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString(i18n.language, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateShort(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(i18n.language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

export function formatNumber(num: number): string {
  return num.toLocaleString(i18n.language);
}

export function getCurrentLocale(): string {
  return i18n.language;
}
