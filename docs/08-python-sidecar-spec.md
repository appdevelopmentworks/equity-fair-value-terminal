# Python Sidecar Specification

## 1. 目的
Python sidecar は以下を担当する。
- yfinance からのデータ取得
- 財務データの正規化
- valuation 計算
- frontend へ返す JSON の生成

フロント / Rust 側に財務ロジックを持ち込まず、計算責務を Python に集約する。

## 2. 現在の配置
```text
/python-sidecar
  /src
    main.py
    handlers/
      chart.py
      quote.py
      search.py
      valuation.py
    services/
      cache_service.py
      market_data_normalizer.py
      yfinance_client.py
    valuation/
      common.py
      constants.py
      per.py
      pbr.py
      residual_income.py
      simplified_dcf.py
      relative_valuation.py
    models/
      request_models.py
      response_models.py
    utils/
      numbers.py
      dates.py
      logging.py
  requirements.txt
  pyinstaller.spec
```

## 3. 実行方式

### 3.1 現在の方式
- command 実行ごとに JSON を返す
- stdout に JSON payload を出す
- Tauri / Rust から subprocess として呼び出す

### 3.2 実装済みコマンド
- `quote <ticker>`
- `chart <ticker> <range>`
- `search <query>`
- `valuations-only <ticker>`

### 3.3 未実装の統合コマンド
`stock_detail` のような combined endpoint は現在未実装。

理由:
- 現行 frontend は quote / chart / valuations を分離して読み込む
- section 単位の loading / retry / partial failure を実現しやすい

将来:
- 性能最適化が必要になった場合に `stock_detail` を検討する

## 4. 現在のコマンド契約

### 4.1 search
入力:
- `query`

出力:
- 候補銘柄一覧
  - `symbol`
  - `shortName`
  - `longName`
  - `exchange`
  - `quoteType`
  - `currency`

成功例:
```json
{
  "ok": true,
  "status": "ok",
  "query": "toyota",
  "results": [
    {
      "symbol": "TM",
      "shortName": "Toyota Motor Corporation",
      "longName": "Toyota Motor Corporation",
      "exchange": "NYQ",
      "quoteType": "EQUITY",
      "currency": "USD"
    }
  ]
}
```

### 4.2 quote
入力:
- `ticker`

出力:
- `ticker`
- `companyName`
- `currentPrice`
- `previousClose`
- `change`
- `changePercent`
- `currency`
- `exchange`
- `asOf`

### 4.3 chart
入力:
- `ticker`
- `range`

出力:
- `ticker`
- `range`
- `candles`
  - `date`
  - `open`
  - `high`
  - `low`
  - `close`
  - `volume`
- `movingAverages`
  - `ma25`
  - `ma75`
  - `ma200`

### 4.4 valuations-only
入力:
- `ticker`

出力:
- `symbol`
- `currency`
- `valuations`
- `errors`

## 5. エラーレスポンス
全コマンド共通で、全体失敗時は以下を返す。

```json
{
  "ok": false,
  "errorCode": "MARKET_DATA_FETCH_FAILED",
  "message": "Quote data could not be loaded.",
  "retryable": true
}
```

## 6. yfinance 取得ポリシー
- 検索は `yfinance.Search` を優先する
- 価格履歴は `period / interval` を range に応じて切り替える
- 財務データは available な最新版を採用する
- field 名の揺れは `market_data_normalizer.py` と `yfinance_client.py` で吸収する
- 日本株 / 米国株のみを sidecar 側でフィルタする

## 7. キャッシュ戦略

### 7.1 現在の実装
- yfinance cache location を sidecar 内で設定する
- frontend 側で検索候補を短期 cache する

### 7.2 次段階の候補
- quote / chart / peer data のアプリ独自 short-lived cache
- `cache_service.py` の本格利用

## 8. localization 境界
sidecar は locale-neutral を維持する。

sidecar が返すもの:
- raw number
- raw timestamp
- stable `errorCode`
- stable `judgment` enum

frontend が担当するもの:
- fixed UI labels
- error message localization
- judgement label localization
- date / number / currency formatting

## 9. 追加 valuation module の扱い

### 9.1 MVP+ 候補
- `ddm.py`
- `ev_ebitda_relative.py`

### 9.2 追加条件
- yfinance から十分な入力を取得できるかを先に検証する
- unavailable 率が高すぎる場合は追加しない
- 既存 5 手法の contract を壊さない

## 10. テスト対象
- search の結果整形
- quote の欠損耐性
- chart の OHLCV / moving average 整形
- valuation ごとの算出 / unavailable / error 分岐
- JSON schema の安定性
- 日本株・米国株の代表銘柄 smoke test

## 11. 設計原則
- handler 層と valuation ロジックを分ける
- 1 手法 1 モジュールを基本にする
- sidecar の I/O と計算ロジックを分離する
- localization は frontend に寄せる
