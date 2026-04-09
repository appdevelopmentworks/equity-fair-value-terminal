# Requirements

## 1. 文書の目的
本書は `equity-fair-value-terminal` の現在の MVP 実装状態と、次段階で扱う拡張要求を整理したものである。

以後の実装では、まず「現行 MVP を壊さずに保守・拡張する」ことを前提とする。

## 2. プロダクトの目的
ユーザーがティッカーまたは銘柄名を入力すると、対象銘柄について以下を 1 画面で確認できるようにする。
- 現在株価
- ローソク足チャート
- 手法別の理論株価
- 割安 / 妥当 / 割高の判定
- 算出不可理由または一時的エラー理由

## 3. 対象市場
- 日本株
- 米国株
- yfinance で価格・財務情報の取得が可能な銘柄

## 4. 現在の MVP 要求

### 4.1 検索
- ティッカー直接入力をサポートする
- 銘柄名オートコンプリート検索をサポートする
- 候補一覧を dropdown で表示する
- 候補選択は direct ticker search と同じ detail flow に入る
- 入力が空の場合はガイダンスを表示する
- 検索中の重複リクエストは抑制または安全に扱う

注記:
- 英語の company-name search が主系統である
- 日本語 company-name search は provider が解決できる範囲で best-effort とする

### 4.2 株価表示
- 現在株価
- 前日比金額
- 前日比率
- 通貨
- 取引市場
- 最終更新情報（取得時刻）

### 4.3 チャート表示
- ローソク足
- 出来高
- 25日 / 75日 / 200日移動平均
- 期間切替
  - `1M`
  - `3M`
  - `6M`
  - `1Y`
  - `5Y`
  - `MAX`

### 4.4 理論株価表示
手法ごとに以下を表示する。
- 手法名
- 理論株価
- 現在株価との差額
- 上昇余地 / 下落余地 %
- 判定
- ステータス
- 開閉可能な inputs / assumptions

対象手法:
- PER法
- PBR法
- 残余利益法
- 簡易DCF
- 相対評価法

### 4.5 エラー / unavailable / partial success
- ティッカー不正時は検索エリアで明確に案内する
- chart だけ失敗した場合でも quote と valuations は保持する
- valuations だけ失敗した場合でも quote と chart は保持する
- valuation method 単位の `unavailable` と `error` を分ける
- raw exception text は UI に出さない

### 4.6 UI / UX
- デスクトップ最適化を優先する
- calm / polished / readable / spacious を維持する
- dark mode をサポートする
- 長い company name や複数通貨でも layout を崩さない

## 5. MVP+ 要求
MVP+ は「現在の MVP を維持したまま段階追加する」対象である。

### 5.1 bilingual UI support
対象:
- 固定 UI ラベル
- エラーメッセージ
- valuation judgement labels
- date formatting
- number formatting
- currency formatting

方針:
- locale ごとの辞書と formatter を frontend 側に集約する
- sidecar / Rust の error code や enum は locale-neutral を保つ
- 日本語 / 英語の 2 locale を first target とする

### 5.2 追加の情報表示
- 基本指標カード群
- 専用の calculation detail panel
- peer selection の透明性向上

### 5.3 valuation card review
- DDM の feasibility review
- EV/EBITDA ベース相対評価の feasibility review
- 実装可否は yfinance 入手性と unavailable 率を見て判断する

## 6. Future Scope
- watchlist
- favorite
- 前提条件のユーザー編集
- 総合理論株価
- macOS 配布
- シナリオ別 DCF

## 7. 技術要件

### 7.1 全体構成
- Desktop shell: Tauri 2
- Frontend: Next.js 16 / TypeScript / App Router
- UI: Tailwind CSS / shadcn/ui
- Python sidecar: yfinance / valuation engine
- Rust: sidecar bridge / process control / error relay

### 7.2 データ取得方針
- 価格データ、配当、基本財務、株式数などは yfinance から取得する
- 市場ごとのデータ欠損・項目差異は許容する
- 取得できない項目を無理に推定して埋めない
- 計算不能な手法は `unavailable` として返す

## 8. UI / UX 要件

### 8.1 デザイン方針
- 余白多め
- 高級感よりも可読性を優先
- 情報過密な金融端末風にはしない
- calm / modern finance SaaS の印象を保つ

### 8.2 操作性
- 初見でも「どこに入力するか」がすぐ分かる
- 検索から詳細表示までの導線を短くする
- unavailable と system error を混同させない
- loading / empty / error / partial-failure を明確に描き分ける

### 8.3 ローカライズ方針
現状:
- UI copy は English 固定
- formatter も `en-US` を使用

次段階:
- fixed copy / error copy / judgement label / formatter を locale 切替可能にする
- valuation の計算結果そのものは locale に依存させない

## 9. 非機能要求

### 9.1 パフォーマンス
- 再検索時の体感速度を重視する
- 検索候補取得は軽量に行う
- 財務データ取得は section 単位の loading を許容する

### 9.2 保守性
- フロントと計算ロジックを分離する
- valuation ロジックは Python 側に集約する
- Rust 側は中継役に徹する
- locale 切替を入れても data contract を変えない構造にする

### 9.3 配布性
- Windows 用インストーラーを優先する
- 利用者に Python の別途導入を要求しない
- sidecar は配布可能な実行物として同梱する

## 10. 制約
- Next.js 単体では yfinance を直接利用しない
- Next.js の常時サーバー機能に依存しない
- 初期版はデスクトップ最適化優先で、モバイルはスコープ外
- 高精度 DCF に必要な外部金利データや ERP は MVP 範囲外

## 11. 現在の完了条件
以下を満たした状態を「現行 MVP 実装済み」とみなす。
- 検索から銘柄詳細表示まで一連の操作ができる
- ローソク足と理論株価カード群が安定表示される
- 主要な error case で壊れずに画面が成立する
- Windows desktop app として dev / build 前提の構成が整っている
