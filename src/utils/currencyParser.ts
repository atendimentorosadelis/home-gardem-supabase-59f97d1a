import { getCurrencyByLanguage } from './currencyUtils';

const USD_TO_BRL_RATE = 5.50;
const BRL_TO_USD_RATE = 1 / USD_TO_BRL_RATE;

const CURRENCY_PATTERNS = [
  {
    pattern: /R\$\s?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)/,
    currency: 'BRL' as const,
    extractValue: (match: string) => {
      const numStr = match.replace(/R\$\s?/, '').replace(/\./g, '').replace(',', '.');
      return parseFloat(numStr);
    }
  },
  {
    pattern: /(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+)\s*reais/i,
    currency: 'BRL' as const,
    extractValue: (match: string) => {
      const numStr = match.replace(/\s*reais/i, '').replace(/\./g, '').replace(',', '.');
      return parseFloat(numStr);
    }
  },
  {
    pattern: /(?<!R)\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)/,
    currency: 'USD' as const,
    extractValue: (match: string) => {
      const numStr = match.replace(/\$\s?/, '').replace(/,/g, '');
      return parseFloat(numStr);
    }
  },
  {
    pattern: /(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+)\s*d[oó]lares?/i,
    currency: 'USD' as const,
    extractValue: (match: string) => {
      const numStr = match.replace(/\s*d[oó]lares?/i, '').replace(/\./g, '').replace(',', '.');
      return parseFloat(numStr);
    }
  }
];

function formatToCurrency(value: number, targetCurrency: 'BRL' | 'USD'): string {
  if (targetCurrency === 'BRL') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(value);
  } else {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
}

function convertValue(value: number, from: 'BRL' | 'USD', to: 'BRL' | 'USD'): number {
  if (from === to) return value;
  if (from === 'BRL' && to === 'USD') return value * BRL_TO_USD_RATE;
  if (from === 'USD' && to === 'BRL') return value * USD_TO_BRL_RATE;
  return value;
}

export function parseCurrencyInText(text: string): string {
  const targetCurrency = getCurrencyByLanguage();
  let result = text;

  for (const patternDef of CURRENCY_PATTERNS) {
    const regex = new RegExp(patternDef.pattern.source, patternDef.pattern.flags + 'g');
    result = result.replace(regex, (match) => {
      const value = patternDef.extractValue(match);
      if (isNaN(value)) return match;
      const convertedValue = convertValue(value, patternDef.currency, targetCurrency);
      return formatToCurrency(convertedValue, targetCurrency);
    });
  }

  return result;
}

export function containsCurrency(text: string): boolean {
  return CURRENCY_PATTERNS.some(patternDef => {
    const regex = new RegExp(patternDef.pattern.source, patternDef.pattern.flags);
    return regex.test(text);
  });
}

export function extractCurrencyValues(text: string): Array<{ original: string; value: number; currency: 'BRL' | 'USD' }> {
  const results: Array<{ original: string; value: number; currency: 'BRL' | 'USD' }> = [];

  for (const patternDef of CURRENCY_PATTERNS) {
    let match;
    const regex = new RegExp(patternDef.pattern.source, patternDef.pattern.flags + 'g');
    while ((match = regex.exec(text)) !== null) {
      const value = patternDef.extractValue(match[0]);
      if (!isNaN(value)) {
        results.push({ original: match[0], value, currency: patternDef.currency });
      }
    }
  }

  return results;
}
