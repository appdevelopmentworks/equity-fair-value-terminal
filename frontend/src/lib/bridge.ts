import type {ChartBridgeResponse, ChartRange} from "@/types/chart";
import type {BridgeErrorResponse, QuoteBridgeResponse} from "@/types/quote";
import type {SearchBridgeResponse} from "@/types/search";
import type {ValuationsBridgeResponse} from "@/types/valuation";

function bridgeUnavailableResponse(): BridgeErrorResponse {
  return {
    ok: false,
    errorCode: "SIDECAR_EXECUTION_FAILED",
    message: "Tauri desktop bridge is not available. Launch the app with `npm run tauri:dev`.",
    retryable: false,
  };
}

export async function fetchQuote(ticker: string): Promise<QuoteBridgeResponse> {
  if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) {
    return bridgeUnavailableResponse();
  }

  const {invoke} = await import("@tauri-apps/api/core");
  return invoke<QuoteBridgeResponse>("fetch_quote", {ticker});
}

export async function fetchChart(ticker: string, chartRange: ChartRange): Promise<ChartBridgeResponse> {
  if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) {
    return bridgeUnavailableResponse();
  }

  const {invoke} = await import("@tauri-apps/api/core");
  return invoke<ChartBridgeResponse>("fetch_chart", {ticker, chartRange});
}

export async function searchSymbols(query: string): Promise<SearchBridgeResponse> {
  if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) {
    return bridgeUnavailableResponse();
  }

  const {invoke} = await import("@tauri-apps/api/core");
  return invoke<SearchBridgeResponse>("search_symbols", {query});
}

export async function fetchValuations(ticker: string): Promise<ValuationsBridgeResponse> {
  if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) {
    return bridgeUnavailableResponse();
  }

  const {invoke} = await import("@tauri-apps/api/core");
  return invoke<ValuationsBridgeResponse>("fetch_valuations", {ticker});
}
