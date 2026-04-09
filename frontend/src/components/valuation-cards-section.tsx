"use client";

import {useMemo, useState} from "react";
import {ChevronDown, ChevronUp, RotateCcw, Scale, TriangleAlert} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Skeleton} from "@/components/ui/skeleton";
import {getUserFacingErrorCopy, getUserFacingErrorCopyFromCode} from "@/lib/error-messages";
import {formatCurrency, formatPercent, formatPlainNumber, formatSignedCurrency} from "@/lib/formatters";
import {useI18n} from "@/lib/i18n";
import {cn} from "@/lib/utils";
import type {BridgeErrorResponse, QuoteSuccessResponse} from "@/types/quote";
import type {
  ValuationIssueResponse,
  ValuationMethodResponse,
  ValuationsSuccessResponse,
} from "@/types/valuation";

type ValuationCardsSectionProps = {
  quote: QuoteSuccessResponse | null;
  valuations: ValuationsSuccessResponse | null;
  error: BridgeErrorResponse | null;
  isLoading: boolean;
  onRetry: () => void;
};

function humanizeKey(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (character) => character.toUpperCase())
    .trim();
}

function normalizeDetailKey(key: string) {
  return key.replace(/_([a-z])/g, (_, character: string) => character.toUpperCase());
}

function localizeMethodName(
  methodId: string,
  fallback: string,
  methodNames: Record<string, string>,
) {
  return methodNames[methodId] ?? fallback;
}

function localizeJudgment(
  judgment: string | null,
  judgments: Record<string, string>,
  notAvailable: string,
) {
  if (!judgment) {
    return notAvailable;
  }

  return judgments[judgment] ?? judgment;
}

function localizeDetailTextValue(
  key: string,
  value: string,
  detailValueLabels: Record<string, string>,
) {
  const normalizedKey = normalizeDetailKey(key);

  if (normalizedKey === "blendMode" && value === "average") {
    return detailValueLabels.average;
  }

  if (normalizedKey === "fcfSource") {
    if (value === "reported_free_cash_flow") {
      return detailValueLabels.reportedFreeCashFlow;
    }

    if (value === "operating_cash_flow_plus_capex") {
      return detailValueLabels.operatingCashFlowPlusCapex;
    }

    if (value === "reported_dividend_rate") {
      return detailValueLabels.reportedDividendRate;
    }

    if (value === "trailing_annual_dividend_rate") {
      return detailValueLabels.trailingAnnualDividendRate;
    }

    if (value === "trailing_twelve_month_sum") {
      return detailValueLabels.trailingTwelveMonthSum;
    }
  }

  if (normalizedKey === "dividendSource") {
    if (value === "reported_dividend_rate") {
      return detailValueLabels.reportedDividendRate;
    }

    if (value === "trailing_annual_dividend_rate") {
      return detailValueLabels.trailingAnnualDividendRate;
    }

    if (value === "trailing_twelve_month_sum") {
      return detailValueLabels.trailingTwelveMonthSum;
    }
  }

  if (normalizedKey === "peerSelectionBasis") {
    if (value.startsWith("industry:")) {
      return `${detailValueLabels.industry}: ${value.slice("industry:".length).trim()}`;
    }

    if (value.startsWith("sector:")) {
      return `${detailValueLabels.sector}: ${value.slice("sector:".length).trim()}`;
    }
  }

  return value;
}

function formatDetailValue(
  key: string,
  value: unknown,
  currency: string,
  locale: "en" | "ja",
  copy: ReturnType<typeof useI18n>["copy"],
) {
  if (value === null || value === undefined) {
    return copy.common.notAvailable;
  }

  if (typeof value === "number") {
    const normalizedKey = key.toLowerCase();

    if (
      normalizedKey.includes("rate") ||
      normalizedKey.includes("growth") ||
      normalizedKey.includes("roe") ||
      normalizedKey.includes("pct") ||
      normalizedKey.includes("percent")
    ) {
      return formatPercent(value, locale, {ratio: true});
    }

    if (
      normalizedKey.includes("count") ||
      normalizedKey.includes("years") ||
      normalizedKey.includes("shares")
    ) {
      return formatPlainNumber(Math.round(value), locale, 0);
    }

    if (normalizedKey.includes("per") || normalizedKey.includes("pbr")) {
      return formatPlainNumber(value, locale);
    }

    if (
      normalizedKey.includes("cash") ||
      normalizedKey.includes("debt") ||
      normalizedKey.includes("income") ||
      normalizedKey.includes("flow") ||
      normalizedKey.includes("equity") ||
      normalizedKey.includes("value") ||
      normalizedKey.includes("ebitda") ||
      normalizedKey.includes("dividend") ||
      normalizedKey.includes("price") ||
      normalizedKey.includes("eps") ||
      normalizedKey.includes("bps") ||
      normalizedKey.includes("capex")
    ) {
      return formatCurrency(value, currency, locale);
    }

    return formatPlainNumber(value, locale);
  }

  if (typeof value === "string") {
    return localizeDetailTextValue(key, value, copy.valuation.detailValueLabels);
  }

  return JSON.stringify(value);
}

function getCardTone(method: ValuationMethodResponse, copy: ReturnType<typeof useI18n>["copy"]) {
  if (method.status === "error") {
    return {
      cardClassName:
        "border-[color:color-mix(in_srgb,var(--danger)_22%,var(--border))] bg-[color:color-mix(in_srgb,var(--panel)_94%,transparent)]",
      badgeClassName:
        "border-[color:color-mix(in_srgb,var(--danger)_28%,var(--border))] bg-[color:color-mix(in_srgb,var(--danger)_10%,transparent)] text-[var(--danger)]",
      metricClassName: "text-[var(--danger)]",
      badgeLabel: copy.valuation.badgeTemporaryIssue,
    };
  }

  if (method.status === "unavailable") {
    return {
      cardClassName:
        "border-[color:color-mix(in_srgb,var(--muted)_20%,var(--border))] bg-[color:color-mix(in_srgb,var(--panel)_90%,transparent)]",
      badgeClassName:
        "border-[color:color-mix(in_srgb,var(--muted)_22%,var(--border))] bg-[color:color-mix(in_srgb,var(--panel)_86%,transparent)] text-[var(--muted-foreground)]",
      metricClassName: "text-[var(--foreground)]",
      badgeLabel: copy.valuation.badgeUnavailable,
    };
  }

  if (method.judgment === "undervalued") {
    return {
      cardClassName:
        "border-[color:color-mix(in_srgb,var(--success)_24%,var(--border))] bg-[color:color-mix(in_srgb,var(--panel)_92%,transparent)]",
      badgeClassName:
        "border-[color:color-mix(in_srgb,var(--success)_28%,var(--border))] bg-[color:color-mix(in_srgb,var(--success)_12%,transparent)] text-[var(--success)]",
      metricClassName: "text-[var(--success)]",
      badgeLabel: copy.valuation.badgeUndervalued,
    };
  }

  if (method.judgment === "overvalued") {
    return {
      cardClassName:
        "border-[color:color-mix(in_srgb,var(--danger)_24%,var(--border))] bg-[color:color-mix(in_srgb,var(--panel)_92%,transparent)]",
      badgeClassName:
        "border-[color:color-mix(in_srgb,var(--danger)_28%,var(--border))] bg-[color:color-mix(in_srgb,var(--danger)_10%,transparent)] text-[var(--danger)]",
      metricClassName: "text-[var(--danger)]",
      badgeLabel: copy.valuation.badgeOvervalued,
    };
  }

  return {
    cardClassName:
      "border-[color:color-mix(in_srgb,var(--accent)_22%,var(--border))] bg-[color:color-mix(in_srgb,var(--panel)_92%,transparent)]",
    badgeClassName:
      "border-[color:color-mix(in_srgb,var(--accent)_22%,var(--border))] bg-[color:color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)]",
    metricClassName: "text-[var(--foreground)]",
    badgeLabel: copy.valuation.badgeFair,
  };
}

function DetailsGrid({
  title,
  values,
  currency,
  locale,
  copy,
}: {
  title: string;
  values: Record<string, unknown>;
  currency: string;
  locale: "en" | "ja";
  copy: ReturnType<typeof useI18n>["copy"];
}) {
  const entries = Object.entries(values);
  const detailLabels = copy.valuation.detailLabels as Record<string, string>;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_84%,transparent)] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{title}</p>
      {entries.length > 0 ? (
        <div className="mt-4 space-y-3">
          {entries.map(([key, value]) => (
            <div className="flex items-start justify-between gap-4 text-sm" key={key}>
              <span className="min-w-0 break-words text-[var(--muted-foreground)]">
                {detailLabels[normalizeDetailKey(key)] ?? humanizeKey(key)}
              </span>
              <span className="min-w-0 max-w-[58%] break-words text-right font-medium text-[var(--foreground)]">
                {formatDetailValue(key, value, currency, locale, copy)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">
          {copy.valuation.noAdditional(title)}
        </p>
      )}
    </div>
  );
}

function ValuationCard({
  issue,
  method,
}: {
  issue: ValuationIssueResponse | null;
  method: ValuationMethodResponse;
}) {
  const {copy, locale} = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);
  const tone = getCardTone(method, copy);
  const currency = method.currency ?? "USD";
  const localizedJudgment = localizeJudgment(
    method.judgment,
    copy.valuation.judgments,
    copy.valuation.judgments.na,
  );
  const summaryMessage =
    method.status === "ok"
      ? copy.valuation.okSummary(localizedJudgment)
      : issue
        ? getUserFacingErrorCopyFromCode(issue.errorCode, locale).description
        : method.status === "error"
          ? copy.valuation.fallbackErrorDescription
          : copy.valuation.fallbackUnavailableDescription;

  return (
    <div className={cn("rounded-[28px] border p-5 shadow-sm transition-colors", tone.cardClassName)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold tracking-[-0.02em]">
              {localizeMethodName(method.methodId, method.methodName, copy.valuation.methodNames)}
            </span>
            <span className={cn("rounded-full border px-3 py-1 text-xs font-medium", tone.badgeClassName)}>
              {tone.badgeLabel}
            </span>
          </div>
          <p className="max-w-[56ch] text-sm leading-6 text-[var(--muted-foreground)]">{summaryMessage}</p>
        </div>

        <Button
          className="self-start"
          onClick={() => setIsExpanded((current) => !current)}
          type="button"
          variant="ghost"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {isExpanded ? copy.valuation.hideDetails : copy.valuation.showDetails}
        </Button>
      </div>

      {method.status === "ok" && method.fairValue !== null ? (
        <div className="mt-5 space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{copy.valuation.fairValue}</p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
              {formatCurrency(method.fairValue, currency, locale)}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_84%,transparent)] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
                {copy.valuation.currentPrice}
              </p>
              <p className="mt-2 text-lg font-medium">
                {method.currentPrice !== null
                  ? formatCurrency(method.currentPrice, currency, locale)
                  : copy.common.notAvailable}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_84%,transparent)] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
                {copy.valuation.difference}
              </p>
              <p className={cn("mt-2 text-lg font-medium", tone.metricClassName)}>
                {method.priceGap !== null
                  ? formatSignedCurrency(method.priceGap, currency, locale)
                  : copy.common.notAvailable}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_84%,transparent)] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
                {copy.valuation.upsideDownside}
              </p>
              <p className={cn("mt-2 text-lg font-medium", tone.metricClassName)}>
                {method.upsideDownsidePct !== null
                  ? formatPercent(method.upsideDownsidePct, locale, {forceSign: true})
                  : copy.common.notAvailable}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_84%,transparent)] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
                {copy.valuation.judgement}
              </p>
              <p className="mt-2 text-lg font-medium">{localizedJudgment}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_84%,transparent)] p-4">
          <div className="flex gap-3">
            <div
              className={cn(
                "mt-0.5 rounded-full p-2",
                method.status === "error"
                  ? "bg-[color:color-mix(in_srgb,var(--danger)_12%,transparent)] text-[var(--danger)]"
                  : "bg-[color:color-mix(in_srgb,var(--warning)_14%,transparent)] text-[var(--warning)]",
              )}
            >
              <TriangleAlert className="h-4 w-4" />
            </div>
            <div className="space-y-2">
              <p className="font-medium text-[var(--foreground)]">
                {method.status === "error"
                  ? copy.valuation.temporaryCalculationIssue
                  : copy.valuation.calculationUnavailable}
              </p>
              <p className="text-sm leading-6 text-[var(--muted-foreground)]">{summaryMessage}</p>
            </div>
          </div>
        </div>
      )}

      {isExpanded ? (
        <div className="mt-5 grid gap-3 border-t border-[var(--border)] pt-5 xl:grid-cols-2">
          <DetailsGrid
            copy={copy}
            currency={currency}
            locale={locale}
            title={copy.valuation.inputs}
            values={method.inputs}
          />
          <DetailsGrid
            copy={copy}
            currency={currency}
            locale={locale}
            title={copy.valuation.assumptions}
            values={method.assumptions}
          />
        </div>
      ) : null}
    </div>
  );
}

function ValuationSkeletonGrid({loadingLabel}: {loadingLabel: string}) {
  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-[var(--muted-foreground)]">{loadingLabel}</div>
      <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        {Array.from({length: 7}, (_, index) => (
          <div
            className="rounded-[28px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_90%,transparent)] p-5"
            key={index}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-6 w-36 rounded-full" />
                <Skeleton className="h-10 w-24 rounded-2xl" />
              </div>
              <Skeleton className="h-8 w-48 rounded-2xl" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ValuationCardsSection({
  quote,
  valuations,
  error,
  isLoading,
  onRetry,
}: ValuationCardsSectionProps) {
  const {copy, locale} = useI18n();
  const issuesByScope = useMemo(() => {
    return new Map((valuations?.errors ?? []).map((issue) => [issue.scope, issue]));
  }, [valuations?.errors]);
  const errorCopy = error ? getUserFacingErrorCopy(error, locale) : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[color:color-mix(in_srgb,var(--accent)_12%,transparent)] p-2 text-[var(--accent)]">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-2xl">{copy.valuation.title}</CardTitle>
              <CardDescription>{copy.valuation.description}</CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-[var(--muted-foreground)]">
            <span className="rounded-full border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_88%,transparent)] px-3 py-1">
              {quote ? copy.valuation.viewBadge(quote.ticker) : copy.valuation.badgeNoQuote}
            </span>
            {valuations ? (
              <span className="rounded-full border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_88%,transparent)] px-3 py-1">
                {copy.valuation.methodsCount(valuations.valuations.length)}
              </span>
            ) : null}
            {valuations && valuations.errors.length > 0 ? (
              <span className="rounded-full border border-[color:color-mix(in_srgb,var(--muted)_22%,var(--border))] bg-[color:color-mix(in_srgb,var(--panel)_88%,transparent)] px-3 py-1">
                {copy.valuation.nonFatalIssues(valuations.errors.length)}
              </span>
            ) : null}
          </div>
        </div>

        {quote ? (
          <Button disabled={isLoading} onClick={onRetry} type="button" variant="secondary">
            <RotateCcw className="h-4 w-4" />
            {copy.common.retryValuations}
          </Button>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-5">
        {!quote ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-[26px] border border-dashed border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_88%,transparent)] p-8 text-center">
            <p className="text-lg font-medium">{copy.valuation.readyTitle}</p>
            <p className="max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">
              {copy.valuation.readyDescription}
            </p>
          </div>
        ) : isLoading && !valuations ? (
          <ValuationSkeletonGrid loadingLabel={copy.common.loading} />
        ) : error && !valuations ? (
          <div className="flex min-h-56 flex-col items-start justify-center gap-5 rounded-[26px] border border-[color:color-mix(in_srgb,var(--danger)_22%,var(--border))] bg-[color:color-mix(in_srgb,var(--panel)_92%,transparent)] p-6">
            <div className="space-y-2">
              <p className="text-lg font-medium">{errorCopy?.title ?? copy.valuation.emptyTitle}</p>
              <p className="max-w-xl text-sm leading-6 text-[var(--muted-foreground)]">{errorCopy?.description}</p>
            </div>
            <Button onClick={onRetry} type="button" variant="secondary">
              <RotateCcw className="h-4 w-4" />
              {copy.common.retryValuations}
            </Button>
          </div>
        ) : valuations ? (
          <div className="space-y-4">
            {error ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-[color:color-mix(in_srgb,var(--warning)_24%,var(--border))] bg-[color:color-mix(in_srgb,var(--panel)_90%,transparent)] p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{copy.valuation.showingLastSuccessful}</p>
                  <p className="text-sm leading-6 text-[var(--muted-foreground)]">{errorCopy?.description}</p>
                </div>
                <Button onClick={onRetry} type="button" variant="secondary">
                  <RotateCcw className="h-4 w-4" />
                  {copy.common.retryValuations}
                </Button>
              </div>
            ) : null}
            <p className="text-sm leading-6 text-[var(--muted-foreground)]">{copy.valuation.sectionDescription}</p>
            <div className="flex flex-wrap gap-3 text-xs text-[var(--muted-foreground)]">
              <span className="rounded-full border border-[color:color-mix(in_srgb,var(--success)_24%,var(--border))] bg-[color:color-mix(in_srgb,var(--success)_10%,transparent)] px-3 py-1">
                {copy.valuation.calculatedCount(
                  valuations.valuations.filter((method) => method.status === "ok").length,
                )}
              </span>
              <span className="rounded-full border border-[color:color-mix(in_srgb,var(--muted)_22%,var(--border))] bg-[color:color-mix(in_srgb,var(--panel)_88%,transparent)] px-3 py-1">
                {copy.valuation.unavailableCount(
                  valuations.valuations.filter((method) => method.status === "unavailable").length,
                )}
              </span>
              <span className="rounded-full border border-[color:color-mix(in_srgb,var(--danger)_24%,var(--border))] bg-[color:color-mix(in_srgb,var(--danger)_10%,transparent)] px-3 py-1">
                {copy.valuation.temporaryIssueCount(
                  valuations.valuations.filter((method) => method.status === "error").length,
                )}
              </span>
            </div>
            <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
              {valuations.valuations.map((method) => (
                <ValuationCard
                  issue={issuesByScope.get(`valuation:${method.methodId}`) ?? null}
                  key={method.methodId}
                  method={method}
                />
              ))}
            </div>
            {isLoading ? (
              <div className="flex justify-end">
                <span className="rounded-full border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_92%,transparent)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)] shadow-sm">
                  {copy.valuation.updating}
                </span>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-[26px] border border-dashed border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_88%,transparent)] p-8 text-center">
            <p className="text-lg font-medium">{copy.valuation.emptyTitle}</p>
            <p className="max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">
              {copy.valuation.emptyDescription}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
