# cursor-consumption 機能企画

作成日: 2026-05-01

## 現在のプロダクト前提

- Primary ユーザーは Cursor Pro/Pro+/Ultra の個人開発者。
- Secondary ユーザーは Cursor Business/Enterprise のチーム管理者。
- 既存方針として Next.js App Router、Prisma、PostgreSQL、料金テーブル外部化、Cursor Hooks 経由のデータ収集を前提にする。
- 現在の実装は Hook Events Dashboard として、Tool / Shell / MCP / File / Agent / Session の各イベントを PostgreSQL に保存し、件数とイベント一覧を表示できる状態。
- `UsageEvent` / `DailySummary` / `CostCalculator` の基礎はあるが、Hooks 由来のトークン・セッション情報とコスト可視化の体験はまだ接続途上。
- 非公式 API への依存はリスクが高いため、次の機能は「公式に近い Hooks イベントで取れるデータを最大限活用し、不足分は透明に表示する」方針を優先する。

---

## 次に企画すべき機能候補 3 つ

### 候補 1: セッション別コスト・利用量ダッシュボード

- **概要**: Hooks で取得済みの Agent / Session イベント、token usage、model、composer mode、duration をもとに、会話・作業セッション単位でコスト、トークン、モデル、時間を可視化する。
- **対象ユーザー**: Primary 個人開発者。
- **解決する課題**: 「今日いくら使ったか」だけでなく、「どの作業が高くついたか」「なぜコストが増えたか」「次に何を変えればよいか」が分からない。
- **価値**: 非公式 API 依存を抑えながら、個人開発者が作業単位でコスト最適化の判断をできる。
- **優先度**: 最優先。既存 Hooks 基盤ともっとも接続しやすく、コスト可視化というプロダクト中核に直結する。

### 候補 2: 料金テーブル健全性・コスト信頼度インジケーター

- **概要**: `pricing/models.json` の更新日時、未定義モデル、charged cost と calculated cost の差分、推定コストの信頼度を画面に表示する。
- **対象ユーザー**: Primary 個人開発者、Secondary チーム管理者。
- **解決する課題**: Cursor の料金体系変更や未知モデル追加により、表示コストが正しいか分からなくなる。
- **価値**: コスト表示に対する信頼を高め、非公式・推定データの限界を透明に伝えられる。
- **優先度**: 高。ダッシュボードの信頼性を支えるが、単体ではユーザーの次アクションに直結しにくいため候補 1 の後。

### 候補 3: 予算ペース・月末着地予測

- **概要**: 現在の消費ペースから月末予測、プラン予算に対する進捗、超過見込みを表示し、任意の閾値で警告する。
- **対象ユーザー**: Primary 個人開発者、Secondary チーム管理者。
- **解決する課題**: 月末になって初めて使いすぎに気づき、モデル選択や利用習慣の改善が遅れる。
- **価値**: 「今月このまま使ってよいか」を即判断できる。
- **優先度**: 中から高。価値は高いが、まず日次・セッション別コストの集計精度が必要。

---

# PRD: セッション別コスト・利用量ダッシュボード

## 1. ユーザー課題

### Primary: Cursor Pro/Pro+/Ultra の個人開発者

個人開発者は、実装・調査・レビュー・リファクタリングなどの作業で Cursor Agent / Chat / Composer / Ask Mode を日常的に使う。利用後に Cursor の設定画面で月次の消費額を確認できても、以下が分からない。

- どの会話・作業セッションがコスト増の主因だったのか。
- 高コストの原因がモデル選択、長いコンテキスト、ツール実行回数、長時間セッション、再試行の多さのどれなのか。
- Pro / Pro+ / Ultra の含まれる予算内で使えているのか、使い方を変えるべきなのか。
- コスト表示が実測値なのか、料金テーブルによる推定値なのか。

その結果、ユーザーは「Cursor の AI は便利だが、どの使い方が高いのか分からない」という不安を持ち、利用を控えすぎたり、逆に無自覚に高コストな使い方を続けたりする。

### Secondary: チーム管理者

チーム管理者は将来的に、メンバーやプロジェクト単位の利用傾向を把握したい。ただし初期段階では Enterprise/Admin API に依存せず、まず個人ローカル環境で安全に使える分析体験を成立させる必要がある。

## 2. 企画する機能

### 機能名

セッション別コスト・利用量ダッシュボード

### 概要

Cursor Hooks で収集した Session / Agent イベントをもとに、作業セッション単位でトークン消費、推定コスト、利用モデル、モード、所要時間、ツール呼び出し数を集計し、Next.js のダッシュボードで表示する。

コストは以下の優先順で算出する。

1. Hook イベントや将来の API 連携で課金額が取得できる場合は実測値を使用する。
2. 取得できない場合は token usage と外部化された料金テーブルから推定する。
3. 必要なモデル料金や token usage が不足する場合は、コストを 0 に丸めず「算出不可」または「低信頼度」として表示する。

### 対象ユーザー

- MVP: Cursor Pro/Pro+/Ultra の個人開発者。
- Post-MVP: 複数ワークスペースを使う個人開発者、小規模チームの管理者。
- 将来拡張: Cursor Business/Enterprise のチーム管理者。

### 提供価値

- 「どの作業がコストを使ったか」が分かる。
- 「次に何を変えるべきか」を判断できる。
  - 高コストモデルの連続利用を見直す。
  - 長すぎるセッションを分割する。
  - コンテキスト肥大化や compaction 前後の消費増を確認する。
  - ツール呼び出しが多い作業を見直す。
- 非公式 API に強く依存せず、Hooks で得られるデータを中心にローカルで安心して使える。
- 将来の公式 API / Admin API 連携時にも、同じ「セッション別集計」という表示単位を維持できる。

## 3. ユースケース

### ユースケース 1: 今日の高コスト作業を振り返る

1. 個人開発者が作業終了後にダッシュボードを開く。
2. 今日のセッション一覧をコスト順で確認する。
3. もっとも高いセッションを開き、モデル、token usage、duration、tool call count、composer mode を確認する。
4. 「長時間 Agent で高コストモデルを使い続けた」「コンテキスト使用率が高いまま実行した」などの原因を把握する。
5. 次回は Ask Mode で事前調査してから Agent に渡す、安価なモデルへ切り替える、セッションを分ける、といった行動を取る。

### ユースケース 2: 月次予算内に収まる使い方を探る

1. ユーザーが今月のセッション別消費を確認する。
2. 直近 7 日の上位セッションが特定モデルに偏っていることを発見する。
3. 予算ペースが高い場合、重い作業だけ高性能モデルを使い、軽い質問は低コストモデルにする運用へ変更する。

### ユースケース 3: データの信頼性を確認する

1. ユーザーがセッション詳細でコスト表示に「推定」と表示されていることを確認する。
2. 未知モデルや token usage 欠落がある場合、画面上で「一部算出不可」と分かる。
3. 料金テーブル更新や Hook 設定確認に進める。

## 4. MVP スコープ

### MVP で作るもの

#### 画面

- `/usage` またはトップページの Usage セクション。
- 今日・直近 7 日・今月のサマリーカード。
  - 推定コスト合計。
  - input / output / cache read / cache write tokens。
  - セッション数。
  - コスト算出不可イベント数。
- セッション一覧。
  - sessionId または conversationId。
  - 開始・終了時刻。
  - duration。
  - model。
  - composerMode。
  - token usage。
  - 推定コスト。
  - confidence: `actual` / `estimated` / `partial` / `unknown`。
- セッション詳細。
  - セッション内の Agent / Session イベント時系列。
  - token usage の内訳。
  - tool call count / message count / loop count。
  - preCompact がある場合の context usage。

#### データ

- 既存の `AgentEvent` の token usage を利用する。
- 既存の `SessionEvent` の sessionId、composerMode、durationMs、context usage を利用する。
- セッション単位の集計は、まず永続化テーブルではなくクエリまたは service 層で生成してよい。
- コスト計算には既存の `CostCalculator` と外部料金テーブルを使う。
- モデル料金が不明な場合は 0 円扱いではなく、算出不可として UI に出す。

#### API

- `GET /api/usage/sessions?range=today|7d|month`
- `GET /api/usage/sessions/[id]`
- `GET /api/usage/summary?range=today|7d|month`

#### UX

- 推定コストであることを明示する。
- 「この金額は Cursor の請求額と完全一致しない可能性があります」を常時表示する。
- 未知モデル・料金未設定・token usage 欠落を警告として出す。

### MVP で作らないもの

- Cursor 内部 API からの課金データ取得。
- Enterprise/Admin API 連携。
- チームメンバー別ダッシュボード。
- デスクトップ通知。
- 自動予算アラート。
- CSV/JSON エクスポート。
- AI によるコスト最適化提案文の自動生成。
- プロンプト本文やファイル内容を使った詳細分析。

### Post-MVP

- 月末着地予測とプラン別予算ペース表示。
- モデル別・ワークスペース別・composer mode 別のトレンド。
- CSV/JSON エクスポート。
- 料金テーブル更新チェック。
- セッションにユーザー定義タグを付ける。

### 将来拡張

- Cursor 公式 API / Admin API が使える場合の実測 charged cost 取り込み。
- チーム・メンバー・Billing Group 単位の集計。
- ローカル個人データとチーム公式データの差分検証。
- 公式料金体系変更に追従するリモート料金テーブル配信。

## 5. 成功指標

### 定量指標

- 初回セットアップ後、1 日以内に 1 件以上のセッション別コストが表示されるユーザー比率。
- セッション一覧ページの週次閲覧回数。
- 高コストセッション詳細のクリック率。
- `unknown` または `partial` のコスト比率が継続的に低下すること。
- 直近 7 日のセッション別コスト上位 5 件が表示できるユーザー比率。

### 定性指標

- ユーザーが「どの作業でコストが増えたか説明できる」状態になる。
- ユーザーが「次にモデル選択・セッション分割・コンテキスト整理のどれを試すか」を判断できる。
- コストが推定であること、不足データがあることをユーザーが理解できる。
- ローカル保存で安心して使えるという評価を得る。

## 6. 優先度

| 観点 | 評価 | 理由 |
|---|---|---|
| Impact | 高 | プロダクトの中核であるコスト可視化に直結し、ユーザーが次の行動を取りやすくなる。 |
| Confidence | 中から高 | Hooks 基盤と DB 保存は既に存在する。token usage の網羅性やモデル料金の不確実性は残る。 |
| Effort | 中 | 新規データ取得より、既存イベントの集計・API・UI 実装が中心。ただしセッション紐付けと信頼度表示の設計が必要。 |

### 総合判断

最優先で進める。理由は以下。

- Primary ユーザーの「何にいくら使ったか分からない」という最重要課題に直接効く。
- 非公式 API への依存を増やさず、既存の Hooks 収集方針と整合する。
- 後続の予算予測、アラート、チーム分析、公式 API 連携の土台になる。

## 7. リスクと対策

| リスク | 内容 | 影響 | 対策 |
|---|---|---|---|
| Cursor Hooks 仕様変更 | Hook イベント名、token usage フィールド、sessionId の形式が変わる可能性がある。 | 高 | zod 等で入力スキーマを緩く検証し、未知フィールドを破棄しない。欠落時は partial として表示する。 |
| データ精度 | Hooks で取得できる token usage が請求額と一致しない可能性がある。 | 高 | UI で actual / estimated / partial / unknown を明示し、Cursor 請求額との差異を前提にする。 |
| 料金体系変更 | Cursor のプラン、モデル単価、Max Mode 係数が変わる。 | 中から高 | 料金テーブルを外部化し、未定義モデルを警告する。料金テーブルの version / updatedAt を持たせる。 |
| 非公式 API 利用 | 内部 API 依存は利用規約・仕様変更のリスクがある。 | 高 | MVP では内部 API を使わず Hooks データ中心で成立させる。将来は公式 API 優先にする。 |
| セキュリティ | prompt、file content、tool input/output に機密情報が含まれる可能性がある。 | 高 | コスト集計に不要な本文は表示しない。設定で prompt / output 保存無効化やマスキングを検討する。 |
| UX | 推定値が多いとユーザーが不信感を持つ。 | 中 | 信頼度バッジ、算出根拠、未設定モデルの警告を表示する。 |
| ローカル運用 | Next.js サーバー停止中は Hooks の POST に失敗する。 | 中 | `audit.json` をバックアップとして維持し、後続で再取り込み機能を検討する。 |
| パフォーマンス | イベント数が増えるとセッション集計クエリが重くなる。 | 中 | MVP は期間フィルタを必須化し、必要に応じて Post-MVP で session summary テーブルを追加する。 |

## 8. 開発チームへの要求

### 8.1 画面要求

#### Usage Summary

- パス: `/usage` または `/`
- 表示項目:
  - range selector: today / 7d / month
  - total estimated cost
  - total tokens by type
  - session count
  - unknown cost count
  - data freshness: 最新イベント時刻
- 状態:
  - loading
  - empty: まだ Hook イベントがない
  - partial: 一部コスト算出不可
  - error: DB 接続または API エラー

#### Session List

- 表示項目:
  - session/conversation identifier
  - start/end
  - duration
  - model
  - composer mode
  - input/output/cache tokens
  - estimated cost
  - confidence badge
- 操作:
  - range filter
  - sort by cost / start time / duration / tokens
  - click to detail

#### Session Detail

- 表示項目:
  - timeline of relevant SessionEvent / AgentEvent
  - token usage by event
  - tool call count, message count, loop count
  - context usage and compaction event if available
  - cost calculation notes
- 表示しない項目:
  - prompt full text
  - file contents
  - raw tool output

### 8.2 API 要求

#### `GET /api/usage/summary`

Query:

- `range`: `today` | `7d` | `month`

Response:

- `range`
- `totalCostCents`
- `costConfidenceBreakdown`
- `totalInputTokens`
- `totalOutputTokens`
- `totalCacheReadTokens`
- `totalCacheWriteTokens`
- `sessionCount`
- `unknownCostCount`
- `latestEventAt`

#### `GET /api/usage/sessions`

Query:

- `range`: `today` | `7d` | `month`
- `sort`: `cost` | `startedAt` | `duration` | `tokens`

Response item:

- `id`
- `sessionId`
- `conversationId`
- `startedAt`
- `endedAt`
- `durationMs`
- `model`
- `composerMode`
- `tokenUsage`
- `estimatedCostCents`
- `confidence`
- `warnings`

#### `GET /api/usage/sessions/[id]`

Response:

- session summary
- event timeline
- token usage breakdown
- cost calculation details
- warnings

### 8.3 データ・集計要求

- sessionId がある場合は sessionId を優先して集計する。
- sessionId がない AgentEvent は conversationId で暫定的に集計する。
- model が複数ある場合はコスト上位モデル、または `mixed` として表示する。
- duration は SessionEvent の durationMs を優先し、なければ最初と最後の loggedAt 差分で推定する。
- confidence の定義:
  - `actual`: charged cost が取得できている。
  - `estimated`: token usage と料金テーブルで算出できている。
  - `partial`: 一部イベントの token usage または料金が不足している。
  - `unknown`: コスト算出に必要な情報がない。
- 未知モデルは警告として返す。
- コスト算出不可イベントを 0 円として合算しない。

### 8.4 例外ケース

- Hook イベントが 0 件。
- sessionStart はあるが sessionEnd がない。
- AgentEvent に token usage がない。
- model が null。
- 料金テーブルに model がない。
- 同一 conversationId に複数 sessionId が混在する。
- DB 接続失敗。
- Next.js サーバー停止により Hooks POST が欠落している。

### 8.5 セキュリティ・プライバシー要求

- セッション別コスト画面では prompt、file content、tool output を初期表示しない。
- 将来的な詳細表示でも、ユーザーが明示的に opt-in するまでは本文を表示しない。
- ログにトークン、prompt、file content を出さない。
- ローカル PostgreSQL 保存であることを明示する。

### 8.6 テスト要求

- cost confidence 判定のユニットテスト。
- 未知モデル時に 0 円合算せず warning を返すテスト。
- sessionId がない場合の conversationId 集計テスト。
- sessionEnd 欠落時の duration 推定テスト。
- API レスポンスの empty / partial / error ケースのテスト。

