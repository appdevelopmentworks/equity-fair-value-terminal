export type BridgeErrorResponse = {
  ok: false;
  errorCode: string;
  message: string;
  retryable: boolean;
};

export type QuoteSuccessResponse = {
  ok: true;
  status: "ok";
  ticker: string;
  companyName: string;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  currency: string;
  exchange: string;
  asOf: string;
};

export type QuoteBridgeResponse = QuoteSuccessResponse | BridgeErrorResponse;
