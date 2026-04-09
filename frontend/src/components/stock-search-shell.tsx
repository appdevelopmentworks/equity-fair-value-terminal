"use client";

import {useDeferredValue, useEffect, useRef, useState} from "react";
import {Building2, Search as SearchIcon, Sparkles} from "lucide-react";
import {CandlestickChartPanel} from "@/components/candlestick-chart-panel";
import {ErrorNotice} from "@/components/error-notice";
import {LanguageToggle} from "@/components/language-toggle";
import {LoadingPanel} from "@/components/loading-panel";
import {ResultCard} from "@/components/result-card";
import {SearchForm} from "@/components/search-form";
import {ThemeToggle} from "@/components/theme-toggle";
import {ValuationCardsSection} from "@/components/valuation-cards-section";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {fetchChart, fetchQuote, fetchValuations, searchSymbols} from "@/lib/bridge";
import {getUserFacingErrorCopy} from "@/lib/error-messages";
import {useI18n} from "@/lib/i18n";
import {getPrimarySearchCandidateSymbol, looksLikeTickerInput, normalizeSearchText} from "@/lib/search-utils";
import type {ChartBridgeResponse, ChartRange, ChartSuccessResponse} from "@/types/chart";
import type {BridgeErrorResponse, QuoteBridgeResponse, QuoteSuccessResponse} from "@/types/quote";
import type {
  SearchBridgeResponse,
  SearchCandidate,
  SearchSuggestionState,
  SearchSuccessResponse,
} from "@/types/search";
import type {ValuationsBridgeResponse, ValuationsSuccessResponse} from "@/types/valuation";

const THEME_STORAGE_KEY = "eqfv-theme";
const DEFAULT_CHART_RANGE: ChartRange = "6M";
const QUICK_PICKS = ["AAPL", "MSFT", "7203.T", "6758.T"];
const SEARCH_MINIMUM_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 220;

type SearchNoticeKind = "blank" | "no-match" | "provider-unavailable";

function isQuoteSuccessResponse(response: QuoteBridgeResponse): response is QuoteSuccessResponse {
  return response.ok;
}

function isChartSuccessResponse(response: ChartBridgeResponse): response is ChartSuccessResponse {
  return response.ok;
}

function isSearchSuccessResponse(response: SearchBridgeResponse): response is SearchSuccessResponse {
  return response.ok;
}

function isValuationsSuccessResponse(response: ValuationsBridgeResponse): response is ValuationsSuccessResponse {
  return response.ok;
}

function normalizeUnexpectedError(message?: string): BridgeErrorResponse {
  return {
    ok: false,
    errorCode: "UNKNOWN_ERROR",
    message: message ?? "Internal processing failed. Please restart the app and try again.",
    retryable: true,
  };
}

type SearchResolution =
  | {kind: "resolved"; symbol: string}
  | {kind: "empty"}
  | {kind: "error"};

export function StockSearchShell() {
  const {copy, locale} = useI18n();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [theme, setTheme] = useState("dark");
  const [selectedRange, setSelectedRange] = useState<ChartRange>(DEFAULT_CHART_RANGE);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [isValuationsLoading, setIsValuationsLoading] = useState(false);
  const [quote, setQuote] = useState<QuoteSuccessResponse | null>(null);
  const [chart, setChart] = useState<ChartSuccessResponse | null>(null);
  const [valuations, setValuations] = useState<ValuationsSuccessResponse | null>(null);
  const [quoteError, setQuoteError] = useState<BridgeErrorResponse | null>(null);
  const [chartError, setChartError] = useState<BridgeErrorResponse | null>(null);
  const [valuationsError, setValuationsError] = useState<BridgeErrorResponse | null>(null);
  const [suggestions, setSuggestions] = useState<SearchCandidate[]>([]);
  const [suggestionsState, setSuggestionsState] = useState<SearchSuggestionState>("idle");
  const [suggestionsError, setSuggestionsError] = useState<BridgeErrorResponse | null>(null);
  const [searchNoticeKind, setSearchNoticeKind] = useState<SearchNoticeKind | null>(null);
  const quoteRequestIdRef = useRef(0);
  const chartRequestIdRef = useRef(0);
  const searchRequestIdRef = useRef(0);
  const submittedSearchLookupIdRef = useRef(0);
  const valuationsRequestIdRef = useRef(0);
  const searchCacheRef = useRef<Map<string, SearchSuccessResponse>>(new Map());

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const nextTheme = storedTheme === "light" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const normalizedQuery = normalizeSearchText(deferredQuery);
    if (normalizedQuery.length < SEARCH_MINIMUM_LENGTH) {
      searchRequestIdRef.current += 1;
      setSuggestions([]);
      setSuggestionsState("idle");
      setSuggestionsError(null);
      return;
    }

    const cacheKey = normalizedQuery.toLocaleLowerCase();
    const cachedResponse = searchCacheRef.current.get(cacheKey);
    if (cachedResponse) {
      setSuggestions(cachedResponse.results);
      setSuggestionsState(cachedResponse.results.length > 0 ? "ready" : "empty");
      setSuggestionsError(null);
      return;
    }

    const timerId = window.setTimeout(async () => {
      const requestId = ++searchRequestIdRef.current;
      setSuggestionsState("loading");
      setSuggestionsError(null);

      try {
        const response = await searchSymbols(normalizedQuery);
        if (requestId !== searchRequestIdRef.current) {
          return;
        }

        if (isSearchSuccessResponse(response)) {
          searchCacheRef.current.set(cacheKey, response);
          setSuggestions(response.results);
          setSuggestionsState(response.results.length > 0 ? "ready" : "empty");
          setSuggestionsError(null);
        } else {
          setSuggestions([]);
          setSuggestionsState("error");
          setSuggestionsError(response);
        }
      } catch (caughtError) {
        if (requestId !== searchRequestIdRef.current) {
          return;
        }

        const message = caughtError instanceof Error ? caughtError.message : undefined;
        setSuggestions([]);
        setSuggestionsState("error");
        setSuggestionsError(normalizeUnexpectedError(message));
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timerId);
  }, [deferredQuery]);

  async function resolveCandidateSymbolFromQuery(normalizedQuery: string): Promise<SearchResolution> {
    const cacheKey = normalizedQuery.toLocaleLowerCase();
    const cachedResponse = searchCacheRef.current.get(cacheKey);
    if (cachedResponse) {
      setSuggestions(cachedResponse.results);
      setSuggestionsState(cachedResponse.results.length > 0 ? "ready" : "empty");
      setSuggestionsError(null);
      const cachedSymbol = getPrimarySearchCandidateSymbol(
        normalizedQuery,
        cachedResponse.results.map((candidate) => candidate.symbol),
      );
      return cachedSymbol ? {kind: "resolved", symbol: cachedSymbol} : {kind: "empty"};
    }

    const requestId = ++submittedSearchLookupIdRef.current;
    setSuggestionsState("loading");
    setSuggestionsError(null);

    try {
      const response = await searchSymbols(normalizedQuery);
      if (requestId !== submittedSearchLookupIdRef.current) {
        return {kind: "empty"};
      }

      if (!isSearchSuccessResponse(response)) {
        setSuggestions([]);
        setSuggestionsState("error");
        setSuggestionsError(response);
        return {kind: "error"};
      }

      searchCacheRef.current.set(cacheKey, response);
      setSuggestions(response.results);
      setSuggestionsState(response.results.length > 0 ? "ready" : "empty");
      setSuggestionsError(null);

      const resolvedSymbol = getPrimarySearchCandidateSymbol(
        normalizedQuery,
        response.results.map((candidate) => candidate.symbol),
      );
      return resolvedSymbol ? {kind: "resolved", symbol: resolvedSymbol} : {kind: "empty"};
    } catch (caughtError) {
      if (requestId !== submittedSearchLookupIdRef.current) {
        return {kind: "empty"};
      }

      const message = caughtError instanceof Error ? caughtError.message : undefined;
      setSuggestions([]);
      setSuggestionsState("error");
      setSuggestionsError(normalizeUnexpectedError(message));
      return {kind: "error"};
    }
  }

  async function loadChart(ticker: string, chartRange: ChartRange) {
    const requestId = ++chartRequestIdRef.current;
    const canPreserveCurrentChart = chart?.ticker === ticker && chart.range === chartRange;
    setIsChartLoading(true);
    setChartError(null);

    try {
      const response = await fetchChart(ticker, chartRange);
      if (requestId !== chartRequestIdRef.current) {
        return;
      }

      if (isChartSuccessResponse(response)) {
        setChart(response);
      } else {
        if (!canPreserveCurrentChart) {
          setChart(null);
        }
        setChartError(response);
      }
    } catch (caughtError) {
      if (requestId !== chartRequestIdRef.current) {
        return;
      }

      const message = caughtError instanceof Error ? caughtError.message : undefined;
      if (!canPreserveCurrentChart) {
        setChart(null);
      }
      setChartError(normalizeUnexpectedError(message));
    } finally {
      if (requestId === chartRequestIdRef.current) {
        setIsChartLoading(false);
      }
    }
  }

  async function loadValuations(ticker: string) {
    const requestId = ++valuationsRequestIdRef.current;
    const canPreserveCurrentValuations = valuations?.ticker === ticker;
    setIsValuationsLoading(true);
    setValuationsError(null);

    try {
      const response = await fetchValuations(ticker);
      if (requestId !== valuationsRequestIdRef.current) {
        return;
      }

      if (isValuationsSuccessResponse(response)) {
        setValuations(response);
      } else {
        if (!canPreserveCurrentValuations) {
          setValuations(null);
        }
        setValuationsError(response);
      }
    } catch (caughtError) {
      if (requestId !== valuationsRequestIdRef.current) {
        return;
      }

      const message = caughtError instanceof Error ? caughtError.message : undefined;
      if (!canPreserveCurrentValuations) {
        setValuations(null);
      }
      setValuationsError(normalizeUnexpectedError(message));
    } finally {
      if (requestId === valuationsRequestIdRef.current) {
        setIsValuationsLoading(false);
      }
    }
  }

  async function handleSearch(submittedValue?: string) {
    if (isQuoteLoading) {
      return;
    }

    const rawValue = submittedValue ?? query;
    const trimmed = normalizeSearchText(rawValue);
    if (!trimmed) {
      setSearchNoticeKind("blank");
      return;
    }

    const isTickerSearch = looksLikeTickerInput(trimmed);
    let resolvedTarget = trimmed;

    if (!isTickerSearch) {
      const searchResolution = await resolveCandidateSymbolFromQuery(trimmed);
      if (searchResolution.kind !== "resolved") {
        setSearchNoticeKind(searchResolution.kind === "error" ? "provider-unavailable" : "no-match");
        return;
      }

      resolvedTarget = searchResolution.symbol;
    }

    const requestId = ++quoteRequestIdRef.current;
    chartRequestIdRef.current += 1;
    valuationsRequestIdRef.current += 1;
    setIsQuoteLoading(true);
    setQuoteError(null);
    setSearchNoticeKind(null);

    try {
      const response = await fetchQuote(resolvedTarget);
      if (requestId !== quoteRequestIdRef.current) {
        return;
      }

      if (isQuoteSuccessResponse(response)) {
        setQuote(response);
        setQuery(response.ticker);
        setSuggestions([]);
        setSuggestionsState("idle");
        setSuggestionsError(null);
        setChart(null);
        setChartError(null);
        setValuations(null);
        setValuationsError(null);
        void loadChart(response.ticker, selectedRange);
        void loadValuations(response.ticker);
      } else {
        setQuoteError(response);
      }
    } catch (caughtError) {
      if (requestId !== quoteRequestIdRef.current) {
        return;
      }

      const message = caughtError instanceof Error ? caughtError.message : undefined;
      setQuoteError(normalizeUnexpectedError(message));
    } finally {
      if (requestId === quoteRequestIdRef.current) {
        setIsQuoteLoading(false);
      }
    }
  }

  function handleRangeChange(nextRange: ChartRange) {
    if (selectedRange === nextRange && chart && !chartError) {
      return;
    }

    setSelectedRange(nextRange);

    if (quote) {
      void loadChart(quote.ticker, nextRange);
    }
  }

  function handleQueryChange(nextValue: string) {
    setQuery(nextValue);
    setSearchNoticeKind(null);
    if (quoteError) {
      setQuoteError(null);
    }
  }

  function handleCandidateSelect(candidate: SearchCandidate) {
    setQuery(candidate.symbol);
    void handleSearch(candidate.symbol);
  }

  function handleQuickPick(symbol: string) {
    setQuery(symbol);
    setSearchNoticeKind(null);
    setQuoteError(null);
    void handleSearch(symbol);
  }

  const suggestionsMessage =
    suggestionsState === "error"
      ? suggestionsError
        ? getUserFacingErrorCopy(suggestionsError, locale).description
        : copy.search.suggestionsUnavailable
      : suggestionsState === "empty"
        ? copy.search.suggestionsEmpty
        : null;

  const searchNotice =
    searchNoticeKind === "blank"
      ? {
          title: copy.search.blankTitle,
          description: copy.search.blankDescription,
        }
      : searchNoticeKind === "provider-unavailable"
        ? {
            title: copy.search.providerUnavailableTitle,
            description: copy.search.providerUnavailableDescription,
          }
        : searchNoticeKind === "no-match"
          ? {
              title: copy.search.noMatchTitle,
              description: copy.search.noMatchDescription,
            }
          : {
              title: copy.search.guidanceTitle,
              description: copy.search.guidanceDescription,
            };

  return (
    <main className="min-h-screen px-6 py-8 text-[var(--foreground)] lg:px-10 xl:px-14 2xl:px-16">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1500px] flex-col gap-8">
        <header className="flex items-start justify-between gap-6">
          <div className="max-w-4xl space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1 text-sm text-[var(--muted-foreground)] shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4 text-[var(--accent)]" />
              {copy.header.badge}
            </span>
            <div className="space-y-3">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                {copy.header.title}
              </h1>
              <p className="max-w-3xl text-base leading-7 text-[var(--muted-foreground)] sm:text-lg">
                {copy.header.description}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">
            <LanguageToggle />
            <ThemeToggle
              theme={theme}
              onToggle={() => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"))}
            />
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.42fr)_360px]">
          <Card className="overflow-visible">
            <CardHeader className="space-y-3">
              <CardTitle className="text-2xl">{copy.search.title}</CardTitle>
              <CardDescription>{copy.search.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <SearchForm
                isLoading={isQuoteLoading}
                onChange={handleQueryChange}
                onSelectCandidate={handleCandidateSelect}
                onSubmit={() => void handleSearch()}
                suggestions={suggestions}
                suggestionsMessage={suggestionsMessage}
                suggestionsState={suggestionsState}
                value={query}
              />

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                  {copy.search.quickPicks}
                </span>
                {QUICK_PICKS.map((symbol) => (
                  <Button
                    className="h-9 px-3 text-xs tracking-[0.08em]"
                    disabled={isQuoteLoading}
                    key={symbol}
                    onClick={() => handleQuickPick(symbol)}
                    type="button"
                    variant="ghost"
                  >
                    {symbol}
                  </Button>
                ))}
              </div>

              <div className="rounded-[22px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_88%,transparent)] p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-[color:color-mix(in_srgb,var(--accent)_12%,transparent)] p-2 text-[var(--accent)]">
                    <SearchIcon className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">{searchNotice.title}</p>
                    <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                      {searchNotice.description}
                    </p>
                  </div>
                </div>
              </div>

              {quoteError ? (
                <ErrorNotice
                  error={quoteError}
                  onRetry={quoteError.retryable ? () => void handleSearch() : undefined}
                />
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Building2 className="h-5 w-5 text-[var(--accent)]" />
                {copy.search.coverageTitle}
              </CardTitle>
              <CardDescription>{copy.search.coverageDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-[var(--muted-foreground)]">
              <div className="rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_84%,transparent)] p-4">
                <p className="font-medium text-[var(--foreground)]">{copy.search.coverageMarketsTitle}</p>
                <p className="mt-1">{copy.search.coverageMarketsDescription}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_84%,transparent)] p-4">
                <p className="font-medium text-[var(--foreground)]">{copy.search.coverageFlowTitle}</p>
                <p className="mt-1">{copy.search.coverageFlowDescription}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_84%,transparent)] p-4">
                <p className="font-medium text-[var(--foreground)]">{copy.search.coverageResilienceTitle}</p>
                <p className="mt-1">{copy.search.coverageResilienceDescription}</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {isQuoteLoading && !quote ? <LoadingPanel /> : null}

        {quote ? <ResultCard quote={quote} /> : null}

        {!quote && !isQuoteLoading && !quoteError ? (
          <Card className="border-dashed bg-[color:color-mix(in_srgb,var(--panel)_88%,transparent)]">
            <CardContent className="flex min-h-56 flex-col justify-center gap-3 p-8">
              <p className="text-xl font-medium">{copy.search.emptyStateTitle}</p>
              <p className="max-w-4xl text-sm leading-6 text-[var(--muted-foreground)]">
                {copy.search.emptyStateDescription}
              </p>
            </CardContent>
          </Card>
        ) : null}

        <CandlestickChartPanel
          chart={chart}
          error={chartError}
          isLoading={isChartLoading}
          onRetry={() => {
            if (quote) {
              void loadChart(quote.ticker, selectedRange);
            }
          }}
          onSelectRange={handleRangeChange}
          quote={quote}
          selectedRange={selectedRange}
        />

        <ValuationCardsSection
          error={valuationsError}
          isLoading={isValuationsLoading}
          onRetry={() => {
            if (quote) {
              void loadValuations(quote.ticker);
            }
          }}
          quote={quote}
          valuations={valuations}
        />
      </div>
    </main>
  );
}
