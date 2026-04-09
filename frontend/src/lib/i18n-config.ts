export type AppLocale = "en" | "ja";

export const DEFAULT_APP_LOCALE: AppLocale = "en";
export const APP_LOCALE_STORAGE_KEY = "eqfv-locale";

export const APP_LOCALE_TAGS: Record<AppLocale, string> = {
  en: "en-US",
  ja: "ja-JP",
};

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return value === "en" || value === "ja";
}

export function resolvePreferredLocale(value: string | null | undefined): AppLocale {
  if (!value) {
    return DEFAULT_APP_LOCALE;
  }

  const normalized = value.toLowerCase();
  if (normalized.startsWith("ja")) {
    return "ja";
  }

  return "en";
}

const en = {
  common: {
    notAvailable: "n/a",
    search: "Search",
    loading: "Loading...",
    retrySearch: "Retry search",
    retryChart: "Retry chart",
    retryValuations: "Retry valuations",
  },
  language: {
    label: "Language",
    en: "EN",
    ja: "Japanese",
  },
  theme: {
    light: "Light mode",
    dark: "Dark mode",
  },
  header: {
    badge: "Release-candidate MVP",
    title: "Equity Fair Value Terminal",
    description:
      "Search by ticker or company name to review live quote data, candlesticks, and multiple independent valuation methods for Japanese and US stocks in one calm desktop view.",
  },
  search: {
    title: "Search",
    description:
      "Ticker input remains fully supported, including 4-digit Tokyo Stock Exchange codes like 7203, and company-name suggestions appear as you type whenever the data provider can resolve them.",
    inputLabel: "Ticker or company name",
    placeholder: "Ticker or company name: AAPL / Toyota / 7203 / 7203.T / Sony",
    quickPicks: "Quick picks",
    suggestionsLoading: "Searching matching tickers and company names...",
    suggestionsUnavailable:
      "Name suggestions are temporarily unavailable. You can still search by ticker.",
    suggestionsEmpty: "No matching Japanese or US stock was found for this search.",
    suggestionsFooter:
      "Press Enter to open the highlighted candidate, or click one from the list.",
    guidanceTitle: "Type a company name to preview candidate symbols",
    guidanceDescription:
      "English company-name matching is the most reliable with the current provider. Japanese-name matches appear when the provider can resolve them, and 4-digit Tokyo Stock Exchange codes such as 7203 are also accepted.",
    blankTitle: "Enter a ticker or company name",
    blankDescription:
      "Start with a symbol like AAPL, 7203, or 7203.T, or type a company name such as Toyota.",
    noMatchTitle: "No matching stock was found",
    noMatchDescription:
      "Try a ticker such as AAPL, 7203, or 7203.T, or use a more specific English company name.",
    providerUnavailableTitle: "Company-name search is temporarily unavailable",
    providerUnavailableDescription:
      "Try a ticker symbol directly, or retry the company name in a moment.",
    emptyStateTitle: "Ready for search-driven stock analysis",
    emptyStateDescription:
      "Start with a ticker like AAPL, 7203, or 7203.T, or type a company name such as Toyota, Sony, or Microsoft to pick from candidate symbols before loading the full detail view.",
    coverageTitle: "Coverage",
    coverageDescription:
      "The layout stays desktop-first and keeps working data visible even when one section is temporarily unavailable.",
    coverageMarketsTitle: "Markets",
    coverageMarketsDescription:
      "Japanese and US stocks supported by yfinance remain in scope for the MVP.",
    coverageFlowTitle: "Search flow",
    coverageFlowDescription:
      "Choosing a suggestion triggers the same detail view as entering a ticker directly.",
    coverageResilienceTitle: "Resilience",
    coverageResilienceDescription:
      "Quote, chart, and valuation sections keep their own loading and error states.",
  },
  loadingPanel: {
    title: "Loading stock details",
    description:
      "Quote, chart, and valuation sections will fill in as their requests finish.",
  },
  quote: {
    movementUp: "Up on the day",
    movementDown: "Down on the day",
    movementFlat: "Flat on the day",
    asOf: (label: string) => `As of ${label}`,
    currentPrice: "Current price",
    description:
      "Live quote data from yfinance, normalized in the Python sidecar and rendered in the desktop detail view without clearing the chart or valuation sections.",
    currency: "Currency",
    previousClose: "Previous close",
    absoluteChange: "Absolute change",
    changePercent: "Change percent",
    valuationActiveTitle: "Valuation section active",
    valuationActiveDescription:
      "The chart and the valuation cards below update independently, so one method can go unavailable without clearing the rest of the stock detail view.",
  },
  chart: {
    title: "Candlestick Chart",
    description: "Daily OHLCV candles with volume and MA25 / MA75 / MA200 overlays.",
    badgeNoQuote: "Search a ticker to load the chart",
    dateRange: (start: string, end: string) => `${start} to ${end}`,
    latestVolume: (value: string) => `Latest volume ${value}`,
    readyTitle: "Chart area is ready",
    readyDescription:
      "Run a ticker search to load candlesticks, volume, and moving averages in the main detail panel.",
    showingLastSuccessful: "Showing the last successful chart",
    lastClose: "Last close",
    sessionRange: "Session range",
    open: "Open",
    volume: "Volume",
    volumeShort: "Vol",
    candlesShown: (count: number) => `${count} candles shown`,
    updating: (range: string) => `Updating ${range} chart...`,
    emptyTitle: "Chart data will appear here",
    emptyDescription:
      "Select a timeframe after loading a ticker to inspect candles, volume, and moving averages without crowding the page.",
  },
  valuation: {
    title: "Valuation Cards",
    description:
      "PER, PBR, Residual Income, Simplified DCF, Relative Valuation, DDM, and EV/EBITDA Relative remain separate so you can compare methods without collapsing them into a single score.",
    badgeNoQuote: "Search a ticker to load valuations",
    viewBadge: (ticker: string) => `${ticker} valuation view`,
    methodsCount: (count: number) => `${count} methods`,
    nonFatalIssues: (count: number) => `${count} non-fatal issue${count > 1 ? "s" : ""}`,
    readyTitle: "Valuation cards are ready",
    readyDescription:
      "After you search a supported ticker, each method will render independently so missing inputs or temporary data issues do not block the rest of the valuation view.",
    showingLastSuccessful: "Showing the last successful valuation set",
    sectionDescription:
      "Each card is calculated separately in the Python sidecar. If one method is missing inputs or hits a temporary data issue, the others still remain visible.",
    calculatedCount: (count: number) => `${count} calculated`,
    unavailableCount: (count: number) => `${count} unavailable`,
    temporaryIssueCount: (count: number) => `${count} temporary issue${count > 1 ? "s" : ""}`,
    updating: "Updating valuation cards...",
    emptyTitle: "Valuation results will appear here",
    emptyDescription:
      "The section will show method-by-method fair value cards with expandable assumptions and inputs after the quote finishes loading.",
    fallbackUnavailableDescription: "This valuation method is not available right now.",
    fallbackErrorDescription: "This valuation method hit a temporary issue.",
    badgeTemporaryIssue: "Temporary issue",
    badgeUnavailable: "Unavailable",
    badgeUndervalued: "Undervalued",
    badgeOvervalued: "Overvalued",
    badgeFair: "Fair",
    showDetails: "Show details",
    hideDetails: "Hide details",
    fairValue: "Fair value",
    currentPrice: "Current price",
    difference: "Difference",
    upsideDownside: "Upside / downside",
    judgement: "Judgement",
    temporaryCalculationIssue: "Temporary calculation issue",
    calculationUnavailable: "Calculation unavailable",
    inputs: "Inputs",
    assumptions: "Assumptions",
    noAdditional: (section: string) => `No additional ${section.toLowerCase()} were needed for this state.`,
    okSummary: (judgement: string) => `${judgement} versus the current market price.`,
    methodNames: {
      per: "PER Valuation",
      pbr: "PBR Valuation",
      residual_income: "Residual Income",
      simplified_dcf: "Simplified DCF",
      relative_valuation: "Relative Valuation",
      ddm: "Dividend Discount Model",
      ev_ebitda_relative: "EV/EBITDA Relative",
    },
    judgments: {
      undervalued: "Undervalued",
      fair: "Fair",
      overvalued: "Overvalued",
      na: "n/a",
    },
    detailLabels: {
      epsTtm: "EPS (TTM)",
      bps: "BPS",
      referencePer: "Reference PER",
      referencePbr: "Reference PBR",
      peerCount: "Peer count",
      peerSelectionBasis: "Peer selection",
      medianPerPeerCount: "PER peer count",
      medianPbrPeerCount: "PBR peer count",
      bookValueEquity: "Book value equity",
      sharesOutstanding: "Shares outstanding",
      netIncome: "Net income",
      reportedRoe: "Reported ROE",
      stableRoe: "Stable ROE",
      costOfEquity: "Cost of equity",
      terminalGrowth: "Terminal growth",
      forecastYears: "Forecast years",
      annualResidualIncome: "Annual residual income",
      annualDividend: "Annual dividend",
      previousTwelveMonthDividend: "Previous 12M dividend",
      trailingTwelveMonthDividend: "Trailing 12M dividend",
      dividendEventCount24m: "Dividend events (24M)",
      dividendSource: "Dividend source",
      nextDividend: "Next dividend",
      freeCashFlow: "Free cash flow",
      operatingCashFlow: "Operating cash flow",
      capitalExpenditure: "Capital expenditure",
      totalDebt: "Total debt",
      totalCash: "Total cash",
      baseFreeCashFlow: "Base free cash flow",
      discountRate: "Discount rate",
      growthRate: "Growth rate",
      fcfSource: "FCF source",
      netDebt: "Net debt",
      enterpriseValue: "Enterprise value",
      ebitda: "EBITDA",
      referenceEvToEbitda: "Reference EV/EBITDA",
      medianEvToEbitdaPeerCount: "EV/EBITDA peer count",
      fairEnterpriseValue: "Fair enterprise value",
      medianPer: "Median PER",
      medianPbr: "Median PBR",
      perComponentFairValue: "PER component",
      pbrComponentFairValue: "PBR component",
      blendMode: "Blend mode",
      componentCount: "Component count",
    },
    detailValueLabels: {
      average: "Average",
      reportedFreeCashFlow: "Reported free cash flow",
      operatingCashFlowPlusCapex: "Operating cash flow + capex",
      reportedDividendRate: "Reported dividend rate",
      trailingAnnualDividendRate: "Trailing annual dividend rate",
      trailingTwelveMonthSum: "Trailing 12M dividend sum",
      industry: "Industry",
      sector: "Sector",
    },
  },
};

const ja: typeof en = {
  common: {
    notAvailable: "該当なし",
    search: "検索",
    loading: "読み込み中...",
    retrySearch: "検索を再試行",
    retryChart: "チャートを再試行",
    retryValuations: "評価を再試行",
  },
  language: {
    label: "言語",
    en: "EN",
    ja: "日本語",
  },
  theme: {
    light: "ライトモード",
    dark: "ダークモード",
  },
  header: {
    badge: "リリース候補 MVP",
    title: "Equity Fair Value Terminal",
    description:
      "ティッカーまたは会社名で検索し、日本株・米国株のリアルタイム株価、ローソク足、複数の独立した評価手法を、落ち着いたデスクトップ画面でまとめて確認できます。",
  },
  search: {
    title: "検索",
    description:
      "ティッカー検索を中心に、7203 のような東証 4 桁コードもそのまま受け付けつつ、データ提供元が解決できる場合は会社名候補も入力中に表示します。",
    inputLabel: "ティッカーまたは会社名",
    placeholder: "ティッカーまたは会社名: AAPL / トヨタ / 7203 / 7203.T / Sony",
    quickPicks: "クイック選択",
    suggestionsLoading: "一致するティッカーと会社名を検索しています...",
    suggestionsUnavailable:
      "会社名候補は一時的に利用できません。ティッカー検索は引き続き利用できます。",
    suggestionsEmpty: "一致する日本株または米国株が見つかりませんでした。",
    suggestionsFooter:
      "Enter でハイライト中の候補を開くか、一覧から直接クリックしてください。",
    guidanceTitle: "会社名を入力すると候補シンボルを確認できます",
    guidanceDescription:
      "現状の提供元では英語の会社名検索がもっとも安定しています。日本語名は提供元が解決できる場合に表示され、7203 のような東証 4 桁コードも利用できます。",
    blankTitle: "ティッカーまたは会社名を入力してください",
    blankDescription:
      "AAPL や 7203、7203.T のようなシンボル、または Toyota のような会社名から始めてください。",
    noMatchTitle: "一致する銘柄が見つかりませんでした",
    noMatchDescription:
      "AAPL や 7203、7203.T のようなティッカー、またはもう少し具体的な英語の会社名でお試しください。",
    providerUnavailableTitle: "会社名検索は一時的に利用できません",
    providerUnavailableDescription:
      "ティッカーを直接入力するか、少し待ってから会社名検索を再試行してください。",
    emptyStateTitle: "検索から株価分析を始められます",
    emptyStateDescription:
      "AAPL や 7203、7203.T のようなティッカーから始めるか、Toyota、Sony、Microsoft などの会社名を入力して候補シンボルを選んでから詳細画面を開いてください。",
    coverageTitle: "対応範囲",
    coverageDescription:
      "画面はデスクトップ向けの密度を保ちつつ、どこかのセクションが一時的に失敗しても、取得済みデータをできるだけ維持します。",
    coverageMarketsTitle: "対応市場",
    coverageMarketsDescription:
      "MVP では yfinance が取得できる日本株と米国株を対象としています。",
    coverageFlowTitle: "検索フロー",
    coverageFlowDescription:
      "候補を選んだ場合も、ティッカーを直接入力した場合と同じ詳細フローを起動します。",
    coverageResilienceTitle: "安定性",
    coverageResilienceDescription:
      "株価、チャート、評価セクションはそれぞれ独立した loading / error 状態を持ちます。",
  },
  loadingPanel: {
    title: "銘柄詳細を読み込んでいます",
    description:
      "株価、チャート、評価セクションは、それぞれのリクエスト完了に合わせて順次表示されます。",
  },
  quote: {
    movementUp: "当日は上昇",
    movementDown: "当日は下落",
    movementFlat: "当日は横ばい",
    asOf: (label: string) => `${label} 時点`,
    currentPrice: "現在値",
    description:
      "yfinance の株価データを Python sidecar で正規化し、チャートや評価カードを消さずにデスクトップ詳細ビューへ表示します。",
    currency: "通貨",
    previousClose: "前日終値",
    absoluteChange: "値幅",
    changePercent: "騰落率",
    valuationActiveTitle: "評価セクション更新中",
    valuationActiveDescription:
      "下のチャートと評価カードは独立して更新されるため、1 つの手法が利用不可でも他の表示は維持されます。",
  },
  chart: {
    title: "ローソク足チャート",
    description: "日次 OHLCV と出来高、MA25 / MA75 / MA200 を表示します。",
    badgeNoQuote: "ティッカーを検索するとチャートを表示できます",
    dateRange: (start: string, end: string) => `${start} 〜 ${end}`,
    latestVolume: (value: string) => `最新出来高 ${value}`,
    readyTitle: "チャート表示の準備ができています",
    readyDescription:
      "ティッカーを検索すると、メインパネルにローソク足、出来高、移動平均が表示されます。",
    showingLastSuccessful: "直前に取得できたチャートを表示しています",
    lastClose: "終値",
    sessionRange: "当日レンジ",
    open: "始値",
    volume: "出来高",
    volumeShort: "出来高",
    candlesShown: (count: number) => `${count} 本を表示`,
    updating: (range: string) => `${range} のチャートを更新しています...`,
    emptyTitle: "ここにチャートが表示されます",
    emptyDescription:
      "ティッカーを読み込んだあとに期間を切り替えると、ローソク足、出来高、移動平均を見やすく確認できます。",
  },
  valuation: {
    title: "評価カード",
    description:
      "PER、PBR、残余利益法、簡易 DCF、相対評価、DDM、EV/EBITDA 相対評価を個別に並べ、単一スコアにまとめず比較できるようにしています。",
    badgeNoQuote: "ティッカーを検索すると評価を表示できます",
    viewBadge: (ticker: string) => `${ticker} の評価ビュー`,
    methodsCount: (count: number) => `${count} 手法`,
    nonFatalIssues: (count: number) => `非致命的な問題 ${count} 件`,
    readyTitle: "評価カードの準備ができています",
    readyDescription:
      "対応ティッカーを検索すると、各手法が独立して描画されるため、入力不足や一時的なデータ問題があっても他のカードは表示されます。",
    showingLastSuccessful: "直前に取得できた評価セットを表示しています",
    sectionDescription:
      "各カードは Python sidecar で個別に計算されます。ある手法で入力不足や一時的な問題があっても、他の手法は引き続き表示されます。",
    calculatedCount: (count: number) => `計算済み ${count} 件`,
    unavailableCount: (count: number) => `利用不可 ${count} 件`,
    temporaryIssueCount: (count: number) => `一時的な問題 ${count} 件`,
    updating: "評価カードを更新しています...",
    emptyTitle: "ここに評価結果が表示されます",
    emptyDescription:
      "株価の読み込みが終わると、手法ごとのフェアバリューカードと、展開可能な前提・入力がここに表示されます。",
    fallbackUnavailableDescription: "この評価手法は現在利用できません。",
    fallbackErrorDescription: "この評価手法で一時的な問題が発生しました。",
    badgeTemporaryIssue: "一時的な問題",
    badgeUnavailable: "利用不可",
    badgeUndervalued: "割安",
    badgeOvervalued: "割高",
    badgeFair: "妥当",
    showDetails: "詳細を表示",
    hideDetails: "詳細を隠す",
    fairValue: "フェアバリュー",
    currentPrice: "現在値",
    difference: "差額",
    upsideDownside: "上昇余地 / 下落余地",
    judgement: "判定",
    temporaryCalculationIssue: "計算で一時的な問題が発生しました",
    calculationUnavailable: "計算できません",
    inputs: "入力値",
    assumptions: "前提",
    noAdditional: (section: string) => `この状態では追加の${section}はありません。`,
    okSummary: (judgement: string) => `現在の市場価格に対する判定は ${judgement} です。`,
    methodNames: {
      per: "PER 評価",
      pbr: "PBR 評価",
      residual_income: "残余利益法",
      simplified_dcf: "簡易 DCF",
      relative_valuation: "相対評価",
      ddm: "DDM",
      ev_ebitda_relative: "EV/EBITDA 相対評価",
    },
    judgments: {
      undervalued: "割安",
      fair: "妥当",
      overvalued: "割高",
      na: "該当なし",
    },
    detailLabels: {
      epsTtm: "EPS (TTM)",
      bps: "BPS",
      referencePer: "参照 PER",
      referencePbr: "参照 PBR",
      peerCount: "比較対象数",
      peerSelectionBasis: "比較対象の基準",
      medianPerPeerCount: "PER 比較対象数",
      medianPbrPeerCount: "PBR 比較対象数",
      bookValueEquity: "株主資本簿価",
      sharesOutstanding: "発行済株式数",
      netIncome: "当期純利益",
      reportedRoe: "報告 ROE",
      stableRoe: "安定 ROE",
      costOfEquity: "株主資本コスト",
      terminalGrowth: "永久成長率",
      forecastYears: "予測年数",
      annualResidualIncome: "年間残余利益",
      annualDividend: "年間配当",
      previousTwelveMonthDividend: "前の 12 か月配当",
      trailingTwelveMonthDividend: "直近 12 か月配当",
      dividendEventCount24m: "24 か月の配当回数",
      dividendSource: "配当データの採用元",
      nextDividend: "次期配当",
      freeCashFlow: "フリーキャッシュフロー",
      operatingCashFlow: "営業キャッシュフロー",
      capitalExpenditure: "設備投資",
      totalDebt: "有利子負債",
      totalCash: "現金等",
      baseFreeCashFlow: "基準 FCF",
      discountRate: "割引率",
      growthRate: "成長率",
      fcfSource: "FCF の採用元",
      netDebt: "純有利子負債",
      enterpriseValue: "企業価値",
      ebitda: "EBITDA",
      referenceEvToEbitda: "参照 EV/EBITDA",
      medianEvToEbitdaPeerCount: "EV/EBITDA 比較対象数",
      fairEnterpriseValue: "算出企業価値",
      medianPer: "PER 中央値",
      medianPbr: "PBR 中央値",
      perComponentFairValue: "PER 算出値",
      pbrComponentFairValue: "PBR 算出値",
      blendMode: "合成方法",
      componentCount: "構成要素数",
    },
    detailValueLabels: {
      average: "平均",
      reportedFreeCashFlow: "報告値のフリーキャッシュフロー",
      operatingCashFlowPlusCapex: "営業 CF + 設備投資",
      reportedDividendRate: "報告済み配当率",
      trailingAnnualDividendRate: "直近年換算配当率",
      trailingTwelveMonthSum: "直近 12 か月配当合計",
      industry: "業種",
      sector: "セクター",
    },
  },
};

export const localeContent = {
  en,
  ja,
};

export type LocaleContent = typeof en;
