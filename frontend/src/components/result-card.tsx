"use client";

import {ArrowDownRight, ArrowRight, ArrowUpRight, CircleDollarSign, Minus} from "lucide-react";
import {Badge} from "@/components/ui/badge";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {formatAsOfLabel, formatCurrency, formatPercent, formatSignedCurrency} from "@/lib/formatters";
import {useI18n} from "@/lib/i18n";
import {cn} from "@/lib/utils";
import type {QuoteSuccessResponse} from "@/types/quote";

function getMovementTone(change: number, labels: {up: string; down: string; flat: string}) {
  if (change > 0) {
    return {
      label: labels.up,
      icon: ArrowUpRight,
      badgeClassName:
        "border-[color:color-mix(in_srgb,var(--success)_28%,var(--border))] bg-[color:color-mix(in_srgb,var(--success)_12%,transparent)] text-[var(--success)]",
      metricClassName: "text-[var(--success)]",
    };
  }

  if (change < 0) {
    return {
      label: labels.down,
      icon: ArrowDownRight,
      badgeClassName:
        "border-[color:color-mix(in_srgb,var(--danger)_28%,var(--border))] bg-[color:color-mix(in_srgb,var(--danger)_10%,transparent)] text-[var(--danger)]",
      metricClassName: "text-[var(--danger)]",
    };
  }

  return {
    label: labels.flat,
    icon: Minus,
    badgeClassName:
      "border-[color:color-mix(in_srgb,var(--muted)_22%,var(--border))] bg-[color:color-mix(in_srgb,var(--panel)_92%,transparent)] text-[var(--muted-foreground)]",
    metricClassName: "text-[var(--foreground)]",
  };
}

export function ResultCard({quote}: {quote: QuoteSuccessResponse}) {
  const {copy, locale} = useI18n();
  const movementTone = getMovementTone(quote.change, {
    up: copy.quote.movementUp,
    down: copy.quote.movementDown,
    flat: copy.quote.movementFlat,
  });
  const MovementIcon = movementTone.icon;
  const asOfLabel = formatAsOfLabel(quote.asOf, locale);

  return (
    <Card className="border-[color:color-mix(in_srgb,var(--accent)_24%,var(--border))]">
      <CardHeader className="gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Badge>{quote.ticker}</Badge>
            <Badge className="tracking-[0.08em] normal-case">{quote.exchange}</Badge>
            {asOfLabel ? (
              <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_88%,transparent)] px-3 py-1 text-sm text-[var(--muted-foreground)]">
                {copy.quote.asOf(asOfLabel)}
              </span>
            ) : null}
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm",
                movementTone.badgeClassName,
              )}
            >
              <MovementIcon className="h-4 w-4" />
              {movementTone.label}
            </span>
          </div>
          <div className="min-w-0 space-y-2">
            <CardTitle className="max-w-5xl break-words text-3xl tracking-[-0.03em]">
              {quote.companyName}
            </CardTitle>
            <CardDescription>{copy.quote.description}</CardDescription>
          </div>
        </div>

        <div className="w-full rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_90%,transparent)] px-5 py-4 shadow-sm sm:max-w-[340px] xl:w-[340px] xl:min-w-[340px]">
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <CircleDollarSign className="h-4 w-4 text-[var(--accent)]" />
            {copy.quote.currentPrice}
          </div>
          <div className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
            {formatCurrency(quote.currentPrice, quote.currency, locale)}
          </div>
          <div className={cn("mt-2 text-sm font-medium", movementTone.metricClassName)}>
            {formatSignedCurrency(quote.change, quote.currency, locale)} (
            {formatPercent(quote.changePercent, locale)})
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_84%,transparent)] p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{copy.quote.currency}</div>
          <div className="mt-2 text-lg font-medium">{quote.currency}</div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_84%,transparent)] p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{copy.quote.previousClose}</div>
          <div className="mt-2 text-lg font-medium">
            {formatCurrency(quote.previousClose, quote.currency, locale)}
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_84%,transparent)] p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{copy.quote.absoluteChange}</div>
          <div className={cn("mt-2 text-lg font-medium", movementTone.metricClassName)}>
            {formatSignedCurrency(quote.change, quote.currency, locale)}
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_84%,transparent)] p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{copy.quote.changePercent}</div>
          <div className={cn("mt-2 text-lg font-medium", movementTone.metricClassName)}>
            {formatPercent(quote.changePercent, locale)}
          </div>
        </div>
      </CardContent>

      <CardContent className="pt-0">
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_82%,transparent)] p-4 text-sm text-[var(--muted-foreground)]">
          <span className="font-medium text-[var(--foreground)]">{copy.quote.valuationActiveTitle}</span>
          <span className="mx-2 inline-flex align-middle">
            <ArrowRight className="h-4 w-4 text-[var(--accent)]" />
          </span>
          {copy.quote.valuationActiveDescription}
        </div>
      </CardContent>
    </Card>
  );
}
