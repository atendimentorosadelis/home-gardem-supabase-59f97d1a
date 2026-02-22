import i18n from '@/i18n';

const USD_TO_BRL_RATE = 5.50;
const BRL_TO_USD_RATE = 1 / USD_TO_BRL_RATE;

export type CurrencyCode = 'BRL' | 'USD';

export function getCurrencyByLanguage(): CurrencyCode {
  const lang = i18n.language;
  return lang === 'pt-BR' || lang === 'pt' ? 'BRL' : 'USD';
}

export function getCurrencySymbol(): string {
  return getCurrencyByLanguage() === 'BRL' ? 'R$' : '$';
}

export function formatCurrency(
  value: number,
  options: {
    sourceIn?: CurrencyCode;
    showDecimals?: boolean;
    compact?: boolean;
  } = {}
): string {
  const { sourceIn = 'BRL', showDecimals = false, compact = false } = options;
  const targetCurrency = getCurrencyByLanguage();

  let convertedValue = value;
  if (sourceIn === 'BRL' && targetCurrency === 'USD') {
    convertedValue = value * BRL_TO_USD_RATE;
  } else if (sourceIn === 'USD' && targetCurrency === 'BRL') {
    convertedValue = value * USD_TO_BRL_RATE;
  }

  const locale = i18n.language === 'pt-BR' ? 'pt-BR' : i18n.language === 'es' ? 'es-ES' : 'en-US';

  if (compact) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: targetCurrency,
      notation: 'compact',
      maximumFractionDigits: showDecimals ? 2 : 0,
    }).format(convertedValue);
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: targetCurrency,
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(convertedValue);
}

export function formatCurrencyValue(valueBRL: number, suffix: string = ''): string {
  const targetCurrency = getCurrencyByLanguage();
  const symbol = getCurrencySymbol();

  let displayValue = valueBRL;
  if (targetCurrency === 'USD') {
    displayValue = Math.round(valueBRL * BRL_TO_USD_RATE);
  }

  const locale = i18n.language === 'pt-BR' ? 'pt-BR' : i18n.language === 'es' ? 'es-ES' : 'en-US';
  const formattedNumber = new Intl.NumberFormat(locale).format(displayValue);

  return `${symbol} ${formattedNumber}${suffix}`;
}

export function convertCurrency(value: number, from: CurrencyCode, to: CurrencyCode): number {
  if (from === to) return value;
  if (from === 'BRL' && to === 'USD') return value * BRL_TO_USD_RATE;
  if (from === 'USD' && to === 'BRL') return value * USD_TO_BRL_RATE;
  return value;
}

export function getExchangeRateInfo(): { rate: number; from: CurrencyCode; to: CurrencyCode } {
  return { rate: USD_TO_BRL_RATE, from: 'USD', to: 'BRL' };
}
