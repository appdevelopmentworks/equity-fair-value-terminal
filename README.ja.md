# equity-fair-value-terminal

English README: [README.md](C:/Users/hartm/Desktop/equity-fair-value-terminal/README.md)

Tauri 2、Next.js 16、TypeScript、Tailwind CSS、Python sidecar で構成された、Windows 向けのデスクトップ株価評価アプリです。

## 現在の RC MVP
- ティッカー入力を主軸にした検索
- 会社名オートコンプリート
- 英語 / 日本語 UI
- `yfinance` を使った日本株 / 米国株のリアルタイム株価表示
- `7203` や `6758` のような東証 4 桁コード入力を `.T` 付きへ自動正規化
- `1M / 3M / 6M / 1Y / 5Y / MAX` のローソク足チャート
- 出来高と `MA25 / MA75 / MA200`
- `PER`、`PBR`、`Residual Income`、`Simplified DCF`、`Relative Valuation`、`DDM`、`EV/EBITDA Relative`
- section 単位 / method 単位の `ok / unavailable / error` ハンドリング
- ダークモード対応の desktop-first レイアウト

## ローカルセットアップ
`C:\Users\hartm\Desktop\equity-fair-value-terminal` で PowerShell を開いて実行します。

1. JavaScript 依存関係をインストール
```powershell
cmd.exe /c npm.cmd install --cache .npm-cache
```

2. `uv` で repo ローカルの Python 環境を準備
```powershell
$env:UV_CACHE_DIR = (Join-Path (Get-Location) '.uv-cache')
$env:UV_PYTHON_INSTALL_DIR = (Join-Path (Get-Location) '.uv-python')
uv.exe python install 3.12
$python = Get-ChildItem .\.uv-python -Recurse -Filter python.exe | Select-Object -First 1 -ExpandProperty FullName
uv.exe sync --project python-sidecar --python $python
```

3. Windows 配布ビルド用の Python packaging 依存関係を追加
```powershell
$env:UV_CACHE_DIR = (Join-Path (Get-Location) '.uv-cache')
uv.exe pip install --python python-sidecar\.venv\Scripts\python.exe -r python-sidecar\requirements.txt
```

4. 任意の sidecar スモークテスト
```powershell
python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py AAPL
python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py 7203
python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py 6758
python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py chart 7203 1Y
python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py valuations-only 7203
python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py search apple
python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py search toyota
python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py search トヨタ
```

## 開発実行
```powershell
cmd.exe /c npm.cmd run tauri:dev
```

Windows のアプリ制御で `target\debug\equity-fair-value-terminal.exe` がブロックされる場合は、一時ディレクトリに Cargo target を逃がして再実行します。

```powershell
$target = 'C:\Users\hartm\AppData\Local\Temp\eqfv-cargo-target'
[void](New-Item -ItemType Directory -Force $target)
$env:CARGO_TARGET_DIR = $target
cmd.exe /c npm.cmd run tauri:dev
```

Tauri の dev 設定では、frontend dev server 起動前に `CARGO_TARGET_DIR` をクリアしています。ただし、この管理下 Windows 環境では `next dev` 自体が `spawn EPERM` で失敗するため、デスクトップ開発には制約の少ない端末が必要な場合があります。

## 検索メモ
- ティッカー入力が主フローです
- `yfinance` が解決できる場合は会社名候補が表示されます
- 日本語会社名検索は英語会社名検索より provider 依存が強めです
- 候補を選んでも、直接ティッカーを入力しても、同じ quote / chart / valuation フローに入ります
- ティッカー入力中に `Enter` を押すと direct ticker flow を優先します
- `7203` や `6758` のような東証 4 桁コードも入力できます

## フロントエンド本番ビルド
```powershell
cmd.exe /c npm.cmd run build --workspace frontend
```

## Windows 配布準備
配布ビルドでは、Python sidecar を exe 化して `src-tauri/sidecars/eqfv-python-sidecar.exe` に配置したうえで `tauri build` を実行します。

`npm run build` は次をまとめて実行します。
1. frontend の静的ビルド
2. packaged Python sidecar のビルド
3. `src-tauri/sidecars` へのコピー
4. `tauri build`

release 時に sidecar が不足していると、`src-tauri/build.rs` が早い段階で明確なエラーを返します。

## Windows 配布ビルド
```powershell
cmd.exe /c npm.cmd run build
```

想定される NSIS インストーラー出力先:

```text
src-tauri/target/release/bundle/nsis/
```

一部の管理下 Windows 環境では、Rust コンパイル時の Cargo build script や procedural macro DLL の読み込みがポリシーでブロックされることがあります。その場合は、通常の Rust / Tauri ビルドが許可された Windows 環境で release build を実行してください。

また、管理下 Windows 環境では `cmd.exe /c npm.cmd run dev --workspace frontend` や `cmd.exe /c npm.cmd run tauri:dev` が `spawn EPERM` で失敗する場合があります。

release checklist:
- [docs/13-release-readiness-checklist.md](C:/Users/hartm/Desktop/equity-fair-value-terminal/docs/13-release-readiness-checklist.md)

## この環境で確認済み
- `cmd.exe /c .\node_modules\.bin\tsc.cmd -p frontend\tsconfig.json --noEmit`
- `cmd.exe /c npm.cmd run build --workspace frontend`
- `cmd.exe /c npm.cmd run sidecar:build`
- `cmd.exe /c npm.cmd run build` は frontend export と sidecar packaging の完了後、Rust コンパイル段階まで進む
- `python-sidecar\.venv\Scripts\python.exe -m compileall python-sidecar\src`
- `python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py AAPL`
- `python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py 7203`
- `python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py 6758`
- `python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py chart 7203 1Y`
- `python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py valuations-only BRK-B`
- `python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py search apple`

この管理下 Windows 環境では、以下はポリシー制約のため失敗します。
- `cargo check`
- `npm run build` の最終 Rust コンパイル段階
- `cmd.exe /c npm.cmd run dev --workspace frontend`
- `cmd.exe /c npm.cmd run tauri:dev`

## 出荷前の最終確認
- packaged sidecar と installer に正しく含まれているか確認
- packaged build で英語 / 日本語 UI を確認
- 明るいテーマ / ダークモードを一般的なウィンドウサイズで確認
- オフライン時や provider 一時障害時の search / chart / valuation の挙動を最終確認
