import type {BridgeErrorResponse} from "@/types/quote";

export type ValuationStatus = "ok" | "unavailable" | "error";

export type ValuationMethodResponse = {
  methodId: string;
  methodName: string;
  status: ValuationStatus;
  fairValue: number | null;
  currentPrice: number | null;
  priceGap: number | null;
  upsideDownsidePct: number | null;
  judgment: string | null;
  currency: string | null;
  assumptions: Record<string, unknown>;
  inputs: Record<string, unknown>;
  reasonIfUnavailable: string | null;
};

export type ValuationIssueResponse = {
  scope: string;
  errorCode: string;
  message: string;
};

export type ValuationsSuccessResponse = {
  ok: true;
  status: "ok";
  ticker: string;
  currency: string;
  valuations: ValuationMethodResponse[];
  errors: ValuationIssueResponse[];
};

export type ValuationsBridgeResponse = ValuationsSuccessResponse | BridgeErrorResponse;
