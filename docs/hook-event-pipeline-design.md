# Hook Event → DB 保存パイプライン 設計書

## 1. 概要

Cursor Hooks で発火する全20イベントを PostgreSQL に保存するパイプラインを構築する。
audit.mjs から Next.js Route Handler 経由で DB に書き込む。

---

## 2. 全体フロー

```
Cursor Hook発火
  │
  ▼ stdin (JSON)
audit.mjs
  ├─→ audit.json に追記（ローカルバックアップ）
  └─→ fetch POST http://localhost:3000/api/hooks
        │
        ▼
  Next.js Route Handler (リポジトリルート)
  POST /api/hooks
        │
        ▼ hook_event_name で振り分け
  ┌─────┼─────┬──────┬──────┬──────┐
  ▼     ▼     ▼      ▼      ▼      ▼
Tool  Shell  Mcp   File  Agent  Session
Event Event Event  Event Event  Event
  └─────┴─────┴──────┴──────┴──────┘
        │
        ▼
    PostgreSQL (Prisma)
```

---

## 3. テーブル設計

イベントの性質ごとに6テーブルに分割する。全テーブルに以下の共通フィールドを持つ。

### 3.1 共通フィールド

| カラム | 型 | 説明 |
|---|---|---|
| `id` | Int (PK, autoincrement) | |
| `loggedAt` | DateTime | イベント発生時刻 |
| `hookEventName` | String | イベント種別 |
| `conversationId` | String | 会話ID |
| `generationId` | String | 生成ID |
| `model` | String? | 使用モデル |
| `cursorVersion` | String? | Cursor バージョン |
| `workspaceRoot` | String? | ワークスペースルート |
| `userEmail` | String? | ユーザーメール |
| `transcriptPath` | String? | トランスクリプトパス |

### 3.2 テーブル一覧

#### hook_tool_events（ToolEvent）

対象イベント: `preToolUse` / `postToolUse` / `postToolUseFailure`

| カラム | 型 | 対象イベント | 説明 |
|---|---|---|---|
| `toolName` | String | 全て | ツール名 |
| `toolInput` | Json? | 全て | ツール入力 |
| `toolOutput` | String? | postToolUse | ツール出力 |
| `toolUseId` | String? | 全て | ツール使用ID |
| `cwd` | String? | 全て | 作業ディレクトリ |
| `duration` | Float? | postToolUse, postToolUseFailure | 実行時間 |
| `agentMessage` | String? | preToolUse | エージェントメッセージ |
| `errorMessage` | String? | postToolUseFailure | エラーメッセージ |
| `failureType` | String? | postToolUseFailure | timeout / error / permission_denied |
| `isInterrupt` | Boolean? | postToolUseFailure | 中断フラグ |

#### hook_shell_events（ShellEvent）

対象イベント: `beforeShellExecution` / `afterShellExecution`

| カラム | 型 | 対象イベント | 説明 |
|---|---|---|---|
| `command` | String | 全て | 実行コマンド |
| `output` | String? | afterShellExecution | コマンド出力 |
| `duration` | Float? | afterShellExecution | 実行時間 |
| `sandbox` | Boolean? | 全て | サンドボックスフラグ |
| `cwd` | String? | 全て | 作業ディレクトリ |

#### hook_mcp_events（McpEvent）

対象イベント: `beforeMCPExecution` / `afterMCPExecution`

| カラム | 型 | 対象イベント | 説明 |
|---|---|---|---|
| `toolName` | String | 全て | MCPツール名 |
| `toolInput` | String? | 全て | ツール入力 |
| `resultJson` | String? | afterMCPExecution | 実行結果JSON |
| `duration` | Float? | afterMCPExecution | 実行時間 |
| `url` | String? | 全て | MCP URL |
| `command` | String? | 全て | MCPコマンド |

#### hook_file_events（FileEvent）

対象イベント: `beforeReadFile` / `afterFileEdit` / `beforeTabFileRead` / `afterTabFileEdit`

| カラム | 型 | 対象イベント | 説明 |
|---|---|---|---|
| `filePath` | String | 全て | ファイルパス |
| `content` | String? | beforeReadFile, beforeTabFileRead | ファイル内容 |
| `edits` | Json? | afterFileEdit, afterTabFileEdit | 編集内容 |
| `attachments` | Json? | beforeReadFile | 添付ファイル |

#### hook_agent_events（AgentEvent）

対象イベント: `subagentStart` / `subagentStop` / `afterAgentResponse` / `afterAgentThought` / `stop`

| カラム | 型 | 対象イベント | 説明 |
|---|---|---|---|
| `subagentId` | String? | subagentStart | サブエージェントID |
| `subagentType` | String? | subagentStart, subagentStop | サブエージェント種別 |
| `task` | String? | subagentStart, subagentStop | タスク内容 |
| `parentConversationId` | String? | subagentStart | 親会話ID |
| `toolCallId` | String? | subagentStart | ツール呼び出しID |
| `subagentModel` | String? | subagentStart | サブエージェントモデル |
| `isParallelWorker` | Boolean? | subagentStart | 並列ワーカーフラグ |
| `gitBranch` | String? | subagentStart | Gitブランチ |
| `status` | String? | subagentStop, stop | completed / error / aborted |
| `description` | String? | subagentStop | 説明 |
| `summary` | String? | subagentStop | サマリー |
| `durationMs` | Int? | subagentStop, afterAgentThought | 実行時間(ms) |
| `messageCount` | Int? | subagentStop | メッセージ数 |
| `toolCallCount` | Int? | subagentStop | ツール呼び出し数 |
| `loopCount` | Int? | subagentStop, stop | ループ数 |
| `modifiedFiles` | Json? | subagentStop | 変更ファイル一覧 |
| `agentTranscriptPath` | String? | subagentStop | トランスクリプトパス |
| `text` | String? | afterAgentResponse, afterAgentThought | テキスト内容 |

#### hook_session_events（SessionEvent）

対象イベント: `sessionStart` / `sessionEnd` / `beforeSubmitPrompt` / `preCompact`

| カラム | 型 | 対象イベント | 説明 |
|---|---|---|---|
| `sessionId` | String? | sessionStart, sessionEnd | セッションID |
| `isBackgroundAgent` | Boolean? | sessionStart, sessionEnd | バックグラウンドエージェントフラグ |
| `composerMode` | String? | sessionStart | agent / ask / edit |
| `reason` | String? | sessionEnd | 終了理由 |
| `durationMs` | Int? | sessionEnd | セッション時間(ms) |
| `finalStatus` | String? | sessionEnd | 最終ステータス |
| `errorMessage` | String? | sessionEnd | エラーメッセージ |
| `prompt` | String? | beforeSubmitPrompt | プロンプト内容 |
| `attachments` | Json? | beforeSubmitPrompt | 添付ファイル |
| `trigger` | String? | preCompact | auto / manual |
| `contextUsagePercent` | Float? | preCompact | コンテキスト使用率 |
| `contextTokens` | Int? | preCompact | コンテキストトークン数 |
| `contextWindowSize` | Int? | preCompact | コンテキストウィンドウサイズ |
| `messageCount` | Int? | preCompact | メッセージ数 |
| `messagesToCompact` | Int? | preCompact | コンパクト対象メッセージ数 |
| `isFirstCompaction` | Boolean? | preCompact | 初回コンパクションフラグ |

---

## 4. イベント → テーブル マッピング

```typescript
const TABLE_MAP: Record<string, string> = {
  // ToolEvent
  preToolUse:            'toolEvent',
  postToolUse:           'toolEvent',
  postToolUseFailure:    'toolEvent',
  // ShellEvent
  beforeShellExecution:  'shellEvent',
  afterShellExecution:   'shellEvent',
  // McpEvent
  beforeMCPExecution:    'mcpEvent',
  afterMCPExecution:     'mcpEvent',
  // FileEvent
  beforeReadFile:        'fileEvent',
  afterFileEdit:         'fileEvent',
  beforeTabFileRead:     'fileEvent',
  afterTabFileEdit:      'fileEvent',
  // AgentEvent
  subagentStart:         'agentEvent',
  subagentStop:          'agentEvent',
  afterAgentResponse:    'agentEvent',
  afterAgentThought:     'agentEvent',
  stop:                  'agentEvent',
  // SessionEvent
  sessionStart:          'sessionEvent',
  sessionEnd:            'sessionEvent',
  beforeSubmitPrompt:    'sessionEvent',
  preCompact:            'sessionEvent',
}
```

---

## 5. コンポーネント設計

### 5.1 audit.mjs の変更

**現在の動作:** stdin → JSON parse → audit.json に追記

**変更後の動作:** stdin → JSON parse → audit.json に追記 + fetch POST to API

```javascript
// 追加するロジック（概要）
async function sendToApi(payload) {
  try {
    await fetch('http://localhost:3000/api/hooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000), // 3秒タイムアウト
    });
  } catch {
    // サイレントに失敗（audit.json がバックアップとして機能）
  }
}
```

**設計ポイント:**
- Node.js 18+ の組み込み `fetch` を使用（外部依存なし）
- タイムアウト 3秒（Cursor Hook の5秒制限内に収める）
- fetch 失敗時はサイレントに無視し、Cursor の動作をブロックしない
- audit.json への書き込みは既存ロジックを維持（フォールバック兼ローカルバックアップ）

### 5.2 リポジトリルート — Next.js Route Handler

```
（リポジトリルート）
├── package.json          # next, react, react-dom, zod, prisma 等
├── tsconfig.json
├── next.config.ts
└── src/app/
    ├── layout.tsx
    └── api/hooks/
        └── route.ts      # POST /api/hooks
```

**`POST /api/hooks` の処理フロー:**

```
1. リクエストボディを JSON パース
2. hook_event_name を取得
3. TABLE_MAP で対象テーブルを特定
4. 共通フィールドを抽出（スネークケース → キャメルケース変換）
5. イベント固有フィールドを抽出・変換
6. Prisma で該当テーブルに INSERT
7. 201 Created を返却（エラー時は 400 or 500）
```

### 5.3 src/lib — DB保存関数

```
src/lib/storage/
├── queries.ts           # 既存（UsageEvent 用）
└── hook-queries.ts      # Hook Event 保存関数
```

**hook-queries.ts の構成:**

```typescript
// 共通フィールド抽出
function extractCommonFields(payload: Record<string, unknown>) {
  return {
    loggedAt:        new Date(payload._loggedAt ?? Date.now()),
    hookEventName:   payload.hook_event_name,
    conversationId:  payload.conversation_id,
    generationId:    payload.generation_id,
    model:           payload.model ?? null,
    cursorVersion:   payload.cursor_version ?? null,
    workspaceRoot:   payload.workspace_roots?.[0] ?? null,
    userEmail:       payload.user_email ?? null,
    transcriptPath:  payload.transcript_path ?? null,
  }
}

// テーブル別保存関数
export async function saveToolEvent(payload): Promise<void>
export async function saveShellEvent(payload): Promise<void>
export async function saveMcpEvent(payload): Promise<void>
export async function saveFileEvent(payload): Promise<void>
export async function saveAgentEvent(payload): Promise<void>
export async function saveSessionEvent(payload): Promise<void>

// 振り分けエントリポイント
export async function saveHookEvent(payload): Promise<void>
```

---

## 6. フィールドマッピング（スネークケース → キャメルケース）

Hook stdin のフィールド名はスネークケースで、Prisma モデルはキャメルケース。
保存関数内で以下の変換を行う。

| stdin (スネークケース) | Prisma (キャメルケース) |
|---|---|
| `hook_event_name` | `hookEventName` |
| `conversation_id` | `conversationId` |
| `generation_id` | `generationId` |
| `cursor_version` | `cursorVersion` |
| `workspace_roots` | `workspaceRoot`（配列の先頭要素） |
| `user_email` | `userEmail` |
| `transcript_path` | `transcriptPath` |
| `tool_name` | `toolName` |
| `tool_input` | `toolInput` |
| `tool_output` | `toolOutput` |
| `tool_use_id` | `toolUseId` |
| `error_message` | `errorMessage` |
| `failure_type` | `failureType` |
| `is_interrupt` | `isInterrupt` |
| `agent_message` | `agentMessage` |
| `result_json` | `resultJson` |
| `file_path` | `filePath` |
| `subagent_id` | `subagentId` |
| `subagent_type` | `subagentType` |
| `parent_conversation_id` | `parentConversationId` |
| `tool_call_id` | `toolCallId` |
| `subagent_model` | `subagentModel` |
| `is_parallel_worker` | `isParallelWorker` |
| `git_branch` | `gitBranch` |
| `duration_ms` | `durationMs` |
| `message_count` | `messageCount` |
| `tool_call_count` | `toolCallCount` |
| `loop_count` | `loopCount` |
| `modified_files` | `modifiedFiles` |
| `agent_transcript_path` | `agentTranscriptPath` |
| `session_id` | `sessionId` |
| `is_background_agent` | `isBackgroundAgent` |
| `composer_mode` | `composerMode` |
| `final_status` | `finalStatus` |
| `context_usage_percent` | `contextUsagePercent` |
| `context_tokens` | `contextTokens` |
| `context_window_size` | `contextWindowSize` |
| `messages_to_compact` | `messagesToCompact` |
| `is_first_compaction` | `isFirstCompaction` |

---

## 7. 依存関係

```
audit.mjs (依存なし — Node.js 組み込み fetch)
  │
  ▼ HTTP POST
リポジトリルート (Next.js, dependencies)
  │
  ▼ import @/lib
src/lib (prisma, @prisma/adapter-pg, pg)
  │
  ▼ SQL
PostgreSQL
```

---

## 8. エラーハンドリング

| 箇所 | エラー | 対応 |
|---|---|---|
| audit.mjs → API | fetch 失敗・タイムアウト | サイレント無視（audit.json がバックアップ） |
| Route Handler | JSON パースエラー | 400 Bad Request |
| Route Handler | 未知の hook_event_name | 400 Bad Request + ログ出力 |
| Route Handler | DB 書き込み失敗 | 500 Internal Server Error + ログ出力 |
| Route Handler | Prisma 接続エラー | 500 Internal Server Error |

---

## 9. Next.js MCP (next-devtools) の活用

開発時に `next-devtools-mcp` MCP サーバーを活用する。

**MCP 設定（~/.cursor/mcp.json に設定済み）:**

```json
{
  "next-devtools": {
    "command": "npx",
    "args": ["-y", "next-devtools-mcp@latest"]
  }
}
```

**活用場面:**

| 場面 | 活用方法 |
|---|---|
| Route Handler 実装 | Next.js のルーティング規約に沿った実装を MCP が補助 |
| デバッグ | Next.js DevTools 経由で API リクエスト/レスポンスを確認 |
| ビルドエラー解析 | ビルド・コンパイルエラーの診断に MCP ツールを使用 |
| パフォーマンス確認 | Route Handler のレスポンス時間をDevTools で監視 |

**開発フロー:**

```
1. pnpm dev  → Next.js 開発サーバー起動（localhost:3000）
2. next-devtools-mcp      → Cursor が MCP 経由で Next.js と連携
3. Cursor Agent が MCP ツールを使って:
   - ルート構成の確認
   - ランタイムエラーの取得
   - ビルド状態の監視
```

---

## 10. 実装手順

1. `src/lib/storage/hook-queries.ts` — 保存関数を実装
2. `src/lib/index.ts` — hook-queries のエクスポートを追加
3. リポジトリルート — Next.js セットアップ（next, react, react-dom インストール）
4. `src/app/api/hooks/route.ts` — Route Handler 実装
5. `prisma migrate dev` — マイグレーション実行
6. `.cursor/hooks/audit.mjs` — fetch POST ロジックを追加
7. 動作確認: Cursor Hook 発火 → API → DB 保存
