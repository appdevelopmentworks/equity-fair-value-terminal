# MVP Scope

## 1. Current MVP
以下は現行コードベースで実装済み、または現行 MVP として扱う内容である。

### 1.1 含めるもの
- Windows デスクトップアプリ構成
- ティッカー入力
- 銘柄名オートコンプリート検索
- 現在株価表示
- ローソク足チャート
- 出来高
- 25 / 75 / 200 移動平均
- PER法
- PBR法
- 残余利益法
- 簡易DCF
- 相対評価法（PER/PBR ベース）
- 算出不可表示
- 手法単位の `ok / unavailable / error`
- dark mode
- desktop-first layout
- section 単位の loading / empty / error 表示

### 1.2 明示的に current MVP へ含めないもの
- 基本指標カード群
- 専用の calculation detail panel
- bilingual UI
- DDM
- EV/EBITDA
- watchlist
- mobile 最適化
- macOS 配布

### 1.3 current MVP の注記
- UI 文言は English 固定
- formatter は `en-US`
- 日本語 company-name search は provider 依存で best-effort

## 2. MVP+
MVP+ は「現行 MVP の上に積む次段階」の範囲である。

### 2.1 bilingual UI support
対象:
- 固定 UI ラベル
- エラーメッセージ
- valuation judgement labels
- date formatting
- number formatting
- currency formatting

locale:
- Japanese
- English

### 2.2 追加の UI / 情報表示
- 基本指標カード群
- locale-aware formatting
- peer selection の説明強化

### 2.3 valuation card review
- DDM の追加可否判断
- EV/EBITDA ベース相対評価の追加可否判断

## 3. Future Scope
- watchlist
- favorite
- 前提値手動編集
- 総合理論株価
- macOS 配布
- シナリオ別 DCF

## 4. Current MVP 成功基準
- 代表的な日本株・米国株で安定動作する
- 検索から分析まで迷わない
- 計算結果または unavailable 理由が明確
- quote / chart / valuations の一部失敗で画面全体が壊れない

## 5. MVP+ 成功基準
- 日本語 / 英語の UI copy が切り替わる
- locale に応じて date / number / currency が自然に表示される
- valuation judgement labels が locale 対応する
- DDM / EV/EBITDA は feasibility review を通過したものだけ追加する
