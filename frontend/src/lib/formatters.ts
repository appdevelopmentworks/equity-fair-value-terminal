import {APP_LOCALE_TAGS, type AppLocale} from "@/lib/i18n-config";

function getLocaleTag(locale: AppLocale) {
  return APP_LOCALE_TAGS[locale];
}

export function formatCurrency(value: number, currency: string, locale: AppLocale) {
  try {
    return new Intl.NumberFormat(getLocaleTag(locale), {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${formatPlainNumber(value, locale, 2)} ${currency}`;
  }
}

export function formatSignedCurrency(value: number, currency: string, locale: AppLocale) {
  const absolute = formatCurrency(Math.abs(value), currency, locale);
  if (value > 0) {
    return `+${absolute}`;
  }
  if (value < 0) {
    return `-${absolute}`;
  }
  return absolute;
}

export function formatPercent(
  value: number,
  locale: AppLocale,
  options?: {forceSign?: boolean; ratio?: boolean},
) {
  return new Intl.NumberFormat(getLocaleTag(locale), {
    style: "percent",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    signDisplay: options?.forceSign ? "always" : "auto",
  }).format(options?.ratio ? value : value / 100);
}

export function formatPlainNumber(value: number, locale: AppLocale, digits = 2) {
  return new Intl.NumberFormat(getLocaleTag(locale), {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function formatCompactNumber(value: number, locale: AppLocale) {
  return new Intl.NumberFormat(getLocaleTag(locale), {
    notation: "compact",
    maximumFractionDigits: value >= 1_000_000 ? 1 : 0,
  }).format(value);
}

export function formatAsOfLabel(value: string, locale: AppLocale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(getLocaleTag(locale), {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(date);
}
