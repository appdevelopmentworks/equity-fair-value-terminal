# Build and Distribution Specification

## 1. 目的
本書は `equity-fair-value-terminal` を Windows 向け実行体として build / distribute するための前提と現状を定義する。

## 2. 配布対象
- 現在対象: Windows
- 将来拡張: macOS
- Linux は current scope 外

## 3. 構成要素
- `frontend/` : Next.js 16
- `src-tauri/` : Tauri 2 / Rust
- `python-sidecar/` : Python worker
- `docs/` : 要件・設計・運用ドキュメント

## 4. 現在の build 方針

### 4.1 frontend
- Next.js は静的出力前提
- Tauri 内で常時 Node サーバーを立てない
- 生成物を Tauri の `frontendDist` に組み込む

### 4.2 Python sidecar
- 開発時は `.venv/Scripts/python.exe + src/main.py` を使う
- 配布時は実行物化して bundled sidecar とする
- Tauri 側から subprocess として呼び出す

### 4.3 Tauri / Rust
- frontend と native の橋渡し
- sidecar 起動
- error normalization
- dev / packaged で sidecar 解決先を切り替える

## 5. 現在の sidecar bridge コマンド
- `fetch_quote`
- `fetch_chart`
- `search_symbols`
- `fetch_valuations`

sidecar 側 subcommand:
- `quote`
- `chart`
- `search`
- `valuations-only`

## 6. 現在の配布状態
コードベース上は Windows desktop app としての構成が整っている。

ただし release engineering 観点では、以下は別途最終確認が必要:
- packaged Python sidecar の最終 bundle
- Windows installer の作成と実機確認
- 別環境での first-run smoke test

## 7. 想定 build 手順
1. frontend 依存を install
2. frontend build / export
3. python-sidecar の依存を install
4. python-sidecar を実行物化
5. Tauri build
6. Windows installer 生成
7. 実機 smoke test

## 8. 開発環境
- Node.js
- Rust toolchain
- Python
- Tauri CLI
- Windows build environment

## 9. 配布前チェック
- 初回起動成功
- sidecar 起動成功
- ticker search 成功
- company-name autocomplete 表示確認
- 日本株・米国株の代表銘柄で表示確認
- ローソク足描画確認
- valuation unavailable パターン確認
- dark mode 表示確認
- installer からの正常起動確認

## 10. bilingual UI 追加時の build 影響
bilingual UI support は主に frontend の責務とする。

影響範囲:
- locale dictionary の同梱
- formatter の locale 切替
- packaged build での resource 同梱確認

非影響を維持したい範囲:
- sidecar contract
- Rust bridge command
- error code の安定性

## 11. リスクと対策

### 11.1 Python sidecar サイズ増大
対策:
- 必要最小限の依存に絞る
- 追加 valuation method は feasibility を先に確認する

### 11.2 市場データ欠損
対策:
- 取得できた情報だけ表示する
- 手法ごとに unavailable を許容する

### 11.3 yfinance 依存リスク
対策:
- access layer を Python 側に閉じ込める
- locale 対応や UI 改修と分離する

## 12. リリース戦略
- まず current MVP を Windows 向けに安定化
- その後 bilingual UI を追加
- 追加 valuation cards は yfinance feasibility review 後に段階的導入
