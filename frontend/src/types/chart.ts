import type {BridgeErrorResponse} from "@/types/quote";

export type ChartRange = "1M" | "3M" | "6M" | "1Y" | "5Y" | "MAX";

export type ChartCandle = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type MovingAveragePoint = {
  date: string;
  value: number;
};

export type ChartMovingAverages = {
  ma25: MovingAveragePoint[];
  ma75: MovingAveragePoint[];
  ma200: MovingAveragePoint[];
};

export type ChartSuccessResponse = {
  ok: true;
  status: "ok";
  ticker: string;
  range: ChartRange;
  candles: ChartCandle[];
  movingAverages: ChartMovingAverages;
};

export type ChartBridgeResponse = ChartSuccessResponse | BridgeErrorResponse;
