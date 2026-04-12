# cursor-consumption (`ccm`)

Cursor AI エディタのトークン消費量とコストを追跡・分析するCLIツール。

## 必要環境

- Node.js >= 20
- pnpm
- PostgreSQL

## セットアップ

```bash
# 依存パッケージのインストール
pnpm install

# 環境変数の設定
cp .env.example .env
# DATABASE_URL を PostgreSQL の接続先に編集

# DBマイグレーション & Prisma Client生成
npx prisma generate
npx prisma migrate dev

# ビルド
pnpm build
```

## 使い方

### データ同期

Cursor APIから使用量データを取得してDBに保存:

```bash
ccm sync
```

認証トークンは以下の順で自動解決されます:

1. Cursorローカル DB (`state.vscdb`)
2. 環境変数 `CURSOR_SESSION_TOKEN`

### 使用状況の確認

```bash
# 今月の使用サマリー
ccm status

# 日別の使用履歴 (デフォルト: 7日間)
ccm history
ccm history --days 30
ccm history --model gpt-4o
ccm history --format json   # json / csv / table

# モデル別の使用内訳 (デフォルト: 30日間)
ccm models
ccm models --days 7
```

### 設定管理

```bash
ccm config set plan_type Pro
ccm config set plan_amount_cents 2000
ccm config get plan_type
ccm config list
```

## 開発

```bash
pnpm build          # 全パッケージビルド
pnpm test           # テスト実行 (Vitest)
pnpm --filter cli dev   # CLI開発モード
```

## プロジェクト構成

```
packages/
  core/   — 共通ロジック (認証、API、コスト計算、DB)
  cli/    — CLIアプリケーション (ccm コマンド)
  web/    — Webダッシュボード (Phase 2)
prisma/   — Prisma スキーマ & マイグレーション
pricing/  — モデル別料金テーブル (models.json)
```

## ライセンス

Private
