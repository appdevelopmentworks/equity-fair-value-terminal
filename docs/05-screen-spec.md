# Screen Specification

## 1. 画面一覧
現行実装は単一ページ shell を採用している。

1. 検索トップ / 空状態
2. 銘柄詳細表示
3. セクション単位エラー / partial failure
4. ローディング状態

## 2. 画面遷移概要
- 起動 → 検索トップ / 空状態
- ティッカー入力または銘柄候補選択 → 同一ページ内で銘柄詳細表示
- 銘柄詳細表示中も上部検索バーから再検索可能
- 検索失敗時も、既に取得済みの detail view は可能な限り保持する

## 3. 検索トップ領域

### 3.1 目的
ユーザーが最短で対象銘柄に到達できるようにする。

### 3.2 現在の表示要素
- アプリタイトル
- サブコピー
- 検索入力欄
- 検索候補ドロップダウン
- quick picks
- dark mode toggle
- 検索ガイダンス / notice
- coverage summary card

### 3.3 UI 指針
- 主役は検索バー
- 余白を大きく取り、最初の一歩を迷わせない
- 上部に軽い説明、中央に検索機能を配置する
- desktop width で間延びしすぎない max-width を持つ

### 3.4 検索候補ドロップダウン
表示内容:
- company name
- symbol
- exchange
- currency

操作:
- click 選択
- `ArrowUp` / `ArrowDown`
- `Enter` で highlighted candidate を選択
- `Escape` で閉じる

### 3.5 検索状態
- blank input:
  - 入力ガイダンスを表示
- loading:
  - 検索欄と結果領域を loading 表示
- no matches:
  - 検索欄直下の notice で案内
- provider failure:
  - 「name suggestions are temporarily unavailable」系の notice を表示

注記:
- 現在の UI copy は English 固定
- 日本語の company-name candidate 表示は provider 応答に依存する

## 4. 銘柄詳細領域

### 4.1 現在のレイアウト順
上から順に:
1. アプリヘッダー
2. 検索カード
3. 空状態または株価サマリーカード
4. ローソク足チャートパネル
5. 理論株価カードパネル

### 4.2 株価サマリーカード
表示内容:
- company name
- ticker
- exchange
- 最終更新時刻
- 現在株価
- 前日比金額
- 前日比率
- currency
- previous close

現在は quote summary を 1 枚の card に集約している。

### 4.3 ローソク足チャートパネル
表示内容:
- ローソク足
- 出来高
- 25日移動平均
- 75日移動平均
- 200日移動平均
- 期間切替タブ
  - `1M`
  - `3M`
  - `6M`
  - `1Y`
  - `5Y`
  - `MAX`

UI 指針:
- チャート自体を大きく見せる
- 補助情報は視認性を阻害しない
- timeframe の selected 状態を明確にする

### 4.4 理論株価カード群
カード種別:
- PER Valuation
- PBR Valuation
- Residual Income
- Simplified DCF
- Relative Valuation

各カードの共通表示項目:
- method name
- fair value
- current price
- difference
- upside / downside %
- judgement
- status
- details toggle

details toggle の展開内容:
- inputs
- assumptions

### 4.5 現在未実装で MVP+ 扱いの画面要素
- 基本指標カード群
- 専用の calculation detail panel
- recent search list
- locale switcher

## 5. エラー / 空状態 / unavailable

### 5.1 検索失敗
- search area に notice を表示する
- 既に表示中の成功済み detail view はできるだけ維持する

### 5.2 quote 取得失敗
- search area に error notice を表示する
- 直前の成功済み表示がある場合は即座に消さない

### 5.3 chart 取得失敗
- chart data 未取得時は chart panel 自体を error state にする
- 直前の成功済み chart がある場合は保持し、その上に retry notice を表示する

### 5.4 valuation 取得失敗
- valuations 未取得時は valuation panel 自体を error state にする
- 直前の成功済み valuations がある場合は保持し、その上に retry notice を表示する

### 5.5 valuation method unavailable
- 対象カードのみ unavailable 表示にする
- reason を 1 行で示す
- 他手法カードは継続表示する

## 6. レスポンシブ方針
- MVP はデスクトップ最適化を優先
- 幅が縮むと 2 カラムから 1 カラムへ落ちる
- ただし mobile 専用最適化は行わない

## 7. デザインキーワード
- clean
- calm
- polished
- readable
- spacious
- modern finance SaaS

## 8. localization 表示方針
現状:
- fixed labels は English
- error copy も English
- judgement labels も English
- date / number / currency formatting は `en-US`

MVP+:
- 日本語 / 英語の fixed labels
- 日本語 / 英語の error messages
- 日本語 / 英語の judgement labels
- locale-aware な date / number / currency formatting
