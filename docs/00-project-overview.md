# Project Overview

## プロジェクト名
`equity-fair-value-terminal`

## 概要
`equity-fair-value-terminal` は、日本株・米国株を対象に、現在株価・ローソク足チャート・手法別理論株価を 1 画面で確認できる Windows 向けデスクトップアプリである。

Tauri 2 をデスクトップシェルとし、Next.js 16 で UI を構築し、Python sidecar で yfinance 取得と valuation 計算を行う。

## 現在の実装状態
現行コードベースでは、Phase 5 までの MVP 実装が完了している。

現在実装済みの主な内容:
- ティッカー検索
- 銘柄名オートコンプリート検索
- 現在株価表示
- ローソク足チャート
- 出来高
- 25 / 75 / 200 移動平均
- PER / PBR / 残余利益法 / 簡易DCF / 相対評価法
- 手法ごとの `ok / unavailable / error`
- ダークモード
- セクション単位の loading / empty / error / partial-failure 表示

## 現在の制約
- UI 文言は現状 English 固定
- 日付 / 数値 / 通貨フォーマットは `en-US` ベース
- 日本語の銘柄名検索は yfinance provider 依存で best-effort
- 基本指標カード群は未実装
- 専用の「計算根拠パネル」は未実装
- packaged sidecar / installer の最終検証は release engineering 側の残タスク

## 現在の画面構成
現行実装は単一ページ構成で、上から順に以下を表示する。
1. アプリヘッダー
2. 検索カード
3. 株価サマリーカード
4. ローソク足チャートパネル
5. 理論株価カード群

## スコープ階層

### 現在の MVP
- 検索から詳細表示まで迷わない導線
- quote / chart / valuation を分離した安定表示
- 一部取得失敗時でも、取得済みデータをできるだけ維持する UI

### MVP+
- bilingual UI support
- 固定 UI ラベルの日本語 / 英語切替
- エラーメッセージの日本語 / 英語切替
- valuation judgement label の日本語 / 英語切替
- 日付 / 数値 / 通貨フォーマットの locale 対応
- 基本指標カード群
- DDM / EV/EBITDA の feasibility review と追加判断

### Future
- watchlist
- favorite
- 前提値の手動編集
- 総合理論株価
- macOS 配布

## ドキュメント同期の基本方針
この `/docs` は、現行実装の事実を優先して更新する。

特に以下は「実装済み」と「計画中」を明確に分ける。
- 現在表示している画面要素
- sidecar の実コマンド
- error handling の現在挙動
- valuation cards の実装済み手法
- bilingual UI / 追加 valuation cards の次段階スコープ
