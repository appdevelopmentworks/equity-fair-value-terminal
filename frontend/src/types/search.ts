import type {BridgeErrorResponse} from "@/types/quote";

export type SearchCandidate = {
  symbol: string;
  shortName: string | null;
  longName: string | null;
  exchange: string;
  quoteType: string;
  currency: string;
};

export type SearchSuggestionState = "idle" | "loading" | "ready" | "empty" | "error";

export type SearchSuccessResponse = {
  ok: true;
  status: "ok";
  query: string;
  results: SearchCandidate[];
};

export type SearchBridgeResponse = SearchSuccessResponse | BridgeErrorResponse;
