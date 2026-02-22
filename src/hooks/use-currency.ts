import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

export type CurrencyCode = 'BRL' | 'USD';

function getCurrencyByLanguage(lang: string): CurrencyCode {
  return lang.startsWith('pt') ? 'BRL' : 'USD';
}

function getCurrencySymbol(currency: CurrencyCode): string {
  return currency === 'BRL' ? 'R$' : '$';
}

function formatCurrencyValue(value: number, suffix: string = '', currency: CurrencyCode = 'BRL'): string {
  const symbol = getCurrencySymbol(currency);
  if (currency === 'USD') {
    const converted = Math.round(value / 5.5);
    if (converted >= 1000000) return `${symbol} ${(converted / 1000000).toFixed(0)}M${suffix}`;
    if (converted >= 1000) return `${symbol} ${(converted / 1000).toFixed(0)}K${suffix}`;
    return `${symbol} ${converted}${suffix}`;
  }
  if (value >= 1000000) return `${symbol} ${(value / 1000000).toFixed(0)}M${suffix}`;
  if (value >= 1000) return `${symbol} ${(value / 1000).toFixed(0)}K${suffix}`;
  return `${symbol} ${value}${suffix}`;
}

export function useCurrency() {
  const { i18n } = useTranslation();

  return useMemo(() => {
    const currency = getCurrencyByLanguage(i18n.language);
    const symbol = getCurrencySymbol(currency);

    return {
      currency,
      symbol,
      format: (value: number) => formatCurrencyValue(value, '', currency),
      formatValue: (value: number, suffix: string = '') => formatCurrencyValue(value, suffix, currency),
      convert: (value: number, from: CurrencyCode, to: CurrencyCode) => {
        if (from === to) return value;
        return from === 'BRL' ? Math.round(value / 5.5) : Math.round(value * 5.5);
      },
      isBRL: currency === 'BRL',
      isUSD: currency === 'USD',
    };
  }, [i18n.language]);
}
