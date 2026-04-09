"use client";

import {LineChart, RotateCcw} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Skeleton} from "@/components/ui/skeleton";
import {getUserFacingErrorCopy} from "@/lib/error-messages";
import {formatCompactNumber, formatPlainNumber} from "@/lib/formatters";
import {useI18n} from "@/lib/i18n";
import {APP_LOCALE_TAGS} from "@/lib/i18n-config";
import {cn} from "@/lib/utils";
import type {
  ChartCandle,
  ChartMovingAverages,
  ChartRange,
  ChartSuccessResponse,
  MovingAveragePoint,
} from "@/types/chart";
import type {BridgeErrorResponse, QuoteSuccessResponse} from "@/types/quote";

const TIMEFRAME_OPTIONS: ChartRange[] = ["1M", "3M", "6M", "1Y", "5Y", "MAX"];
const SVG_WIDTH = 1080;
const SVG_HEIGHT = 620;
const CHART_LEFT = 32;
const CHART_RIGHT = 84;
const PRICE_TOP = 30;
const PRICE_HEIGHT = 318;
const VOLUME_TOP = 390;
const VOLUME_HEIGHT = 116;
const AXIS_BOTTOM = 556;
const PLOT_WIDTH = SVG_WIDTH - CHART_LEFT - CHART_RIGHT;
const MOVING_AVERAGE_COLORS = {
  ma25: "#c78a1b",
  ma75: "#178f7a",
  ma200: "#40689b",
} as const;

type CandlestickChartPanelProps = {
  quote: QuoteSuccessResponse | null;
  chart: ChartSuccessResponse | null;
  error: BridgeErrorResponse | null;
  isLoading: boolean;
  selectedRange: ChartRange;
  onSelectRange: (nextRange: ChartRange) => void;
  onRetry: () => void;
};

type DisplayChart = {
  candles: ChartCandle[];
  movingAverages: ChartMovingAverages;
};

function getLastItem<T>(items: T[]) {
  return items.length > 0 ? items[items.length - 1] : null;
}

function buildTickIndices(length: number, desiredCount: number) {
  if (length <= 1) {
    return [0];
  }

  const lastIndex = length - 1;
  const indices = new Set<number>([0, lastIndex]);

  for (let index = 1; index < desiredCount - 1; index += 1) {
    indices.add(Math.round((lastIndex * index) / (desiredCount - 1)));
  }

  return Array.from(indices).sort((left, right) => left - right);
}

function bucketChartData(chart: ChartSuccessResponse, maxCandles = 180): DisplayChart {
  if (chart.candles.length <= maxCandles) {
    return {
      candles: chart.candles,
      movingAverages: chart.movingAverages,
    };
  }

  const bucketSize = Math.ceil(chart.candles.length / maxCandles);
  const ma25Map = new Map(chart.movingAverages.ma25.map((point) => [point.date, point.value]));
  const ma75Map = new Map(chart.movingAverages.ma75.map((point) => [point.date, point.value]));
  const ma200Map = new Map(chart.movingAverages.ma200.map((point) => [point.date, point.value]));
  const candles: ChartCandle[] = [];
  const ma25: MovingAveragePoint[] = [];
  const ma75: MovingAveragePoint[] = [];
  const ma200: MovingAveragePoint[] = [];

  for (let startIndex = 0; startIndex < chart.candles.length; startIndex += bucketSize) {
    const bucket = chart.candles.slice(startIndex, startIndex + bucketSize);
    const first = bucket[0];
    const last = bucket[bucket.length - 1];

    candles.push({
      date: last.date,
      open: first.open,
      high: Math.max(...bucket.map((candle) => candle.high)),
      low: Math.min(...bucket.map((candle) => candle.low)),
      close: last.close,
      volume: bucket.reduce((sum, candle) => sum + candle.volume, 0),
    });

    const ma25Value = ma25Map.get(last.date);
    const ma75Value = ma75Map.get(last.date);
    const ma200Value = ma200Map.get(last.date);

    if (ma25Value !== undefined) {
      ma25.push({date: last.date, value: ma25Value});
    }
    if (ma75Value !== undefined) {
      ma75.push({date: last.date, value: ma75Value});
    }
    if (ma200Value !== undefined) {
      ma200.push({date: last.date, value: ma200Value});
    }
  }

  return {
    candles,
    movingAverages: {ma25, ma75, ma200},
  };
}

function ChartSkeleton({loadingLabel}: {loadingLabel: string}) {
  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-[var(--muted-foreground)]">{loadingLabel}</div>
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-6 w-28 rounded-full" />
      </div>
      <Skeleton className="h-[430px] rounded-[24px]" />
    </div>
  );
}

function formatChartBoundary(value: string, localeTag: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(localeTag, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatDateLabel(value: string, chartRange: ChartRange, localeTag: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  if (chartRange === "5Y" || chartRange === "MAX") {
    return new Intl.DateTimeFormat(localeTag, {year: "numeric"}).format(date);
  }

  if (chartRange === "1Y") {
    return new Intl.DateTimeFormat(localeTag, {month: "short", year: "2-digit"}).format(date);
  }

  return new Intl.DateTimeFormat(localeTag, {month: "short", day: "numeric"}).format(date);
}

function formatOptionalMetric(
  value: number | null | undefined,
  formatter: (numeric: number) => string,
  fallback: string,
) {
  return value === null || value === undefined ? fallback : formatter(value);
}

export function CandlestickChartPanel({
  quote,
  chart,
  error,
  isLoading,
  selectedRange,
  onSelectRange,
  onRetry,
}: CandlestickChartPanelProps) {
  const {copy, locale} = useI18n();
  const localeTag = APP_LOCALE_TAGS[locale];
  const displayChart = chart ? bucketChartData(chart) : null;
  const latestCandle = chart ? getLastItem(chart.candles) : null;
  const latestMa25 = chart ? getLastItem(chart.movingAverages.ma25) : null;
  const latestMa75 = chart ? getLastItem(chart.movingAverages.ma75) : null;
  const latestMa200 = chart ? getLastItem(chart.movingAverages.ma200) : null;
  const chartErrorCopy = error ? getUserFacingErrorCopy(error, locale) : null;

  const values = displayChart
    ? [
        ...displayChart.candles.flatMap((candle) => [candle.low, candle.high]),
        ...displayChart.movingAverages.ma25.map((point) => point.value),
        ...displayChart.movingAverages.ma75.map((point) => point.value),
        ...displayChart.movingAverages.ma200.map((point) => point.value),
      ]
    : [];
  const baseMin = values.length > 0 ? Math.min(...values) : 0;
  const baseMax = values.length > 0 ? Math.max(...values) : 1;
  const safeMin = baseMin === baseMax ? baseMin - 1 : baseMin;
  const safeMax = baseMin === baseMax ? baseMax + 1 : baseMax;
  const pricePadding = (safeMax - safeMin) * 0.08;
  const priceMin = safeMin - pricePadding;
  const priceMax = safeMax + pricePadding;
  const maxVolume = displayChart ? Math.max(...displayChart.candles.map((candle) => candle.volume), 1) : 1;
  const step = displayChart ? PLOT_WIDTH / displayChart.candles.length : PLOT_WIDTH;
  const bodyWidth = Math.max(3, Math.min(10, step * 0.56));
  const candleX = (index: number) => CHART_LEFT + step * index + step / 2;
  const priceY = (value: number) =>
    PRICE_TOP + ((priceMax - value) / (priceMax - priceMin || 1)) * PRICE_HEIGHT;
  const volumeY = (value: number) => VOLUME_TOP + VOLUME_HEIGHT - (value / maxVolume) * VOLUME_HEIGHT;
  const xTicks = displayChart ? buildTickIndices(displayChart.candles.length, 5) : [];
  const yTicks = buildTickIndices(5, 5);
  const gradientId = quote
    ? `chart-volume-${quote.ticker}-${selectedRange}`.replace(/[^a-zA-Z0-9-]/g, "")
    : "chart-volume";

  const formatPrice = (value: number) => formatPlainNumber(value, locale, 2);
  const formatVolume = (value: number) => formatCompactNumber(value, locale);

  const buildMovingAveragePath = (points: MovingAveragePoint[]) => {
    if (!displayChart) {
      return "";
    }

    const pointLookup = new Map(points.map((point) => [point.date, point.value]));
    let path = "";

    displayChart.candles.forEach((candle, index) => {
      const value = pointLookup.get(candle.date);
      if (value === undefined) {
        return;
      }

      const nextPoint = `${candleX(index)} ${priceY(value)}`;
      path = path ? `${path} L ${nextPoint}` : `M ${nextPoint}`;
    });

    return path;
  };

  const ma25Path = chart ? buildMovingAveragePath(chart.movingAverages.ma25) : "";
  const ma75Path = chart ? buildMovingAveragePath(chart.movingAverages.ma75) : "";
  const ma200Path = chart ? buildMovingAveragePath(chart.movingAverages.ma200) : "";

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[color:color-mix(in_srgb,var(--accent)_12%,transparent)] p-2 text-[var(--accent)]">
              <LineChart className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-2xl">{copy.chart.title}</CardTitle>
              <CardDescription>{copy.chart.description}</CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-[var(--muted-foreground)]">
            <span className="rounded-full border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_92%,transparent)] px-3 py-1">
              {quote ? `${quote.ticker} / ${selectedRange}` : copy.chart.badgeNoQuote}
            </span>
            {chart && chart.candles.length > 0 ? (
              <span className="rounded-full border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_88%,transparent)] px-3 py-1">
                {copy.chart.dateRange(
                  formatChartBoundary(chart.candles[0].date, localeTag),
                  formatChartBoundary(chart.candles[chart.candles.length - 1].date, localeTag),
                )}
              </span>
            ) : null}
            {latestCandle ? (
              <span className="rounded-full border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_88%,transparent)] px-3 py-1">
                {copy.chart.latestVolume(formatVolume(latestCandle.volume))}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {TIMEFRAME_OPTIONS.map((timeframe) => {
            const isSelected = selectedRange === timeframe;

            return (
              <Button
                key={timeframe}
                className="h-10 min-w-14 px-4 text-xs tracking-[0.12em]"
                disabled={!quote || (isLoading && isSelected)}
                onClick={() => onSelectRange(timeframe)}
                type="button"
                variant={isSelected ? "default" : "ghost"}
              >
                {timeframe}
              </Button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {chart && error ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-[color:color-mix(in_srgb,var(--warning)_24%,var(--border))] bg-[color:color-mix(in_srgb,var(--panel)_90%,transparent)] p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">{copy.chart.showingLastSuccessful}</p>
              <p className="text-sm leading-6 text-[var(--muted-foreground)]">{chartErrorCopy?.description}</p>
            </div>
            <Button onClick={onRetry} type="button" variant="secondary">
              <RotateCcw className="h-4 w-4" />
              {copy.common.retryChart}
            </Button>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3 text-xs text-[var(--muted-foreground)]">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_88%,transparent)] px-3 py-1">
            <span className="h-2.5 w-2.5 rounded-full" style={{backgroundColor: MOVING_AVERAGE_COLORS.ma25}} />
            MA25 {latestMa25 ? formatPrice(latestMa25.value) : copy.common.notAvailable}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_88%,transparent)] px-3 py-1">
            <span className="h-2.5 w-2.5 rounded-full" style={{backgroundColor: MOVING_AVERAGE_COLORS.ma75}} />
            MA75 {latestMa75 ? formatPrice(latestMa75.value) : copy.common.notAvailable}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_88%,transparent)] px-3 py-1">
            <span className="h-2.5 w-2.5 rounded-full" style={{backgroundColor: MOVING_AVERAGE_COLORS.ma200}} />
            MA200 {latestMa200 ? formatPrice(latestMa200.value) : copy.common.notAvailable}
          </span>
          {displayChart ? (
            <span className="rounded-full border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_88%,transparent)] px-3 py-1">
              {copy.chart.candlesShown(displayChart.candles.length)}
            </span>
          ) : null}
        </div>

        <div className="relative rounded-[26px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_88%,transparent)] p-5">
          {!quote ? (
            <div className="flex min-h-[440px] flex-col items-center justify-center gap-3 text-center">
              <div className="rounded-full bg-[color:color-mix(in_srgb,var(--accent)_12%,transparent)] p-3 text-[var(--accent)]">
                <LineChart className="h-6 w-6" />
              </div>
              <p className="text-lg font-medium">{copy.chart.readyTitle}</p>
              <p className="max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
                {copy.chart.readyDescription}
              </p>
            </div>
          ) : isLoading && !chart ? (
            <ChartSkeleton loadingLabel={copy.common.loading} />
          ) : error && !chart ? (
            <div className="flex min-h-[440px] flex-col items-start justify-center gap-5">
              <div className="space-y-2">
                <p className="text-lg font-medium">{chartErrorCopy?.title ?? copy.chart.emptyTitle}</p>
                <p className="max-w-xl text-sm leading-6 text-[var(--muted-foreground)]">{chartErrorCopy?.description}</p>
              </div>
              <Button onClick={onRetry} type="button" variant="secondary">
                <RotateCcw className="h-4 w-4" />
                {copy.common.retryChart}
              </Button>
            </div>
          ) : chart && displayChart ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_82%,transparent)] p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
                    {copy.chart.lastClose}
                  </div>
                  <div className="mt-2 text-lg font-medium">
                    {formatOptionalMetric(latestCandle?.close, formatPrice, copy.common.notAvailable)}
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_82%,transparent)] p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
                    {copy.chart.sessionRange}
                  </div>
                  <div className="mt-2 text-lg font-medium">
                    {latestCandle
                      ? `${formatPrice(latestCandle.low)} - ${formatPrice(latestCandle.high)}`
                      : copy.common.notAvailable}
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_82%,transparent)] p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
                    {copy.chart.open}
                  </div>
                  <div className="mt-2 text-lg font-medium">
                    {formatOptionalMetric(latestCandle?.open, formatPrice, copy.common.notAvailable)}
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_82%,transparent)] p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
                    {copy.chart.volume}
                  </div>
                  <div className="mt-2 text-lg font-medium">
                    {formatOptionalMetric(latestCandle?.volume, formatVolume, copy.common.notAvailable)}
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[24px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel-strong)_92%,transparent)]">
                <svg
                  aria-label={copy.chart.title}
                  className={cn("block h-auto w-full transition-opacity", isLoading && "opacity-45")}
                  role="img"
                  viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                >
                  <defs>
                    <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#0f6fdd" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#0f6fdd" stopOpacity="0.08" />
                    </linearGradient>
                  </defs>

                  {yTicks.map((tickIndex) => {
                    const value = priceMax - ((priceMax - priceMin) * tickIndex) / (yTicks.length - 1 || 1);
                    const y = PRICE_TOP + (PRICE_HEIGHT * tickIndex) / (yTicks.length - 1 || 1);

                    return (
                      <g key={`y-tick-${tickIndex}`}>
                        <line
                          stroke="var(--border)"
                          strokeDasharray="4 10"
                          strokeWidth="1"
                          x1={CHART_LEFT}
                          x2={SVG_WIDTH - CHART_RIGHT + 16}
                          y1={y}
                          y2={y}
                        />
                        <text fill="var(--muted)" fontSize="13" x={SVG_WIDTH - CHART_RIGHT + 22} y={y + 4}>
                          {formatPrice(value)}
                        </text>
                      </g>
                    );
                  })}

                  <line
                    stroke="var(--border)"
                    strokeDasharray="4 10"
                    strokeWidth="1"
                    x1={CHART_LEFT}
                    x2={SVG_WIDTH - CHART_RIGHT + 16}
                    y1={VOLUME_TOP + VOLUME_HEIGHT}
                    y2={VOLUME_TOP + VOLUME_HEIGHT}
                  />
                  <text fill="var(--muted)" fontSize="13" x={SVG_WIDTH - CHART_RIGHT + 22} y={VOLUME_TOP + 12}>
                    {copy.chart.volumeShort} {formatVolume(maxVolume)}
                  </text>

                  {displayChart.candles.map((candle, index) => {
                    const x = candleX(index);
                    const wickTop = priceY(candle.high);
                    const wickBottom = priceY(candle.low);
                    const bodyTop = priceY(Math.max(candle.open, candle.close));
                    const bodyBottom = priceY(Math.min(candle.open, candle.close));
                    const positive = candle.close >= candle.open;
                    const bodyHeight = Math.max(bodyBottom - bodyTop, 1.5);

                    return (
                      <g key={candle.date}>
                        <line
                          stroke={positive ? "var(--success)" : "var(--danger)"}
                          strokeLinecap="round"
                          strokeWidth="1.4"
                          x1={x}
                          x2={x}
                          y1={wickTop}
                          y2={wickBottom}
                        />
                        <rect
                          fill={positive ? "var(--success)" : "var(--danger)"}
                          height={bodyHeight}
                          opacity="0.9"
                          rx="1.5"
                          width={bodyWidth}
                          x={x - bodyWidth / 2}
                          y={bodyTop}
                        />
                        <rect
                          fill={`url(#${gradientId})`}
                          height={Math.max(VOLUME_TOP + VOLUME_HEIGHT - volumeY(candle.volume), 2)}
                          rx="1.5"
                          width={Math.max(bodyWidth, 3)}
                          x={x - Math.max(bodyWidth, 3) / 2}
                          y={volumeY(candle.volume)}
                        />
                      </g>
                    );
                  })}

                  {ma200Path ? (
                    <path
                      d={ma200Path}
                      fill="none"
                      stroke={MOVING_AVERAGE_COLORS.ma200}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.2"
                    />
                  ) : null}
                  {ma75Path ? (
                    <path
                      d={ma75Path}
                      fill="none"
                      stroke={MOVING_AVERAGE_COLORS.ma75}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.2"
                    />
                  ) : null}
                  {ma25Path ? (
                    <path
                      d={ma25Path}
                      fill="none"
                      stroke={MOVING_AVERAGE_COLORS.ma25}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.2"
                    />
                  ) : null}

                  {xTicks.map((index) => {
                    const candle = displayChart.candles[index];
                    const x = candleX(index);
                    const isFirst = index === xTicks[0];
                    const isLast = index === xTicks[xTicks.length - 1];

                    return (
                      <g key={`x-tick-${candle.date}`}>
                        <line stroke="var(--border)" strokeWidth="1" x1={x} x2={x} y1={AXIS_BOTTOM - 12} y2={AXIS_BOTTOM - 4} />
                        <text
                          fill="var(--muted)"
                          fontSize="13"
                          textAnchor={isFirst ? "start" : isLast ? "end" : "middle"}
                          x={x}
                          y={AXIS_BOTTOM + 18}
                        >
                          {formatDateLabel(candle.date, selectedRange, localeTag)}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {isLoading ? (
                  <div className="pointer-events-none absolute inset-x-4 top-4 flex justify-end">
                    <span className="rounded-full border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel-strong)_92%,transparent)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)] shadow-sm">
                      {copy.chart.updating(selectedRange)}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex min-h-[440px] flex-col items-center justify-center gap-3 text-center">
              <p className="text-lg font-medium">{copy.chart.emptyTitle}</p>
              <p className="max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
                {copy.chart.emptyDescription}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
