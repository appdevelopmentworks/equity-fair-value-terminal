# Error Handling Specification

## 1. 目的
本書は `equity-fair-value-terminal` における error handling の現行方針を定義する。

目的:
- ユーザー体験を壊さない
- 算出可能な情報はできる限り表示し続ける
- 開発時に原因追跡しやすい構造化 error を保つ

## 2. 基本原則
1. 部分成功を許容する
2. 構造化 error code を返す
3. ユーザー向け文言は平易にする
4. 推測で値を埋めない
5. 取得済みの成功データをエラーで消しすぎない

## 3. エラー分類

### 3.1 ユーザー入力系
- `INVALID_SYMBOL_FORMAT`
- `SEARCH_NO_RESULT`
- `UNSUPPORTED_MARKET`

### 3.2 外部データ取得系
- `MARKET_DATA_FETCH_FAILED`
- `FINANCIAL_DATA_FETCH_FAILED`
- `HISTORICAL_DATA_FETCH_FAILED`
- `SEARCH_PROVIDER_FAILED`
- `PEER_DATA_FETCH_FAILED`

### 3.3 計算不能系
- `MISSING_FINANCIAL_DATA`
- `NEGATIVE_EPS`
- `NEGATIVE_BPS`
- `INVALID_PEER_SET`
- `DCF_INPUT_INSUFFICIENT`
- `RESIDUAL_INCOME_INPUT_INSUFFICIENT`
- `VALUATION_CALCULATION_FAILED`

### 3.4 sidecar / 実行系
- `SIDECAR_EXECUTION_FAILED`
- `SIDECAR_TIMEOUT`
- `SIDECAR_INVALID_RESPONSE`
- `JSON_PARSE_FAILED`

### 3.5 内部エラー系
- `INTERNAL_ERROR`
- `UNKNOWN_ERROR`

## 4. レイヤー別責務

### 4.1 Python sidecar
責務:
- 例外を構造化 error に変換する
- valuation method 単位で `ok / unavailable / error` を返す
- raw traceback をユーザー向け payload に含めない

### 4.2 Rust / Tauri
責務:
- sidecar 起動失敗、タイムアウト、stdout/stderr 問題を吸収する
- frontend が扱いやすい統一形式へ正規化する

### 4.3 Frontend / Next.js
責務:
- error code を user-facing copy に変換する
- loading / empty / error / unavailable / partial-failure を描き分ける
- 直前の成功済みデータを可能な限り保持する

## 5. 現在の UI 挙動

### 5.1 検索失敗
ケース:
- blank input
- invalid ticker-like input
- company-name no match
- search provider failure

現行挙動:
- 検索エリア内の notice で案内する
- 既に表示中の成功済み detail view は消さない

### 5.2 quote 取得失敗
現行挙動:
- 検索カード内に error notice を表示する
- 再試行ボタンを表示できる場合は出す
- 直前の成功済み detail view は保持する

### 5.3 chart 取得失敗
現行挙動:
- chart が未取得なら chart panel を error state で表示する
- 直前の成功済み chart がある場合は保持し、「last successful chart を表示中」の notice を出す

### 5.4 valuations 取得失敗
現行挙動:
- valuations が未取得なら valuation panel を error state で表示する
- 直前の成功済み valuations がある場合は保持し、「last successful valuation set を表示中」の notice を出す

### 5.5 valuation method unavailable
現行挙動:
- 対象カードのみ `unavailable`
- 理由を 1 行で表示
- 他手法カードは継続表示

## 6. ユーザー向けメッセージ規約
- 短く、非技術的に書く
- blame を避ける
- 次の行動を示す

現状:
- UI copy は English

MVP+:
- error code をキーにして English / Japanese の辞書を切り替える

避ける例:
- `KeyError`
- `JSONDecodeError`
- `subprocess returned non-zero exit status`

## 7. API / JSON レスポンス規約

### 7.1 全体成功
```json
{
  "ok": true,
  "status": "ok"
}
```

### 7.2 部分失敗あり
valuation payload では method ごとに `status = unavailable / error` を許容する。

```json
{
  "ok": true,
  "status": "ok",
  "symbol": "AAPL",
  "valuations": [
    {
      "method_id": "per",
      "status": "ok"
    },
    {
      "method_id": "residual_income",
      "status": "unavailable",
      "reason_if_unavailable": "ROE is too distorted for a stable residual income valuation."
    }
  ],
  "errors": [
    {
      "scope": "valuation:residual_income",
      "error_code": "RESIDUAL_INCOME_INPUT_INSUFFICIENT",
      "message": "ROE is too distorted for a stable residual income valuation."
    }
  ]
}
```

### 7.3 全体失敗
```json
{
  "ok": false,
  "errorCode": "INVALID_SYMBOL_FORMAT",
  "message": "Ticker not found.",
  "retryable": false
}
```

## 8. unavailable ルール

### 8.1 PER法
- EPS 欠損
- EPS <= 0
- reference PER 決定不可

### 8.2 PBR法
- BPS 欠損
- BPS <= 0
- reference PBR 決定不可

### 8.3 残余利益法
- 簿価純資産欠損
- 株式数欠損
- 利益または ROE 欠損
- ROE sanity check 不通過

### 8.4 簡易DCF
- FCF または代替入力不足
- 株式数不足
- debt / cash 情報不足
- terminal value 不安定

### 8.5 相対評価法
- peer 不足
- EPS / BPS の両方不足
- peer multipliers の異常値が多すぎる

## 9. loading / retry 方針
- 検索開始時は loading state を表示する
- chart / valuation は section 単位で loading を出す
- retry は manual button を基本とする
- 自動 retry は現行実装では採用していない

## 10. localization 方針
error code は locale-neutral を維持する。

frontend 側で以下を locale 切替対象とする。
- error title
- error description
- search guidance
- unavailable explanation

## 11. テスト観点
1. 不正ティッカー入力
2. company-name search no result
3. provider search failure
4. chart のみ取得失敗
5. valuations のみ取得失敗
6. 一部 valuation のみ unavailable
7. sidecar stdout 異常
8. timeout
9. 日本株 / 米国株の代表銘柄 smoke test

## 12. Codex 実装時の注意
- `unavailable` と `error` を混同しない
- 成功済みデータをエラー時に消しすぎない
- locale 追加時も error code は変えない
- raw stack trace を UI 文言へ流さない
