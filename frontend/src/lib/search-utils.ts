const TICKER_PATTERN = /^[A-Z0-9.\-^=]+$/;

export function normalizeSearchText(value: string) {
  return value.trim();
}

export function looksLikeTickerInput(value: string) {
  const trimmed = normalizeSearchText(value).toUpperCase();
  return trimmed.length > 0 && trimmed.length <= 24 && TICKER_PATTERN.test(trimmed);
}

export function getPrimarySearchCandidateSymbol(
  query: string,
  symbols: string[],
) {
  if (symbols.length === 0) {
    return null;
  }

  const trimmedUpper = normalizeSearchText(query).toUpperCase();
  if (!trimmedUpper) {
    return null;
  }

  const exactSymbolMatch = symbols.find((symbol) => symbol === trimmedUpper);
  if (exactSymbolMatch) {
    return exactSymbolMatch;
  }

  return symbols[0];
}
