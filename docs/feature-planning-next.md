# 次期機能企画: コスト可視化を行動につなげるDashboard v1

## 現在のプロダクト状況

`cursor-consumption` は、Cursor Hooks から発火するイベントを Next.js Route Handler 経由で PostgreSQL に保存し、Hook種別ごとの一覧をWebダッシュボードで確認できる段階にある。Prismaスキーマには `UsageEvent` / `DailySummary` と、Hookイベント用の6系統テーブルが存在し、料金テーブル外部化とコスト計算ロジックの基礎もある。

一方で、Primaryユーザーである Cursor Pro/Pro+/Ultra の個人開発者が最も知りたい「今月いくら使っているか」「何がコストを押し上げているか」「次に何を変えればよいか」は、まだ一目で判断できない。現在のHookイベント一覧はデータ収集・監査には有用だが、利用最適化の意思決定には追加の集計・解釈が必要である。

---

## 次に企画すべき機能候補3つ

| 候補 | 機能名 | 解決する課題 | 対象ユーザー | MVP / Post-MVP / 将来拡張 | 優先度 |
|---|---|---|---|---|---|
| 1 | コストサマリー & 支出ドライバー Dashboard v1 | 自分のCursor利用が予算内か、どのモデル・機能・作業が支出要因か分からない | Primary: 個人開発者 / Secondary: チーム管理者 | MVP | 最優先 |
| 2 | 予算ペース予測・しきい値アラート | 月末に想定外の超過に気づく。使いすぎの兆候に早く気づけない | Primary: 個人開発者 | Post-MVP | 高 |
| 3 | セッション/プロジェクト別 消費分析 | どの開発タスク・リポジトリ・Cursorモードが費用対効果に見合うか分からない | Primary: 個人開発者 / Secondary: チーム管理者 | Post-MVP -> 将来拡張 | 中 |

### 候補1: コストサマリー & 支出ドライバー Dashboard v1

- **概要**: 当月の推定消費額、プラン予算に対する進捗、モデル別・機能別・日別の支出ドライバーをトップ画面で可視化する。
- **提供価値**: ユーザーが「今日からどの使い方を変えるべきか」を判断できる。
- **実現可能性**: 既存の `UsageEvent` / `DailySummary` / Hookのtoken fields / 料金テーブルを活用できる。Hooks由来データの精度限界は「推定」「データカバレッジ」として明示する。
- **主要リスク**: Hooksにtoken情報がないイベントがある、CursorのHook仕様変更、料金体系変更、プロンプト等の機微情報表示。

### 候補2: 予算ペース予測・しきい値アラート

- **概要**: 現在の消費ペースから月末推定額を算出し、閾値超過時にUI上で警告する。将来的にデスクトップ通知へ拡張する。
- **提供価値**: 月末の想定外コストを防ぐ。
- **実現可能性**: 候補1の月次集計が前提。最初はUI内の警告だけに限定すれば実装は軽い。
- **主要リスク**: 開発日ごとの利用ムラにより予測がぶれやすい。予測根拠を明示しないと不信感につながる。

### 候補3: セッション/プロジェクト別 消費分析

- **概要**: `workspaceRoot`、`conversationId`、`sessionId`、`composerMode` を軸に、どの作業単位が高コストだったかを表示する。
- **提供価値**: 個人開発者が「Agentを使うべき作業」「Chatで十分な作業」「コンテキスト肥大化しやすい作業」を見分けられる。
- **実現可能性**: Hookイベントにはセッション・会話・ワークスペースのメタデータがあるため、段階的に集計できる。
- **主要リスク**: プロンプトやファイルパスのプライバシー配慮が必須。コストと成果の因果を誤って解釈させる恐れがある。

---

# 最優先PRD: コストサマリー & 支出ドライバー Dashboard v1

## 1. ユーザー課題

### Primary: Cursor Pro/Pro+/Ultra の個人開発者

- **誰が**: Cursorを日常的に使い、Agent/Composer/Chat/Tab補完を併用する個人開発者。
- **場面**:
  - 月の途中で「このペースだとプラン内に収まるか」を知りたい。
  - Agentを多用した日に「何が高かったのか」を振り返りたい。
  - モデルやモードの使い分けを改善したい。
- **困りごと**:
  - Cursor公式画面だけではリアルタイム性・履歴分析・モデル/機能別の内訳が不足する。
  - 料金体系が変わると、自分の支出感覚がすぐ古くなる。
  - 非公式APIや内部データに依存するツールは、セキュリティや仕様変更が不安。
  - ローカルで収集したデータがどの程度正確か分からないと、表示額を信頼できない。

### Secondary: チーム管理者

- **誰が**: 将来的にCursor Business/Enterpriseのチーム利用を見たい管理者。
- **場面**: チーム導入前に、個人利用レベルで支出要因やダッシュボードの見え方を検証したい。
- **困りごと**: 個人向けHooksデータと将来のAdmin APIデータの接続点がないと、チーム利用へ発展させづらい。

## 2. 企画する機能

### 機能名

**コストサマリー & 支出ドライバー Dashboard v1**

### 概要

Cursor Hooksで収集した利用イベントと、外部化された料金テーブルをもとに、当月の推定消費額・プラン予算に対する進捗・日別推移・モデル別/機能別の支出ドライバーをWebダッシュボードで表示する。表示額は「推定」または「Cursor課金値」といった信頼度ラベルを付与し、データ欠損や未知モデルをユーザーに明示する。

### 対象ユーザー

- Primary: Cursor Pro / Pro+ / Ultra の個人開発者
- Secondary: 将来的なチーム管理者、導入検証者

### 提供価値

- 今月の利用がプラン内に収まりそうかを即座に把握できる。
- 高コストのモデル・機能・日付を特定し、利用方法を変えるきっかけを得られる。
- データの出どころと精度を明示し、ローカルツールとして安心して使える。
- 将来の予算アラート、セッション分析、公式API連携の土台になる。

## 3. ユースケース

### ユースケースA: 月途中の支出確認

1. 個人開発者がローカルで `pnpm dev` を起動し、Dashboardを開く。
2. トップ画面で「当月推定消費額」「プラン予算」「消費率」「残り予算」を確認する。
3. 消費率が70%を超えていれば、モデル別・機能別の上位支出要因を見る。
4. Claude系モデルのAgent利用が多いと分かり、軽い質問はChat/Askや低コストモデルに切り替える。

### ユースケースB: 高コスト日の振り返り

1. ある日に急に消費額が増えたことを日別チャートで確認する。
2. その日を選択し、モデル別・機能別の内訳を見る。
3. `Agent` の長時間セッションとコンテキスト肥大化が支出要因だと把握する。
4. 次回はセッション分割やコンテキスト整理を行う。

### ユースケースC: データ信頼度の確認

1. ダッシュボード上に「推定額」「未知モデルあり」「token fields欠損あり」と表示される。
2. ユーザーは、表示額がCursor公式請求額と完全一致するものではないと理解する。
3. 料金テーブルの更新日と未知モデル一覧を確認し、必要なら `pricing/models.json` を更新する。

## 4. MVPスコープ

### 作るもの

- **トップサマリー**
  - 当月推定消費額
  - プラン予算に対する消費率
  - 残り予算
  - 当日消費額
  - 直近同期/Hook受信時刻
- **支出ドライバー**
  - モデル別コスト上位
  - 機能別コスト上位
  - 日別コスト推移
  - 直近の高コストイベント一覧
- **データ信頼度表示**
  - `chargedCents` がある場合は「Cursor課金値」
  - 料金テーブルで計算した場合は「推定」
  - token欠損、未知モデル、価格未定義を警告
- **設定**
  - プラン種別: Pro / Pro+ / Ultra / Custom
  - 月次予算
  - 請求サイクル開始日
  - 表示通貨はMVPではUSD固定
- **集計API**
  - ダッシュボード表示に必要な月次・日次・モデル別・機能別の読み取りAPI
- **プライバシー配慮**
  - トップ画面にはプロンプト本文を表示しない
  - 詳細画面でもプロンプト表示は明示的な遷移後に限定する

### 作らないもの

- デスクトップ通知、Slack/メール通知
- 予測精度の高い月末コスト予測
- Cursor内部APIへの直接ログイン・セッショントークン取得
- Enterprise/Admin API連携
- チームメンバー別の集計
- 請求額の公式照合・自動補正
- 複数通貨対応
- AIによる自動最適化提案

### Post-MVP

- 月末予測としきい値アラート
- セッション/プロジェクト別の深掘り
- CSV/JSONエクスポート
- 料金テーブル更新チェック
- 未知モデルの手動マッピングUI

### 将来拡張

- Cursor公式APIまたはAdmin APIとの照合
- チーム/ユーザー別ダッシュボード
- 経費精算用レポート
- 複数AIツール横断の利用分析

## 5. 成功指標

### 定量指標

- ダッシュボードトップの初回表示完了率: 95%以上
- Hook受信済みユーザーのうち、当月コストサマリーを表示できる割合: 80%以上
- 未知モデルまたは価格未定義による「計算不能イベント」の割合: 5%未満を維持
- 主要集計APIのレスポンス: 30日分データで500ms以内
- トップ画面からモデル別/機能別詳細へ進む割合: 30%以上

### 定性指標

- ユーザーが「なぜ高くなったか」を説明できる。
- ユーザーが「次に何を変えるか」を1つ以上決められる。
- 表示額が推定であること、欠損があることを誤解なく理解できる。
- ローカル保存・トークン非保存・プロンプト非表示の方針に安心感がある。

## 6. 優先度

### ICE評価

| 評価軸 | スコア | 判断理由 |
|---|---:|---|
| Impact | 9 | コスト可視化というプロダクトの中核価値に直結し、Primaryユーザーの最重要課題を解決する |
| Confidence | 7 | 既存のHook保存、UsageEvent、料金テーブル、Prisma集計を活用できる。一方、token fieldsの網羅性には不確実性がある |
| Effort | 5 | 新規画面・集計API・設定UI・データ信頼度表示が必要だが、既存アーキテクチャ内で完結する |

**総合判断: 最優先。**

候補2の予算アラートは価値が高いが、正確な月次サマリーがなければ成立しない。候補3のセッション分析も有用だが、まずモデル/機能/日別の基本的な支出ドライバーを提示し、ユーザーがコスト構造を理解できる状態を作るべきである。

## 7. リスクと対策

| リスク | 内容 | 影響 | 対策 |
|---|---|---|---|
| Cursor Hook仕様変更 | token fields、event名、payload構造が変わる | 集計不能、表示欠損 | zod等で受信スキーマを緩く検証し、未知フィールドは保存。token欠損率をUIに表示 |
| 非公式API利用リスク | 内部APIに依存すると規約・認証・仕様変更リスクが高い | セキュリティ・継続性 | MVPではHooks経由のローカルデータを前提にし、内部API取得は作らない。将来の公式API連携に抽象化余地を残す |
| データ精度 | Hooks由来のtoken情報が全イベントを網羅しない可能性 | 表示額と公式請求額がずれる | 「推定」ラベル、データカバレッジ、計算不能イベント数を表示。`chargedCents` がある場合は優先 |
| 料金体系変更 | Cursorの料金単価やプラン内容が変わる | 誤ったコスト表示 | `pricing/models.json` の更新日・適用バージョンを表示。未知モデル警告とCustom価格設定をPost-MVPで検討 |
| セキュリティ/プライバシー | prompt、file path、userEmail、transcriptPathが機微情報になり得る | ローカルでも心理的抵抗、漏えいリスク | トップ画面はメタデータ中心。プロンプト本文は非表示デフォルト。ログやエラーに本文・トークンを出さない |
| UX | 「推定」「欠損」「予算」の意味が分かりづらい | 誤解・不信感 | 各カードに短い説明、データ信頼度バッジ、空状態のセットアップガイドを置く |
| 運用 | PostgreSQL未起動、Hook未設定、料金テーブル欠損 | 初回体験の失敗 | DB接続エラー、Hook未受信、価格未定義をそれぞれ別状態として表示し、次の操作を案内 |

## 8. 開発チームへの要求

### 8.1 必要な画面

#### Dashboardトップ (`/` または `/usage`)

- 当月サマリーカード
  - `estimatedSpendCents`
  - `budgetCents`
  - `budgetUsagePercent`
  - `remainingBudgetCents`
  - `todaySpendCents`
  - `lastEventAt`
- データ信頼度バナー
  - `costSource`: `charged` / `estimated` / `mixed`
  - `unknownModelCount`
  - `missingTokenEventCount`
  - `pricingTableUpdatedAt`
- 支出ドライバー
  - モデル別Top N
  - 機能別Top N
  - 日別推移
- 空状態
  - Hookイベント未受信
  - UsageEvent未生成
  - 料金テーブル未設定
  - DB接続不可

#### 設定画面 (`/settings`)

- プラン種別
  - `pro`: budget $20
  - `pro_plus`: budget $70
  - `ultra`: budget $400
  - `custom`: user-defined
- 請求サイクル開始日
- 表示するデータ範囲
- プライバシー設定
  - プロンプト本文を一覧に表示しない: default true

#### 詳細画面 (`/usage/events`)

- 直近イベント一覧
- カラム
  - timestamp
  - model
  - feature
  - input/cache/output tokens
  - cost
  - cost source
  - conversation/session/workspaceへの参照
- デフォルトではprompt本文を表示しない。

### 8.2 必要なAPI

#### `GET /api/usage/summary`

Query:

- `from`
- `to`
- `billingCycle=true|false`

Response:

- `estimatedSpendCents`
- `budgetCents`
- `remainingBudgetCents`
- `budgetUsagePercent`
- `todaySpendCents`
- `requestCount`
- `tokenTotals`
- `lastEventAt`
- `dataQuality`

#### `GET /api/usage/drivers`

Query:

- `from`
- `to`
- `groupBy=model|feature|date`
- `limit`

Response:

- `items[]`
  - `key`
  - `label`
  - `costCents`
  - `requestCount`
  - `inputTokens`
  - `outputTokens`
  - `cacheReadTokens`
  - `cacheWriteTokens`
  - `sharePercent`

#### `GET /api/usage/events`

Query:

- `from`
- `to`
- `limit`
- `model`
- `feature`
- `minCostCents`

Response:

- `events[]`
  - `id`
  - `timestamp`
  - `model`
  - `feature`
  - `tokens`
  - `costCents`
  - `costSource`
  - `conversationId`
  - `sessionId`
  - `workspaceRoot`

#### `GET /api/config/billing` / `PUT /api/config/billing`

Fields:

- `plan`
- `budgetCents`
- `billingCycleStartDay`
- `currency`

### 8.3 必要なデータ

- `UsageEvent`
  - `timestamp`
  - `model`
  - `feature`
  - token fields
  - `chargedCents`
  - `calculatedCostCents`
  - `syncedAt`
- `DailySummary`
  - 日次のモデル/機能別集計
- Hookイベントテーブル
  - `AgentEvent.inputTokens`
  - `AgentEvent.outputTokens`
  - `AgentEvent.cacheReadTokens`
  - `AgentEvent.cacheWriteTokens`
  - `SessionEvent.composerMode`
  - `workspaceRoot`
  - `conversationId`
  - `sessionId`
- `Config`
  - `billing.plan`
  - `billing.budgetCents`
  - `billing.cycleStartDay`
  - `privacy.hidePromptByDefault`
- `pricing/models.json`
  - モデル単価
  - 適用日または更新日
  - Auto/Composerプールとモデル個別料金の区分

### 8.4 状態設計

- `ready`: 集計可能
- `no_hooks`: Hookイベントが未受信
- `no_usage_events`: Hookはあるがコスト集計に使えるイベントがない
- `partial_data`: 欠損や未知モデルがある
- `unknown_pricing`: 料金未定義モデルがある
- `stale_data`: 最終受信から一定時間以上経過
- `db_error`: PostgreSQLまたはPrisma接続不可
- `config_missing`: 請求予算・請求サイクルが未設定

### 8.5 例外ケース

- `model` がnullまたは未知
  - `unknown` として集計し、価格未定義ならコスト計算から除外して警告する。
- token fields がnull
  - コスト計算不能イベントとしてカウントし、支出合計には含めない。
- `chargedCents` とローカル計算値が両方ある
  - `chargedCents` を優先し、差分を将来の精度診断に残せるようにする。
- 同一イベントの重複受信
  - 可能なら `timestamp + model + feature + generationId/conversationId` 相当で重複排除を検討する。
- 請求サイクル開始日が月末
  - 月の日数差を考慮し、有効な日付へ丸める。
- PostgreSQL未起動
  - UIでDB接続失敗を表示し、`docker compose up -d` を案内する。
- プロンプト本文が長大または機微情報を含む
  - Dashboardトップには表示しない。詳細でも折りたたみ・明示操作を前提にする。

### 8.6 受け入れ条件

- HookまたはUsageEventが存在する環境で、当月推定消費額がトップ画面に表示される。
- モデル別・機能別・日別の支出ドライバーが同じ期間条件で整合する。
- 価格未定義モデルがある場合、合計額を過信させない警告が表示される。
- プロンプト本文はトップ画面に表示されない。
- PostgreSQL未接続時に、画面全体がクラッシュせず復旧手順が表示される。
- `pricing/models.json` を更新すれば、アプリ再起動後に新しい料金で計算できる。

