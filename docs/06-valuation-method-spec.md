# Valuation Method Specification

## 1. 基本方針
本アプリでは「手法ごとに理論株価を個別表示する」。

各手法の前提差・弱点を混ぜず、結果を並列表示することで、ユーザーが比較しやすい状態を目指す。

## 2. 現在実装済みの手法
1. `per` / `PER Valuation`
2. `pbr` / `PBR Valuation`
3. `residual_income` / `Residual Income`
4. `simplified_dcf` / `Simplified DCF`
5. `relative_valuation` / `Relative Valuation`

## 3. 共通ルール

### 3.1 sidecar 出力項目
各手法は以下を返す。
- `method_id`
- `method_name`
- `status`
- `fair_value`
- `current_price`
- `price_gap`
- `upside_downside_pct`
- `judgment`
- `currency`
- `assumptions`
- `inputs`
- `reason_if_unavailable`

### 3.2 status
- `ok`
- `unavailable`
- `error`

意味:
- `ok`: 計算成功
- `unavailable`: 入力不足または business-rule 上の算出不可
- `error`: 一時的・システム的な失敗

### 3.3 判定ロジック
現在の内部判定値:
- `undervalued`
- `fair`
- `overvalued`

閾値:
- `fair_value >= current_price * 1.15` → `undervalued`
- `fair_value <= current_price * 0.85` → `overvalued`
- それ以外 → `fair`

### 3.4 UI 表示ラベル
現状:
- English label を frontend で表示している

MVP+ bilingual mapping:
- `undervalued` → `Undervalued` / `割安`
- `fair` → `Fair` / `妥当`
- `overvalued` → `Overvalued` / `割高`

### 3.5 算出不可ルール
必要な入力項目が欠けた場合は推定で埋めず、`status = unavailable` を返す。
必ず `reason_if_unavailable` を付ける。

## 4. 市場別固定初期値
現在実装の market assumptions:

### US
- `cost_of_equity = 0.10`
- `discount_rate = 0.10`
- `growth_rate = 0.06`
- `terminal_growth = 0.02`

### JP
- `cost_of_equity = 0.08`
- `discount_rate = 0.08`
- `growth_rate = 0.04`
- `terminal_growth = 0.01`

## 5. PER法

### 5.1 目的
EPS と reference PER を用いて理論株価を算出する。

### 5.2 基本式
`理論株価 = EPS × reference PER`

### 5.3 現在の入力
- `current_price`
- `eps_ttm`
- `reference_per`

### 5.4 reference PER
現在実装では peer 群の中央値 PER を採用する。

### 5.5 算出不可条件
- `eps_ttm <= 0`
- `eps_ttm` 欠損
- peer から妥当な `reference_per` を得られない

## 6. PBR法

### 6.1 目的
BPS と reference PBR を用いて理論株価を算出する。

### 6.2 基本式
`理論株価 = BPS × reference PBR`

### 6.3 現在の入力
- `current_price`
- `bps`
- `reference_pbr`

### 6.4 reference PBR
現在実装では peer 群の中央値 PBR を採用する。

### 6.5 算出不可条件
- `bps <= 0`
- `bps` 欠損
- peer から妥当な `reference_pbr` を得られない

## 7. 残余利益法

### 7.1 目的
簿価純資産と将来残余利益から株主価値を推定する。

### 7.2 概念式
`株主価値 = 現在簿価 + 将来残余利益の現在価値`

### 7.3 現在の簡易モデル
- 現在簿価純資産を起点にする
- `net_income / book_value_equity` から ROE をみる
- 市場別固定 `cost_of_equity` を使う
- terminal growth は市場別固定値を使う

### 7.4 追加の sanity rule
現在実装では、ROE が極端な場合は misleading になりやすいため unavailable にする。

sanity band:
- `MIN_REASONABLE_ROE = -0.50`
- `MAX_REASONABLE_ROE = 0.60`

### 7.5 算出不可条件
- `book_value_equity` 欠損
- `shares_outstanding` 欠損
- `net_income` または `roe` を取得できない
- ROE が歪みすぎていて保守的に評価できない

## 8. 簡易DCF

### 8.1 目的
yfinance から取得可能な FCF / cash flow / debt / cash 情報を使って簡易的な本源的価値を算出する。

### 8.2 基本方針
- 厳密な WACC モデルではなく簡易版
- FCF を起点とする
- 予測期間は `5` 年
- 成長率と割引率は市場別固定値

### 8.3 現在の FCF ソース優先順
1. `free_cash_flow`
2. `operating_cash_flow - capital_expenditure`

### 8.4 入力
- `free_cash_flow` または代替 FCF
- `shares_outstanding`
- `total_debt`
- `total_cash`
- `discount_rate`
- `growth_rate`
- `terminal_growth`

### 8.5 算出不可条件
- FCF 系項目を取得できない
- `shares_outstanding` を取得できない
- `debt / cash` 系項目不足で equity value 化できない
- terminal value が不安定

## 9. 相対評価法

### 9.1 目的
peer 群の valuation 水準から対象銘柄の理論株価を出す。

### 9.2 現在の MVP 範囲
- peer median PER 比較
- peer median PBR 比較

### 9.3 peer 選定
- sector / industry を起点とする
- 十分な比較対象が不足する場合、industry → sector の順で緩める
- peer 数は概ね `5〜12` を目安とする

### 9.4 現在の算定
- `peer median PER × EPS`
- `peer median PBR × BPS`
- 2 つ計算できる場合は平均を採用する
- 片方のみ計算できる場合はその結果を返す

### 9.5 算出不可条件
- peer を十分に抽出できない
- EPS / BPS の両方が不足
- peer multipliers が極端に欠損または異常

## 10. データ品質ルール
- EPS、BPS、株式数、簿価純資産は極力最新の利用可能値を使う
- 欠損補完は安易に行わない
- peer 比較では負の PER や極端な PBR を除外可能な設計とする
- unavailable を許容し、計算不能を隠さない

## 11. sidecar JSON 返却例
```json
{
  "method_id": "per",
  "method_name": "PER Valuation",
  "status": "ok",
  "fair_value": 138.28,
  "current_price": 253.5,
  "price_gap": -115.22,
  "upside_downside_pct": -45.45,
  "judgment": "overvalued",
  "currency": "USD",
  "assumptions": {
    "reference_per": 17.5
  },
  "inputs": {
    "eps_ttm": 7.9
  },
  "reason_if_unavailable": null
}
```

## 12. yfinance feasibility review

### 12.1 現在の 5 手法
- PER法:
  - feasibility は高い
  - EPS と peer PER があれば比較的安定
- PBR法:
  - feasibility は高い
  - BPS と peer PBR があれば比較的安定
- 残余利益法:
  - feasibility は中程度
  - book value / net income / shares は取れても、ROE が歪んで unavailable になりやすい
- 簡易DCF:
  - feasibility は中程度
  - cash flow / debt / cash 欠損時は unavailable になりやすい
- 相対評価法:
  - feasibility は中〜高
  - peer screen の品質に依存する

### 12.2 DDM のレビュー
位置づけ:
- MVP+ 候補

可算性:
- stable dividend payer では候補になりうる
- 非配当銘柄、減配直後、特殊配当銘柄では unavailable が多くなる

必要データの候補:
- `dividendRate` または dividend history
- current price
- growth assumption
- discount rate

判断:
- 実装前に、日米代表銘柄で unavailable 率を先に検証する

### 12.3 EV/EBITDA ベース相対評価のレビュー
位置づけ:
- MVP+ 候補

可算性:
- enterprise value と EBITDA 系の取得可否に依存する
- 日米で field availability の差が大きい可能性がある

必要データの候補:
- enterprise value
- EBITDA
- peer EV/EBITDA

判断:
- 実装前に yfinance field availability を調査し、欠損率が高い場合は future へ送る

## 13. スコープ階層

### Current MVP
- PER法
- PBR法
- 残余利益法
- 簡易DCF
- 相対評価法（PER/PBR ベース）

### MVP+
- DDM の追加可否判断
- EV/EBITDA 相対評価の追加可否判断
- judgement label の bilingual 化

### Future
- シナリオ別 DCF
- sector 別割引率テーブル
- 総合スコア
