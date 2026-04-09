import {type AppLocale} from "@/lib/i18n-config";

type ErrorCopy = {
  title: string;
  description: string;
};

const messageMap: Record<AppLocale, Record<string, ErrorCopy>> = {
  en: {
    INVALID_SYMBOL_FORMAT: {
      title: "Enter a ticker or choose a suggestion",
      description: "Use a ticker like AAPL or 7203.T, or pick a company-name match from the list.",
    },
    SEARCH_NO_RESULT: {
      title: "No stock was found",
      description: "No matching Japanese or US stock was returned for that lookup.",
    },
    SEARCH_PROVIDER_FAILED: {
      title: "Company-name search is unavailable",
      description: "Try a ticker directly, or retry the company name in a moment.",
    },
    UNSUPPORTED_MARKET: {
      title: "This market is not supported",
      description: "The MVP currently supports Japanese and US stocks only.",
    },
    MARKET_DATA_FETCH_FAILED: {
      title: "Quote data is unavailable",
      description: "Please check your connection and try again in a moment.",
    },
    FINANCIAL_DATA_FETCH_FAILED: {
      title: "Valuation data is unavailable",
      description: "Fundamental data could not be loaded right now. Please try again in a moment.",
    },
    HISTORICAL_DATA_FETCH_FAILED: {
      title: "Chart data is unavailable",
      description: "Try a different range or try again in a moment.",
    },
    PEER_DATA_FETCH_FAILED: {
      title: "Peer comparison data is unavailable",
      description: "Peer-based valuation methods could not load their reference data right now.",
    },
    MISSING_FINANCIAL_DATA: {
      title: "A valuation input is missing",
      description: "This method cannot be calculated with the currently available financial data.",
    },
    MISSING_DIVIDEND_DATA: {
      title: "DDM is unavailable",
      description: "Dividend data is not available for the dividend discount model.",
    },
    DDM_UNSUITABLE_DIVIDEND_HISTORY: {
      title: "DDM is unavailable",
      description: "Dividend history is not stable enough for the dividend discount model.",
    },
    MISSING_EV_EBITDA_DATA: {
      title: "EV/EBITDA valuation is unavailable",
      description: "Enterprise value, EBITDA, or net debt inputs are not sufficient for this method.",
    },
    NEGATIVE_EPS: {
      title: "PER valuation is unavailable",
      description: "PER needs a positive EPS value before it can be calculated.",
    },
    NEGATIVE_BPS: {
      title: "PBR valuation is unavailable",
      description: "PBR needs a positive BPS value before it can be calculated.",
    },
    INVALID_PEER_SET: {
      title: "Peer comparison is unavailable",
      description: "A stable peer set could not be selected for this valuation method.",
    },
    DCF_INPUT_INSUFFICIENT: {
      title: "DCF valuation is unavailable",
      description: "The cash flow inputs are not sufficient for the simplified DCF method.",
    },
    RESIDUAL_INCOME_INPUT_INSUFFICIENT: {
      title: "Residual income valuation is unavailable",
      description: "The residual income inputs are not stable enough for this method.",
    },
    VALUATION_CALCULATION_FAILED: {
      title: "A valuation method failed",
      description: "One calculation hit a temporary issue. Please try again in a moment.",
    },
    SIDECAR_EXECUTION_FAILED: {
      title: "Desktop bridge is unavailable",
      description: "Restart the app and try the search again.",
    },
    SIDECAR_TIMEOUT: {
      title: "The request timed out",
      description: "The quote lookup took too long. Please try again.",
    },
    SIDECAR_INVALID_RESPONSE: {
      title: "Desktop bridge returned incomplete data",
      description: "Please restart the app and try the search again.",
    },
    JSON_PARSE_FAILED: {
      title: "Desktop bridge returned unreadable data",
      description: "Please restart the app and try the search again.",
    },
    INTERNAL_ERROR: {
      title: "Something went wrong",
      description: "Please try again in a moment.",
    },
    UNKNOWN_ERROR: {
      title: "Something went wrong",
      description: "Please retry the search. If it keeps happening, restart the app.",
    },
  },
  ja: {
    INVALID_SYMBOL_FORMAT: {
      title: "ティッカーを入力するか候補を選択してください",
      description:
        "AAPL や 7203.T のようなティッカーを入力するか、一覧から一致する会社名候補を選んでください。",
    },
    SEARCH_NO_RESULT: {
      title: "銘柄が見つかりませんでした",
      description: "一致する日本株または米国株が検索結果に返ってきませんでした。",
    },
    SEARCH_PROVIDER_FAILED: {
      title: "会社名検索を利用できません",
      description: "ティッカーを直接入力するか、少し待ってから会社名検索を再試行してください。",
    },
    UNSUPPORTED_MARKET: {
      title: "この市場は未対応です",
      description: "現在の MVP は日本株と米国株のみを対象としています。",
    },
    MARKET_DATA_FETCH_FAILED: {
      title: "株価データを取得できません",
      description: "接続状況を確認して、少し待ってからもう一度お試しください。",
    },
    FINANCIAL_DATA_FETCH_FAILED: {
      title: "評価データを取得できません",
      description: "財務データを今は読み込めません。少し待ってから再試行してください。",
    },
    HISTORICAL_DATA_FETCH_FAILED: {
      title: "チャートデータを取得できません",
      description: "別の期間を選ぶか、少し待ってから再試行してください。",
    },
    PEER_DATA_FETCH_FAILED: {
      title: "比較対象データを取得できません",
      description: "相対評価で使う比較対象データを今は読み込めませんでした。",
    },
    MISSING_FINANCIAL_DATA: {
      title: "評価に必要な入力が不足しています",
      description: "現在取得できている財務データでは、この手法を計算できません。",
    },
    MISSING_DIVIDEND_DATA: {
      title: "DDM を計算できません",
      description: "配当割引モデルに必要な配当データを取得できませんでした。",
    },
    DDM_UNSUITABLE_DIVIDEND_HISTORY: {
      title: "DDM を計算できません",
      description: "配当履歴が十分に安定しておらず、配当割引モデルには適していません。",
    },
    MISSING_EV_EBITDA_DATA: {
      title: "EV/EBITDA 評価を計算できません",
      description: "企業価値、EBITDA、または純有利子負債の入力が不足しています。",
    },
    NEGATIVE_EPS: {
      title: "PER 評価を計算できません",
      description: "PER 評価には正の EPS が必要です。",
    },
    NEGATIVE_BPS: {
      title: "PBR 評価を計算できません",
      description: "PBR 評価には正の BPS が必要です。",
    },
    INVALID_PEER_SET: {
      title: "比較対象を確定できません",
      description: "この評価手法で使える安定した比較対象セットを組めませんでした。",
    },
    DCF_INPUT_INSUFFICIENT: {
      title: "簡易 DCF を計算できません",
      description: "簡易 DCF に必要なキャッシュフロー入力が不足しています。",
    },
    RESIDUAL_INCOME_INPUT_INSUFFICIENT: {
      title: "残余利益法を計算できません",
      description: "残余利益法に必要な入力が不足しているか、安定性が足りません。",
    },
    VALUATION_CALCULATION_FAILED: {
      title: "評価計算で一時的な問題が発生しました",
      description: "いずれかの計算で一時的な問題が起きました。少し待ってから再試行してください。",
    },
    SIDECAR_EXECUTION_FAILED: {
      title: "デスクトップ連携を利用できません",
      description: "アプリを再起動してから、もう一度検索してください。",
    },
    SIDECAR_TIMEOUT: {
      title: "リクエストがタイムアウトしました",
      description: "株価の取得に時間がかかりすぎました。もう一度お試しください。",
    },
    SIDECAR_INVALID_RESPONSE: {
      title: "デスクトップ連携から不完全なデータが返りました",
      description: "アプリを再起動してから、もう一度検索してください。",
    },
    JSON_PARSE_FAILED: {
      title: "デスクトップ連携の応答を読み取れませんでした",
      description: "アプリを再起動してから、もう一度検索してください。",
    },
    INTERNAL_ERROR: {
      title: "問題が発生しました",
      description: "少し待ってから再試行してください。",
    },
    UNKNOWN_ERROR: {
      title: "問題が発生しました",
      description: "もう一度お試しください。続く場合はアプリを再起動してください。",
    },
  },
};

const fallbackByLocale: Record<AppLocale, ErrorCopy> = {
  en: {
    title: "Something went wrong",
    description: "Please retry the request. If it keeps happening, restart the app.",
  },
  ja: {
    title: "問題が発生しました",
    description: "もう一度お試しください。続く場合はアプリを再起動してください。",
  },
};

export function getUserFacingErrorCopyFromCode(errorCode: string, locale: AppLocale) {
  return messageMap[locale][errorCode] ?? fallbackByLocale[locale];
}

export function getUserFacingErrorCopy(error: {errorCode: string}, locale: AppLocale) {
  return getUserFacingErrorCopyFromCode(error.errorCode, locale);
}
