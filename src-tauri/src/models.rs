use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuoteBridgeResponse {
    pub ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", alias = "company_name")]
    pub company_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ticker: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", alias = "current_price")]
    pub current_price: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none", alias = "previous_close")]
    pub previous_close: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub change: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none", alias = "change_percent")]
    pub change_percent: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub currency: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub exchange: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", alias = "as_of")]
    pub as_of: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", alias = "error_code")]
    pub error_code: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub retryable: Option<bool>,
}

impl QuoteBridgeResponse {
    pub fn error(error_code: &str, message: &str, retryable: bool) -> Self {
        Self {
            ok: false,
            status: None,
            company_name: None,
            ticker: None,
            current_price: None,
            previous_close: None,
            change: None,
            change_percent: None,
            currency: None,
            exchange: None,
            as_of: None,
            error_code: Some(error_code.to_string()),
            message: Some(message.to_string()),
            retryable: Some(retryable),
        }
    }

    pub fn is_valid_success(&self) -> bool {
        self.ok
            && self.ticker.is_some()
            && self.company_name.is_some()
            && self.current_price.is_some()
            && self.previous_close.is_some()
            && self.change.is_some()
            && self.change_percent.is_some()
            && self.currency.is_some()
            && self.exchange.is_some()
            && self.as_of.is_some()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchCandidateBridgeResponse {
    pub symbol: String,
    #[serde(default, alias = "short_name")]
    pub short_name: Option<String>,
    #[serde(default, alias = "long_name")]
    pub long_name: Option<String>,
    pub exchange: String,
    #[serde(alias = "quote_type")]
    pub quote_type: String,
    pub currency: String,
}

impl SearchCandidateBridgeResponse {
    pub fn is_valid(&self) -> bool {
        !self.symbol.trim().is_empty()
            && !self.exchange.trim().is_empty()
            && !self.quote_type.trim().is_empty()
            && !self.currency.trim().is_empty()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchBridgeResponse {
    pub ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub query: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub results: Option<Vec<SearchCandidateBridgeResponse>>,
    #[serde(skip_serializing_if = "Option::is_none", alias = "error_code")]
    pub error_code: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub retryable: Option<bool>,
}

impl SearchBridgeResponse {
    pub fn error(error_code: &str, message: &str, retryable: bool) -> Self {
        Self {
            ok: false,
            status: None,
            query: None,
            results: None,
            error_code: Some(error_code.to_string()),
            message: Some(message.to_string()),
            retryable: Some(retryable),
        }
    }

    pub fn is_valid_success(&self) -> bool {
        self.ok
            && self.query.is_some()
            && self
                .results
                .as_ref()
                .is_some_and(|results| results.iter().all(SearchCandidateBridgeResponse::is_valid))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChartCandle {
    pub date: String,
    pub open: f64,
    pub high: f64,
    pub low: f64,
    pub close: f64,
    pub volume: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MovingAveragePoint {
    pub date: String,
    pub value: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChartMovingAverages {
    #[serde(default)]
    pub ma25: Vec<MovingAveragePoint>,
    #[serde(default)]
    pub ma75: Vec<MovingAveragePoint>,
    #[serde(default)]
    pub ma200: Vec<MovingAveragePoint>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChartBridgeResponse {
    pub ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ticker: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub range: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub candles: Option<Vec<ChartCandle>>,
    #[serde(skip_serializing_if = "Option::is_none", alias = "moving_averages")]
    pub moving_averages: Option<ChartMovingAverages>,
    #[serde(skip_serializing_if = "Option::is_none", alias = "error_code")]
    pub error_code: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub retryable: Option<bool>,
}

impl ChartBridgeResponse {
    pub fn error(error_code: &str, message: &str, retryable: bool) -> Self {
        Self {
            ok: false,
            status: None,
            ticker: None,
            range: None,
            candles: None,
            moving_averages: None,
            error_code: Some(error_code.to_string()),
            message: Some(message.to_string()),
            retryable: Some(retryable),
        }
    }

    pub fn is_valid_success(&self) -> bool {
        self.ok
            && self.ticker.is_some()
            && self.range.is_some()
            && self
                .candles
                .as_ref()
                .is_some_and(|candles| !candles.is_empty())
            && self.moving_averages.is_some()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValuationMethodBridgeResponse {
    #[serde(alias = "method_id")]
    pub method_id: String,
    #[serde(alias = "method_name")]
    pub method_name: String,
    pub status: String,
    #[serde(default, alias = "fair_value")]
    pub fair_value: Option<f64>,
    #[serde(default, alias = "current_price")]
    pub current_price: Option<f64>,
    #[serde(default, alias = "price_gap")]
    pub price_gap: Option<f64>,
    #[serde(default, alias = "upside_downside_pct")]
    pub upside_downside_pct: Option<f64>,
    #[serde(default)]
    pub judgment: Option<String>,
    #[serde(default)]
    pub currency: Option<String>,
    #[serde(default)]
    pub assumptions: HashMap<String, Value>,
    #[serde(default)]
    pub inputs: HashMap<String, Value>,
    #[serde(default, alias = "reason_if_unavailable")]
    pub reason_if_unavailable: Option<String>,
}

impl ValuationMethodBridgeResponse {
    pub fn is_valid(&self) -> bool {
        if self.method_id.trim().is_empty() || self.method_name.trim().is_empty() {
            return false;
        }

        match self.status.as_str() {
            "ok" => {
                self.fair_value.is_some()
                    && self.current_price.is_some()
                    && self.price_gap.is_some()
                    && self.upside_downside_pct.is_some()
                    && self.judgment.is_some()
                    && self.currency.is_some()
            }
            "unavailable" | "error" => self.current_price.is_some() && self.currency.is_some(),
            _ => false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValuationIssueBridgeResponse {
    pub scope: String,
    #[serde(alias = "error_code")]
    pub error_code: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValuationsBridgeResponse {
    pub ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", alias = "symbol")]
    pub ticker: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub currency: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub valuations: Option<Vec<ValuationMethodBridgeResponse>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub errors: Option<Vec<ValuationIssueBridgeResponse>>,
    #[serde(skip_serializing_if = "Option::is_none", alias = "error_code")]
    pub error_code: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub retryable: Option<bool>,
}

impl ValuationsBridgeResponse {
    pub fn error(error_code: &str, message: &str, retryable: bool) -> Self {
        Self {
            ok: false,
            status: None,
            ticker: None,
            currency: None,
            valuations: None,
            errors: None,
            error_code: Some(error_code.to_string()),
            message: Some(message.to_string()),
            retryable: Some(retryable),
        }
    }

    pub fn is_valid_success(&self) -> bool {
        self.ok
            && self.ticker.is_some()
            && self.currency.is_some()
            && self.valuations.as_ref().is_some_and(|valuations| {
                !valuations.is_empty()
                    && valuations
                        .iter()
                        .all(ValuationMethodBridgeResponse::is_valid)
            })
    }
}
