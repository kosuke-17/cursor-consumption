# cursor-consumption 次期機能企画 PRD

作成日: 2026-05-07

## 現在のプロダクト状況

`cursor-consumption` は、Cursor の AI 利用量・トークン消費・コストを可視化するローカル実行前提の Next.js アプリである。既存の要件定義では Cursor 内部 API/ローカル SQLite からの使用量取得も想定しているが、現在の実装は Cursor Hooks から発火するイベントを `.cursor/hooks/audit.mjs` で受け取り、Next.js Route Handler 経由で PostgreSQL に保存し、Hook Events Dashboard で閲覧する構成が先行している。

現時点で取得・保存できている主な価値あるデータは以下である。

- Agent/Session/Tool/File/MCP/Shell などの Hook イベント
- 会話 ID、生成 ID、モデル、Cursor バージョン、ワークスペース、ユーザー
- Agent 応答/停止時の input/output/cache read/cache write tokens
- セッション時間、コンテキスト使用率、プロンプト、ツール実行、編集イベント

一方で、Primary ユーザーである Cursor Pro/Pro+/Ultra の個人開発者が知りたい「今月どれくらい使っているのか」「どの使い方が高コストなのか」「次に何を変えればよいのか」は、まだ Hook イベント一覧から自力で読み解く必要がある。

## 次に企画すべき機能候補 3つ

### 候補1: Hook トークン消費・推定コスト サマリーダッシュボード

- **概要**: Hooks で取得済みの Agent token usage を日次/月次、モデル別、ワークスペース別、モード別に集計し、外部化された料金テーブルで推定コストへ変換する。
- **対象ユーザー**: Primary: Pro/Pro+/Ultra 個人開発者。Secondary: 小規模チーム管理者。
- **解決する課題**: イベントログはあるが、月間消費ペース・高コスト要因・予算超過可能性が一目で分からない。
- **価値**: 非公式 API 依存を増やさず、既存の Hooks データから即時にコスト可視化価値を出せる。
- **MVP適性**: 高。既存 DB と Hook token fields を活用でき、技術リスクが比較的低い。

### 候補2: セッション別コスト診断・振り返り

- **概要**: conversation/session 単位で、投入プロンプト、Agent ループ数、ツール呼び出し、編集成果、トークン消費をまとめ、重いセッションを振り返れるようにする。
- **対象ユーザー**: 長時間 Agent/Composer を使う個人開発者、チーム管理者。
- **解決する課題**: 「どの作業が高くついたのか」「高コストだったが成果があったのか」が分からない。
- **価値**: コストだけでなく、開発成果や失敗セッションと結びつけて次の行動を考えられる。
- **MVP適性**: 中。conversationId で集約できるが、成果判定・プロンプト秘匿・編集内容の扱いにUX/セキュリティ判断が必要。

### 候補3: 料金テーブル健全性・データ信頼性ステータス

- **概要**: 料金テーブルの最終更新日、未知モデル、コスト推定不能イベント、Hook 送信失敗、DB保存失敗、Cursor バージョン変化を可視化する。
- **対象ユーザー**: 個人開発者、運用を担うチーム管理者。
- **解決する課題**: 非公式/変化しやすいデータ取得では、表示されたコストをどこまで信じてよいか分からない。
- **価値**: コスト可視化の透明性と安心感を高め、Cursor 仕様変更時の早期検知につながる。
- **MVP適性**: 中。単独ではユーザー価値がやや間接的だが、コストサマリーと組み合わせると信頼性が大きく上がる。

## 最優先機能

最優先は **候補1: Hook トークン消費・推定コスト サマリーダッシュボード** とする。

理由:

- Primary ユーザーの最重要課題である「Cursor 利用量・コストを把握したい」に直結する。
- 既存実装の Hook 収集基盤、PostgreSQL、Prisma、Next.js ダッシュボードを活かせる。
- 非公式 API への追加依存を避けられ、Cursor 仕様変更リスクを抑えやすい。
- Post-MVP でセッション診断、アラート、チーム集計、公式 API 連携へ拡張しやすい。

---

# PRD: Hook トークン消費・推定コスト サマリーダッシュボード

## 1. ユーザー課題

### Primary: Cursor Pro/Pro+/Ultra の個人開発者

- **誰が**: 毎日 Cursor Agent/Composer/Chat を使う個人開発者。
- **場面**: 月の途中、長時間 Agent を走らせた後、モデルやモードを切り替えた後、Cursor の請求や残クレジットが気になったとき。
- **困りごと**:
  - Cursor 側の表示だけでは、どの作業・モデル・日付で消費が増えたのか分かりにくい。
  - Pro/Pro+/Ultra の含有枠に対して、今月のペースが安全なのか判断しづらい。
  - 高コストな使い方を見つけても、次に「モデルを変える」「Agent を分割する」「コンテキストを整理する」などの行動に落とし込みにくい。

### Secondary: チーム管理者

- **誰が**: 小規模チームで Cursor 利用状況を把握したい管理者。
- **場面**: チームメンバーのローカル利用傾向を見たい、将来的な Business/Enterprise API 連携前に可視化仮説を検証したいとき。
- **困りごと**:
  - Enterprise API 前提のツールは導入ハードルが高く、個人/小規模チームの実利用に合わない。
  - 誰がどのプロジェクトでどれだけ使っているかを、ローカルファーストで安全に把握しづらい。

## 2. 企画する機能

### 機能名

Hook トークン消費・推定コスト サマリーダッシュボード

### 概要

Hooks で保存済みの Agent/Session イベントからトークン消費を集計し、料金テーブルを用いて推定コストを算出する。ダッシュボードトップに「今月の推定消費額」「今日の消費」「月末予測」「高コストモデル/ワークスペース/セッション」を表示し、ユーザーが次の最適化行動を取りやすくする。

### 対象ユーザー

- Primary: Cursor Pro/Pro+/Ultra の個人開発者
- Secondary: チーム管理者、小規模チームの技術リード

### 提供価値

- 月間消費状況を一目で把握できる。
- 高コストの原因をモデル・ワークスペース・日付・セッション単位で特定できる。
- 「このままだと月末にどれくらい使うか」という見通しを持てる。
- 公式 API がなくても、ローカル Hooks から取得できるデータだけで安全に価値を出せる。
- `chargedCents` がない場合も、外部化された料金テーブルに基づく「推定値」として透明に表示できる。

## 3. ユースケース

### シナリオ1: 月中に消費ペースを確認する

1. 個人開発者がローカルで `pnpm dev` を起動し、ダッシュボードを開く。
2. トップ画面で「今月の推定コスト」「今月のリクエスト/応答回数」「月末予測」を確認する。
3. 予測がプラン含有枠を超えそうな場合、モデル別内訳を見て、消費の大きいモデルを把握する。
4. 次の作業では高コストモデルの常用を避ける、Agent のタスク粒度を小さくするなどの行動を取る。

### シナリオ2: 高コストだった日の原因を調べる

1. 日別グラフで特定の日の消費が突出していることに気づく。
2. その日のモデル別/ワークスペース別/セッション別ランキングを見る。
3. 特定ワークスペースの Agent セッションが大半を占めていたことを把握する。
4. 次回は長い会話を分割する、コンテキスト圧縮前に不要情報を整理する、必要なファイルだけを指定する。

### シナリオ3: 料金表・未知モデルの影響を理解する

1. ダッシュボードに「未知モデルがあるため一部コストは未推定」と表示される。
2. ユーザーは該当モデル名と未推定トークン量を確認する。
3. 料金テーブル更新が必要だと分かり、表示コストの信頼度を誤解せずに済む。

## 4. MVPスコープ

### 最初に作るもの

#### 画面

- ダッシュボードトップ `/`
  - 今月の推定コスト
  - 今日の推定コスト
  - 月末予測
  - 記録済み Agent 応答数
  - モデル別推定コスト Top 5
  - 日別推定コストの簡易一覧またはグラフ
  - 未知モデル/未推定コストの注意表示

- 詳細ページ `/usage`
  - 日付範囲フィルタ
  - モデル別集計
  - ワークスペース別集計
  - セッション/会話別 Top N
  - token種別内訳: input/output/cache read/cache write

#### API

- `GET /api/usage/summary?range=current-month|today|last-7-days|last-30-days`
- `GET /api/usage/daily?days=30`
- `GET /api/usage/models?days=30`
- `GET /api/usage/workspaces?days=30`
- `GET /api/usage/sessions?days=30&limit=20`

#### データ

- 既存の `hook_agent_events` を主データソースにする。
- コスト算出対象は、少なくとも以下のいずれかを持つ AgentEvent:
  - `inputTokens`
  - `outputTokens`
  - `cacheReadTokens`
  - `cacheWriteTokens`
- モデル名は `model` を優先し、サブエージェントの場合は必要に応じて `subagentModel` を補助情報として扱う。
- ワークスペースは `workspaceRoot` を利用する。
- セッション/会話単位は `conversationId` を利用する。
- 料金は外部化された `pricing/models.json` 相当の料金テーブルで算出する。

#### 表示ルール

- `chargedCents` が取得できない前提では、UI上で必ず「推定コスト」と表記する。
- 料金テーブルに存在しないモデルは $0 として黙って処理せず、「未推定」として件数・トークン数を表示する。
- 月末予測は、当月経過日数に対する単純日割り予測から始める。
- プラン上限はユーザー設定値として扱い、未設定時はプラン比較表示を出さない。

### MVPでは作らないもの

- Cursor 内部 API からの使用量同期
- Cursor アカウントへの認証・セッショントークン取得
- デスクトップ通知やメール通知
- 自動的なコスト最適化提案の生成
- Enterprise/Admin API 連携
- 複数ユーザーの権限管理
- プロンプト本文・ツール出力を使った詳細な内容分析
- 料金テーブルの自動更新

### Post-MVP

- 予算閾値アラート
- セッション別コスト診断ページ
- コンテキスト使用率とコスト増の相関表示
- CSV/JSON エクスポート
- 料金テーブル更新通知
- チーム/Business/Enterprise API 連携

### 将来拡張

- Cursor 公式 API が個人向けに公開された場合のデータソース切替
- `chargedCents` を優先する正確な課金額表示
- 複数メンバー・Billing Group 集計
- モデル変更や利用パターン改善のレコメンド

## 5. 成功指標

### 定量指標

- ダッシュボードトップ表示時、今月/今日/モデル別の推定コストが 1 秒以内に表示される。
- 記録済み Agent token event のうち、80%以上がモデル名とトークン値を持ち、集計対象になる。
- 料金テーブルに存在しない未知モデルの比率が、通常利用で 10% 未満に保たれる。
- ユーザーがトップ画面から高コスト要因の詳細に 2クリック以内で到達できる。
- 30日分の Hook データに対する集計 API が 500ms 以内に応答する。

### 定性指標

- ユーザーが「今月の消費ペースが安全か」をトップ画面だけで説明できる。
- ユーザーが「どのモデル/ワークスペース/セッションが高コストか」を特定できる。
- 推定値・未推定値・データ欠損の違いがUI上で明確で、誤解を生まない。
- ローカル保存・非公式 API 非依存のため、個人開発者が安心して使える。

## 6. 優先度

| 観点 | 評価 | 理由 |
|---|---:|---|
| Impact | 高 | プロダクトの中心価値であるコスト可視化に直結し、Primary ユーザーの頻度高い課題を解く。 |
| Confidence | 中-高 | 既に Hook token fields とDB保存基盤がある。一方で Cursor Hook のtokenイベント網羅性とモデル名の安定性には検証が必要。 |
| Effort | 中 | 集計API、料金テーブル整備、UI追加が必要。内部API同期や認証実装よりは低リスク。 |

総合優先度: **P0**

判断:

- コスト可視化の価値が最も高い。
- ユーザーが次の行動を取りやすくなる。
- 既存の Hooks 収集方針に沿い、データ取得の透明性を保てる。
- 個人開発者がローカルで安心して使える。
- 将来のチーム利用・公式 API 連携時にも、同じ集計/表示レイヤーを再利用しやすい。

## 7. リスクと対策

| リスク | 影響 | 対策 |
|---|---|---|
| Cursor Hooks の仕様変更 | token fields や event name が変わり、集計不能になる | 未知フィールドを破棄しない、event/schema version を記録、集計対象外イベント数を表示する。 |
| token usage が一部イベントで欠損 | 実際より低い推定コストになる | 「記録済みtokenに基づく推定」と明記し、token欠損イベント数を表示する。 |
| 料金体系変更 | 推定コストが古くなる | 料金テーブルを外部化し、最終更新日・未知モデル・未推定比率をUIに出す。 |
| `chargedCents` がない | 正確な請求額とずれる | MVPでは「推定コスト」に限定し、将来 `chargedCents`/公式APIが得られた場合は優先する。 |
| 非公式 API 利用リスク | ToS・仕様変更・認証周りのリスク | MVPでは内部 API 依存を増やさず、Hooks ローカル収集のみで価値を出す。 |
| セキュリティ/プライバシー | prompt、toolInput、toolOutput、workspaceRoot に機微情報が含まれる | コスト集計では本文を使わない。表示は必要最小限にし、将来はマスキング/保存無効化設定を用意する。 |
| ワークスペース名の露出 | 画面共有時にプロジェクト名が見える | basename 表示を基本にし、フルパスは詳細表示または設定で切替可能にする。 |
| 重複イベント | コストが二重計上される | conversationId/generationId/hookEventName/loggedAt の重複検知方針を検討し、集計対象イベントを明確に限定する。 |
| UXの過信 | 推定値を請求額として誤解する | ラベル、ヘルプテキスト、未推定表示で信頼度を明示する。 |
| 運用負荷 | 料金テーブル更新が放置される | 未知モデル検出を目立たせ、更新すべきモデル名をコピーできるようにする。 |

## 8. 開発チームへの要求

### 画面要件

#### ダッシュボードトップ `/`

- 既存の Hook Events Dashboard を、利用量サマリー中心のトップに更新する。
- 表示項目:
  - 今月の推定コスト
  - 今日の推定コスト
  - 月末予測
  - 集計対象 Agent token events 数
  - モデル別推定コスト Top 5
  - 日別推定コスト
  - 未知モデル/未推定コストの警告
- 既存の Hook event count への導線は残す。

#### 詳細ページ `/usage`

- 日付範囲選択: today / last 7 days / last 30 days / current month
- タブまたはセクション:
  - Models
  - Workspaces
  - Sessions
  - Data Quality
- 各表は cost desc で並べる。
- token種別内訳を表示する。

### API要件

#### `GET /api/usage/summary`

入力:

- `range`: `today` | `last-7-days` | `last-30-days` | `current-month`

出力:

- `estimatedCostCents`
- `eventCount`
- `inputTokens`
- `outputTokens`
- `cacheReadTokens`
- `cacheWriteTokens`
- `projectedMonthEndCostCents`
- `unknownModelCount`
- `unknownModelTokens`
- `generatedAt`

例外:

- 不正な `range` は 400。
- DB接続失敗は 500。

#### `GET /api/usage/models`

入力:

- `days`: number

出力:

- `model`
- `estimatedCostCents`
- `eventCount`
- `inputTokens`
- `outputTokens`
- `cacheReadTokens`
- `cacheWriteTokens`
- `isKnownPricing`

#### `GET /api/usage/workspaces`

入力:

- `days`: number

出力:

- `workspaceRoot`
- `workspaceName`
- `estimatedCostCents`
- `eventCount`
- `topModel`

#### `GET /api/usage/sessions`

入力:

- `days`: number
- `limit`: number

出力:

- `conversationId`
- `startedAt`
- `lastEventAt`
- `workspaceName`
- `model`
- `estimatedCostCents`
- `eventCount`
- `inputTokens`
- `outputTokens`

### データ/集計要件

- 集計対象は `hook_agent_events` の token fields が1つ以上存在する行に限定する。
- 同じ `conversationId` 内で複数 `afterAgentResponse` が存在する場合は、行ごとのtokenを合算する。
- `stop` イベントにもtokenがある場合、二重計上の可能性を検証し、MVPでは以下のいずれかに統一する。
  - `afterAgentResponse` を優先し、なければ `stop` を使う。
  - または `stop` のみを合算対象にする。
- どちらを採用したかを実装チケットで明記する。
- モデル料金が存在しない場合は `estimatedCostCents` に含めず、unknown metrics に分離する。
- 料金単位は cents で返し、UIでドル表示に変換する。

### 状態・設定

- プラン上限:
  - `Config` に `plan.monthlyBudgetCents` を保存できるようにする。
  - 未設定時はプラン上限との比較を非表示にする。
- 料金テーブル:
  - `pricing/models.json` を作成/整備し、モデル別 input/output/cache read/cache write 単価を保持する。
  - 最終更新日または version を含める。
- データ品質:
  - unknown model
  - token missing event
  - pricing table missing
  - last hook event time
  をUIで表示する。

### 例外ケース

- データがない:
  - セットアップ手順と Hooks が動作しているかの確認導線を表示する。
- 料金テーブルがない/壊れている:
  - コスト表示を止め、token 集計のみ表示する。
  - UIに復旧方法を表示する。
- 未知モデルのみ:
  - コストを $0 と見せず、未推定として表示する。
- 日付範囲が未来/異常:
  - APIで 400 を返す。
- 大量データ:
  - API は limit と日付範囲を必須にし、ページングまたは上位N件に限定する。

### 非機能要件

- ローカル実行前提で、外部送信を追加しない。
- prompt/tool output をコスト集計APIのレスポンスに含めない。
- 集計 API は 30日分のデータで 500ms 以内を目標にする。
- Prisma クエリは `loggedAt`, `model`, `workspaceRoot`, `conversationId` のインデックス利用を考慮する。
- UIではすべて「estimated / 推定」であることを明示する。

## 実装チケット案

1. `pricing/models.json` の追加と pricing loader の整備
2. Hook Agent token usage 集計関数の追加
3. usage summary/model/workspace/session API Routes の追加
4. トップページを推定コストサマリー中心に更新
5. `/usage` 詳細ページの追加
6. unknown model / data quality 表示の追加
7. plan monthly budget 設定の保存・表示
8. 集計ロジックの単体テストと API の基本テスト

