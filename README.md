# cursor-consumption

Cursor AI エディタのトークン消費量とコストを追跡・分析するツール。

Cursor の Hooks 機能でイベントを捕捉し、Next.js の Web ダッシュボードで可視化します。

## 必要環境

- Node.js >= 20
- pnpm
- Docker (PostgreSQL用)

## セットアップ

```bash
# 依存パッケージのインストール
pnpm install

# 環境変数の設定
cp .env.example .env

# PostgreSQL起動
docker compose up -d

# DBマイグレーション & Prisma Client生成
npx prisma generate
npx prisma migrate dev

# ビルド
pnpm build
```

## プロジェクト構成

```
（リポジトリルート）— Webダッシュボード (Next.js, src/)
packages/
  core/   — 共通ロジック (コスト計算、DB)
prisma/   — Prisma スキーマ & マイグレーション
pricing/  — モデル別料金テーブル (models.json)
```

## ライセンス

Private
