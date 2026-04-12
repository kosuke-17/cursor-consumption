# Cursor Token消費量トラッキングツール - システム設計書

## 1. アーキテクチャ概要

### 1.1 全体構成

```
┌─────────────────────────────────────────────────────────┐
│                      ユーザー                             │
│                         │                                │
│            ┌────────────┴────────────┐                   │
│            ▼                         ▼                   │
│   ┌──────────────┐         ┌──────────────────┐         │
│   │   CLI Tool    │         │  Web Dashboard   │         │
│   │  (Phase 1)    │         │   (Phase 2)      │         │
│   └──────┬───────┘         └────────┬─────────┘         │
│          │                          │                    │
│          └──────────┬───────────────┘                    │
│                     ▼                                    │
│          ┌─────────────────────┐                         │
│          │    Core Library     │                         │
│          │ (共通ビジネスロジック)  │                         │
│          └──┬─────┬─────┬─────┘                         │
│             │     │     │                                │
│             ▼     ▼     ▼                                │
│    ┌────────┐ ┌──────┐ ┌──────────┐                     │
│    │Token   │ │Cursor│ │ Storage     │                  │
│    │Resolver│ │API   │ │ (PostgreSQL)│                  │
│    │        │ │Client│ │             │                  │
│    └───┬────┘ └──┬───┘ └─────────────┘                  │
│        │         │                                       │
│        ▼         ▼                                       │
│  ┌──────────┐  ┌────────────────┐                       │
│  │Cursor    │  │api2.cursor.sh  │                       │
│  │Local DB  │  │(内部API)        │                       │
│  │(state.   │  │                │                       │
│  │ vscdb)   │  │api.cursor.com  │                       │
│  └──────────┘  │(Admin API)     │                       │
│                └────────────────┘                        │
└─────────────────────────────────────────────────────────┘
```

### 1.2 設計方針

- **PostgreSQLバックエンド**: 使用量データはローカルPostgreSQLに永続化
- **モノレポ構成**: CLI・Webダッシュボード・共通ライブラリを1リポジトリで管理
- **段階的構築**: Phase 1（CLI）→ Phase 2（Web）→ Phase 3（拡張）
- **差し替え可能なデータソース**: 認証方法やAPI変更に耐えられる抽象化

---

## 2. 技術スタック

| レイヤー | 技術 | 選定理由 |
|---------|------|---------|
| 言語 | TypeScript (strict mode) | Cursor/VS Codeエコシステムとの親和性、型安全性 |
| ランタイム | Node.js 20 LTS | 安定性、long-term support |
| CLI フレームワーク | commander + inquirer | 軽量、十分な機能 |
| Web フレームワーク | Next.js (App Router) | フルスタック、APIルート内蔵 |
| UIコンポーネント | shadcn/ui + Tailwind CSS | 軽量、高カスタマイズ |
| チャートライブラリ | Recharts | React統合、豊富なグラフ種類 |
| DB | PostgreSQL + Prisma | 堅牢なRDB、型安全なORM、マイグレーション管理 |
| SQLiteリーダー(Cursor DB用) | sql.js | Pure JS実装、Cursorのstate.vscdb読み取り専用 |
| パッケージマネージャ | pnpm | ワークスペース対応、ディスク効率 |
| モノレポツール | pnpm workspaces + turborepo | ビルド効率、タスク並列実行 |
| テスト | Vitest | 高速、TypeScript native |
| リンター | ESLint + Prettier | 標準的 |

---

## 3. ディレクトリ構成

```
cursor-consumption/
├── packages/
│   ├── core/                     # 共通ビジネスロジック
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   │   ├── token-resolver.ts       # セッショントークン取得の抽象化
│   │   │   │   ├── sqlite-token-reader.ts  # ローカルSQLiteからトークン取得
│   │   │   │   └── manual-token-input.ts   # 手動入力フォールバック
│   │   │   ├── api/
│   │   │   │   ├── cursor-api-client.ts    # Cursor内部API呼び出し
│   │   │   │   ├── admin-api-client.ts     # Enterprise Admin API
│   │   │   │   └── types.ts               # APIレスポンス型定義
│   │   │   ├── pricing/
│   │   │   │   ├── cost-calculator.ts      # コスト計算エンジン
│   │   │   │   └── pricing-table.ts        # モデル別料金テーブル
│   │   │   ├── storage/
│   │   │   │   ├── prisma.ts               # Prisma Client初期化
│   │   │   │   └── queries.ts              # クエリ定義
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── cli/                      # CLIアプリケーション
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── status.ts              # 現在の使用量表示
│   │   │   │   ├── history.ts             # 履歴表示
│   │   │   │   ├── sync.ts               # データ同期
│   │   │   │   └── config.ts             # 設定管理
│   │   │   ├── formatters/
│   │   │   │   ├── table.ts              # テーブル表示
│   │   │   │   └── chart.ts              # ターミナルグラフ
│   │   │   └── index.ts                  # CLIエントリポイント
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                      # Webダッシュボード (Phase 2)
│       ├── src/
│       │   └── app/
│       │       ├── page.tsx              # ダッシュボードトップ
│       │       ├── models/page.tsx       # モデル別分析
│       │       ├── history/page.tsx      # 履歴・トレンド
│       │       ├── api/
│       │       │   ├── usage/route.ts    # 使用量データAPI
│       │       │   └── sync/route.ts     # 同期トリガーAPI
│       │       └── components/
│       │           ├── usage-summary.tsx
│       │           ├── model-breakdown.tsx
│       │           ├── cost-chart.tsx
│       │           └── trend-graph.tsx
│       ├── package.json
│       └── tsconfig.json
│
├── prisma/
│   ├── schema.prisma             # Prismaスキーマ定義
│   └── migrations/               # DBマイグレーション（自動生成）
├── pricing/
│   └── models.json               # モデル別料金テーブル（外部更新可能）
├── docs/
│   ├── requirements.md
│   └── system-design.md
├── package.json                  # ルートpackage.json (pnpm workspaces)
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── CLAUDE.md
└── .gitignore
```

---

## 4. コンポーネント設計

### 4.1 Token Resolver（認証トークン取得）

セッショントークンの取得を抽象化し、取得方法の変更に耐えられる設計にする。

```typescript
// packages/core/src/auth/token-resolver.ts

interface TokenResolver {
  resolve(): Promise<string | null>;
  readonly name: string;
}

// 優先度順に試行するChain of Responsibilityパターン
class TokenResolverChain {
  private resolvers: TokenResolver[];

  async resolve(): Promise<string> {
    for (const resolver of this.resolvers) {
      const token = await resolver.resolve();
      if (token) return token;
    }
    throw new Error("No valid session token found");
  }
}
```

**実装する Resolver:**
1. `SqliteTokenReader` — `state.vscdb` から `WorkosCursorSessionToken` を読み取り（sql.js使用）
2. `EnvTokenReader` — 環境変数 `CURSOR_SESSION_TOKEN` から取得
3. `ManualTokenInput` — ユーザーにインタラクティブに入力を求める

**Cursorローカルデータベースのパス:**
| OS | パス |
|----|------|
| macOS | `~/Library/Application Support/Cursor/User/globalStorage/state.vscdb` |
| Windows | `%APPDATA%\Cursor\User\globalStorage\state.vscdb` |
| Linux | `~/.config/Cursor/User/globalStorage/state.vscdb` |

### 4.2 Cursor API Client

Cursorの内部APIおよびAdmin APIとの通信を担当。

```typescript
// packages/core/src/api/cursor-api-client.ts

interface UsageData {
  items: UsageItem[];
  totalSpendCents: number;
  billingPeriod: { start: Date; end: Date };
}

interface UsageItem {
  timestamp: Date;
  model: string;
  feature: string;            // "chat" | "agent" | "composer" | "tab" | "ask"
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  chargedCents: number | null; // APIが返す場合
  calculatedCostCents: number; // ローカル計算値
}

class CursorApiClient {
  constructor(private token: string) {}

  async getUsage(startDate: Date, endDate: Date): Promise<UsageData>;
  async getAccountInfo(): Promise<AccountInfo>;
}
```

**API呼び出し時の考慮事項:**
- レート制限への対応（Exponential Backoff）
- APIレスポンスのスキーマバリデーション（zod使用）
- トークン失効時の再取得フロー

### 4.3 Cost Calculator

モデル別・トークン種別のコスト計算エンジン。

```typescript
// packages/core/src/pricing/cost-calculator.ts

interface PricingEntry {
  model: string;
  inputPer1M: number;
  outputPer1M: number;
  cacheReadPer1M: number;
  cacheWritePer1M: number;
}

class CostCalculator {
  constructor(private pricingTable: PricingEntry[]) {}

  calculate(item: UsageItem): number {
    // chargedCentsがあればそれを優先
    if (item.chargedCents !== null) return item.chargedCents;

    // なければローカル計算
    const pricing = this.pricingTable.find(p => p.model === item.model);
    if (!pricing) return 0;

    return (
      (item.inputTokens * pricing.inputPer1M +
       item.outputTokens * pricing.outputPer1M +
       item.cacheReadTokens * pricing.cacheReadPer1M +
       item.cacheWriteTokens * pricing.cacheWritePer1M) / 1_000_000
    );
  }
}
```

**料金テーブルの管理:**
- `pricing/models.json` に外部ファイルとして定義
- Cursorの料金変更時はこのファイルを更新するだけで対応可能
- 将来的にはLiteLLMやCursor公式ドキュメントからの自動更新も検討

### 4.4 Storage（PostgreSQL）

履歴データの蓄積を担当。PrismaをORMとして使用し、��安全なクエリとマイグレーション管理を行う。

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model UsageEvent {
  id                  Int      @id @default(autoincrement())
  timestamp           DateTime
  model               String
  feature             String   // chat, agent, composer, tab, ask
  inputTokens         Int      @default(0)
  outputTokens        Int      @default(0)
  cacheReadTokens     Int      @default(0)
  cacheWriteTokens    Int      @default(0)
  chargedCents        Float?   // APIから取得（nullable）
  calculatedCostCents Float    // ローカル計算値
  rawResponse         Json?    // APIレスポンスJSON（デバッグ用）
  syncedAt            DateTime

  @@index([timestamp])
  @@index([model])
  @@index([timestamp, model])
  @@map("usage_events")
}

model SyncLog {
  id           Int      @id @default(autoincrement())
  syncedAt     DateTime
  status       String   // success, error
  eventsCount  Int      @default(0)
  errorMessage String?

  @@map("sync_log")
}

model DailySummary {
  date             DateTime @db.Date
  model            String
  feature          String
  totalInputTokens  Int      @default(0)
  totalOutputTokens Int      @default(0)
  totalCostCents    Float    @default(0)
  requestCount      Int      @default(0)

  @@id([date, model, feature])
  @@index([date])
  @@map("daily_summary")
}

model Config {
  key   String @id
  value String

  @@map("config")
}
```

**接続設定:**

環境変数 `DATABASE_URL` で接続先を指定する。

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/cursor_consumption"
```

**マイグレーション管理:**
```bash
npx prisma migrate dev    # 開発環境でマイグレーション作成・適用
npx prisma migrate deploy # 本番環境でマイグレーション適用
npx prisma generate       # Prisma Client再生成
```

---

## 5. CLI設計

### 5.1 コマンド体系

```
cursor-consumption (ccm)
├── status              # 現在の使用量サマリーを表示
├── sync                # 最新データをCursor APIから取得・保存
├── history             # 履歴データの表示
│   ├── --days <n>      # 過去n日分
│   ├── --model <name>  # モデルフィルタ
│   └── --format <fmt>  # table | json | csv
├── models              # モデル別使用量ブレイクダウン
├── config              # 設定管理
│   ├── set <key> <val>
│   ├── get <key>
│   └── list
└── dashboard           # Webダッシュボードを起動 (Phase 2)
```

### 5.2 出力例

```
$ ccm status

  Cursor Usage - April 2026
  ─────────────────────────────────────────
  Plan: Pro ($20/mo)
  Billing Period: Apr 1 - Apr 30
  Days Remaining: 18

  Credits Used:    $12.47 / $20.00  [████████████░░░░░░] 62%
  Requests Today:  43

  Top Models (Today):
  ┌──────────────────────┬────────┬──────────┬─────────┐
  │ Model                │ Reqs   │ Tokens   │ Cost    │
  ├──────────────────────┼────────┼──────────┼─────────┤
  │ claude-sonnet-4.5    │ 28     │ 142.3K   │ $1.84   │
  │ gpt-4o               │ 12     │ 89.1K    │ $0.67   │
  │ cursor-small         │ 3      │ 12.0K    │ $0.02   │
  └──────────────────────┴────────┴──────────┴─────────┘

  ⚠ Projected month-end spend: $23.40 (exceeds plan by $3.40)
```

---

## 6. Webダッシュボード設計（Phase 2）

### 6.1 ページ構成

| パス | 内容 |
|------|------|
| `/` | ダッシュボードトップ（サマリー、当日使用量、プログレスバー） |
| `/models` | モデル別使用量・コスト分析 |
| `/history` | 日別・週別・月別トレンドグラフ |
| `/settings` | 設定（ポーリング間隔、アラート閾値、トークン管理） |

### 6.2 ダッシュボードトップ

```
┌─────────────────────────────────────────────────────────┐
│  [消費額]     [残りクレジット]    [月末予測]     [残り日数]   │
│  $12.47       $7.53            $23.40        18 days    │
│                                                         │
│  [プログレスバー ██████████████░░░░░░░░░ 62%]            │
├─────────────────────────────┬───────────────────────────┤
│  モデル別消費 (Pie Chart)     │  日別消費 (Bar Chart)      │
│                             │                           │
│    Claude 4.5 ██ 45%        │  ▇ ▅ ▇ █ ▃ ▅ ▇          │
│    GPT-4o     █ 30%         │  M T W T F S S           │
│    Other      ░ 25%         │                           │
├─────────────────────────────┴───────────────────────────┤
│  直近のリクエスト                                          │
│  ┌─────────┬──────────────┬────────┬────────┬─────────┐ │
│  │ 時刻     │ モデル        │ 機能    │ トークン │ コスト   │ │
│  ├─────────┼──────────────┼────────┼────────┼─────────┤ │
│  │ 14:32   │ Claude 4.5   │ Agent  │ 8,421  │ $0.12   │ │
│  │ 14:28   │ GPT-4o       │ Chat   │ 3,102  │ $0.04   │ │
│  └─────────┴──────────────┴────────┴────────┴─────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 6.3 APIルート設計

Webダッシュボードは内部APIルート経由でPostgreSQLからデータを読む（Cursor APIは直接呼ばない）。

```
GET /api/usage/summary          # 当月サマリー
GET /api/usage/daily?days=30    # 日別データ
GET /api/usage/models?days=7    # モデル別データ
GET /api/usage/events?limit=50  # 直近リクエスト一覧
POST /api/sync                  # 手動同期トリガー
GET /api/config                 # 設定取得
PUT /api/config                 # 設定更新
```

---

## 7. データフロー

### 7.1 同期フロー（定期実行）

```
[Scheduler (node-cron)]
  │ 60秒間隔（設定可能）
  ▼
[TokenResolver] ─── トークン取得 ───→ [CursorローカルSQLite]
  │
  ▼ トークン
[CursorApiClient] ─── API呼び出し ───→ [api2.cursor.sh]
  │
  ▼ UsageData
[CostCalculator] ─── コスト計算 ───→ [pricing/models.json]
  │
  ▼ UsageItem[] (コスト付き)
[Storage] ─── 保存 ───→ [PostgreSQL]
  │
  ▼ 重複排除: timestamp+modelの組み合わせで既存データをスキップ
[DailySummary] ─── 集計更新 ───→ [daily_summaryテーブル]
```

### 7.2 表示フロー

```
[CLI command / Web request]
  │
  ▼
[Storage] ─── クエリ ───→ [PostgreSQL]
  │
  ▼ クエリ結果
[Formatter (CLI) / React Component (Web)]
  │
  ▼
[ターミナル出力 / ブラウザ表示]
```

---

## 8. セキュリティ設計

### 8.1 セッショントークンの管理

```
取得: sql.jsでCursorのstate.vscdbを読み取り専用で開く
  ↓
検証: Cursor APIの軽量エンドポイントで有効性確認
  ↓
保存: OSセキュアストレージに保存
  - macOS: Keychain Access (keytar ライブラリ)
  - Windows: Windows Credential Manager
  - Linux: libsecret (GNOME Keyring / KDE Wallet)
  ↓
利用: メモリ上でのみ使用、ログ出力には含めない
```

### 8.2 データ保護

- `rawResponse` カラムにはプロンプト内容を含めない（メタデータのみ）
- `DATABASE_URL` は `.env` ファイルで管理し、リポジトリにコミットしない

---

## 9. エラーハンドリング

### 9.1 リカバリ戦略

| エラー | 戦略 |
|-------|------|
| トークン取得失敗 | Chain of Responsibilityで次のResolverを試行 → 全て失敗時はユーザーに手動入力を案内 |
| API呼び出し失敗 (401) | トークン再取得を試行 → 失敗時はトークンの再設定を案内 |
| API呼び出し失敗 (429) | Exponential Backoffで自動リトライ（最大3回） |
| API呼び出し失敗 (5xx) | 30秒後にリトライ → ユーザーにCursorサーバーの状態確認を案内 |
| APIスキーマ変更検知 | 警告ログ出力、既知のフィールドのみ処理、次回同期時に再試行 |
| DB接続失敗 | 接続リトライ（Prismaのconnection pool設定）、ユーザーにDATABASE_URL確認を案内 |
| DB書き込み失敗 | トランザクションロールバック、エラーログ出力 |

### 9.2 スキーマ変更検知

```typescript
// zodでAPIレスポンスをバリデーション
const UsageResponseSchema = z.object({
  items: z.array(z.object({
    timestamp: z.string(),
    model: z.string(),
    // ... 既知フィールド
  }).passthrough()), // 未知フィールドは保持（破棄しない）
  // ...
}).passthrough();

// パース失敗時は警告を出しつつ、部分的なデータで処理を継続
```

---

## 10. テスト戦略

| テスト種別 | 対象 | ツール |
|-----------|------|-------|
| ユニットテスト | CostCalculator, TokenResolver, クエリ関数 | Vitest |
| 統合テスト | API Client（モック）→ Storage → 読み出し | Vitest + msw + テスト用PostgreSQL |
| E2Eテスト | CLIコマンド実行→出力検証 | Vitest + execa |
| スナップショット | CLI出力フォーマット | Vitest snapshots |

---

## 11. 開発ロードマップ

### Phase 1: CLIツール MVP

| ステップ | 内容 |
|---------|------|
| 1-1 | プロジェクト初期化（モノレポ、TypeScript、ESLint、Vitest） |
| 1-2 | `packages/core` — TokenResolver実装（SQLite読み取り） |
| 1-3 | `packages/core` — CursorApiClient実装（使用量API呼び出し） |
| 1-4 | `packages/core` — CostCalculator + pricing/models.json |
| 1-5 | `packages/core` — Storage（Prisma + PostgreSQL、マイグレーション） |
| 1-6 | `packages/cli` — `ccm status` コマンド |
| 1-7 | `packages/cli` — `ccm sync` コマンド |
| 1-8 | `packages/cli` — `ccm history` / `ccm models` コマンド |
| 1-9 | テスト・ドキュメント |
| 1-10 | npmパッケージ公開 |

### Phase 2: Webダッシュボード

| ステップ | 内容 |
|---------|------|
| 2-1 | `packages/web` — Next.jsプロジェクト初期化 |
| 2-2 | APIルート実装（PostgreSQL読み出し） |
| 2-3 | ダッシュボードトップページ |
| 2-4 | モデル別分析ページ |
| 2-5 | 履歴・トレンドページ |
| 2-6 | 設定ページ |
| 2-7 | `ccm dashboard` コマンドでWebサーバー起動 |

### Phase 3: 拡張機能

| ステップ | 内容 |
|---------|------|
| 3-1 | コスト予測エンジン |
| 3-2 | デスクトップ通知（node-notifier） |
| 3-3 | Enterprise Admin API連携 |
| 3-4 | CSV/JSONエクスポート |
| 3-5 | 料金テーブル自動更新 |
