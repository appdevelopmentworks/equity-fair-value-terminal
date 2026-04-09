# equity-fair-value-terminal

English README: [README.md](C:/Users/hartm/Desktop/equity-fair-value-terminal/README.md)

Tauri 2、Next.js 16、TypeScript、Tailwind CSS、Python sidecar で構成された Windows 向けデスクトップ株価評価アプリです。

## 現在の RC MVP
- ティッカー中心の検索フローと会社名オートコンプリート
- 英語 / 日本語 UI
- `yfinance` を使った日本株・米国株のリアルタイム株価取得
- `7203` や `6758` のような東証 4 桁コード入力を `.T` 付きティッカーへ自動正規化
- `1M / 3M / 6M / 1Y / 5Y / MAX` のローソク足チャート
- 出来高と `MA25 / MA75 / MA200`
- `PER`、`PBR`、`Residual Income`、`Simplified DCF`、`Relative Valuation`、`DDM`、`EV/EBITDA Relative`
- セクション単位 / 手法単位の `ok / unavailable / error`
- ダークモードと desktop-first レイアウト

## ローカルセットアップ
`C:\Users\hartm\Desktop\equity-fair-value-terminal` で PowerShell を開いて実行してください。

1. JavaScript 依存関係をインストール
```powershell
cmd.exe /c npm.cmd install --cache .npm-cache
```

2. `uv` でローカル Python 環境を準備
```powershell
$env:UV_CACHE_DIR = (Join-Path (Get-Location) '.uv-cache')
$env:UV_PYTHON_INSTALL_DIR = (Join-Path (Get-Location) '.uv-python')
uv.exe python install 3.12
$python = Get-ChildItem .\.uv-python -Recurse -Filter python.exe | Select-Object -First 1 -ExpandProperty FullName
uv.exe sync --project python-sidecar --python $python
```

3. 任意の sidecar スモークテスト
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

## 開発起動
```powershell
cmd.exe /c npm.cmd run tauri:dev
```

Windows のアプリケーション制御で `target\debug\equity-fair-value-terminal.exe` がブロックされる場合は、Cargo の出力先を一時ディレクトリへ変更して再実行してください。
```powershell
$target = 'C:\Users\hartm\AppData\Local\Temp\eqfv-cargo-target'
[void](New-Item -ItemType Directory -Force $target)
$env:CARGO_TARGET_DIR = $target
cmd.exe /c npm.cmd run tauri:dev
```

## 検索まわりの補足
- ティッカー入力が主フローです
- 会社名候補は `yfinance` が解決できる場合に表示されます
- 会社名検索は英語のほうが日本語より安定しています
- 候補を選んだ場合も、ティッカー直入力と同じ quote / chart / valuation フローを開きます
- ティッカー入力中に `Enter` を押すと、候補表示中でも direct ticker flow を優先します
- `7203` や `6758` のような東証 4 桁コードは `7203.T` / `6758.T` に自動変換して処理します

## フロントエンド本番ビルド
```powershell
cmd.exe /c npm.cmd run build --workspace frontend
```

## この環境で確認済み
- `cmd.exe /c .\node_modules\.bin\tsc.cmd -p frontend\tsconfig.json --noEmit`
- `cmd.exe /c npm.cmd run build --workspace frontend`
- `python-sidecar\.venv\Scripts\python.exe -m compileall python-sidecar\src`
- `python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py AAPL`
- `python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py 7203`
- `python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py 6758`
- `python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py chart 7203 1Y`
- `python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py valuations-only 7203`
- `cargo check`

## リリース前の最終確認
- packaged sidecar と Windows installer の確認
- packaged build で英語 / 日本語 UI の両方を確認
- ライト / ダーク両テーマで一般的なデスクトップ幅を確認
- オフライン時や provider 一時障害時の検索 / チャート / valuation 表示を確認
