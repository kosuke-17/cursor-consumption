# Cursor Token消費量トラッキングツール - 要件定義書

## 1. プロジェクト概要

### 1.1 背景

Cursor（AIコードエディタ）は2025年6月に従来のリクエスト回数制課金からクレジットベースの従量課金モデルへ移行した。これにより、利用者にとってトークン消費量とコストの把握がより複雑になった。

現状の課題:
- Cursorエディタ内の使用量表示は簡易的で、詳細なトークンレベルのブレイクダウンが見づらい
- `cursor.com/settings` のWebダッシュボードはリアルタイム性に欠け、過去データの分析が困難
- 個人ユーザー向けの公式使用量APIは存在しない（Admin API/Analytics APIはEnterprise/Teams専用）
- モデル別・機能別（Tab補完、Chat、Agent、Composer等）のコスト最適化の判断材料が不足している

### 1.2 プロジェクト目標

Cursorのトークン消費量をリアルタイムで追跡し、コスト分析・可視化を行うツールを開発する。

### 1.3 ターゲットユーザー

- **Primary**: Cursor Pro/Pro+/Ultraプランの個人開発者
- **Secondary**: Cursor Business/Enterpriseのチーム管理者

---

## 2. 市場調査・競合分析

### 2.1 既存ツール一覧

| ツール名 | 形態 | アプローチ | 長所 | 短所 |
|---------|------|-----------|------|------|
| [cursor-usage-monitor](https://github.com/lixwen/cursor-usage-monitor) | VS Code拡張 | ローカルSQLiteからセッショントークン取得→API呼び出し | 自動認証、ステータスバー表示 | 詳細分析なし、履歴保存なし |
| [cursor-price-tracking](https://github.com/Ittipong/cursor-price-tracking) | VS Code拡張 | WorkosCursorSessionToken→API | 24hスナップショット、モデル別表示 | 長期トレンドなし |
| [cursor-usage-tracker](https://github.com/ofershap/cursor-usage-tracker) | Webダッシュボード | Enterprise Admin API | 異常検知、チーム管理、豊富な分析 | Enterprise限定 |
| [CursorLens](https://github.com/HamedMP/CursorLens) | プロキシ | OpenAI Base URLオーバーライド | リクエスト内容を完全記録 | セットアップが複雑 |
| [tokscale](https://github.com/junhoyeo/tokscale) | CLI | API同期+ローカルキャッシュ | 複数AIツール対応、Rust高速処理 | Cursor専用機能は限定的 |
| [Cursor Usage Widget](https://cursorusage.com/) | macOSアプリ | Cursor API直接認証 | ネイティブUI、メニューバー常駐 | macOS限定、クローズドソース |

### 2.2 差別化ポイント

既存ツールが満たしていないニーズ:
1. **履歴データの蓄積と長期トレンド分析** — 既存ツールの多くはリアルタイムスナップショットのみ
2. **コスト予測・予算アラート** — 月末のコスト予測と閾値アラート
3. **個人ユーザー向けの包括的ダッシュボード** — Enterprise APIに依存しないアプローチ
4. **セッション単位の分析** — どの作業セッションでどれだけ消費したかの可視化
5. **クロスプラットフォーム対応** — macOS/Windows/Linux

---

## 3. 機能要件

### 3.1 コア機能 (MVP)

#### F-01: 使用量データの自動取得
- CursorのローカルSQLiteデータベースからセッショントークンを自動取得
- Cursor内部APIを呼び出し、使用量データを取得
- 設定可能なポーリング間隔（最小60秒）で自動更新

#### F-02: リアルタイム使用量表示
- 当日の消費クレジット額（ドル表示）
- 当月の累計消費額と残りクレジット
- プラン上限に対する消費割合（プログレスバー）

#### F-03: モデル別使用量ブレイクダウン
- 使用モデルごと（Claude Sonnet, GPT-4o, etc.）のトークン数・コスト表示
- 入力/出力/キャッシュ読み取りトークンの内訳
- モデル別のコスト効率比較

#### F-04: 機能別使用量ブレイクダウン
- Tab補完、Chat、Agent、Composer、Ask Mode等の機能別集計
- 各機能のリクエスト数とトークン消費量

#### F-05: 履歴データの保存
- 取得した使用量データをPostgreSQLに保存
- 日次・週次・月次のサマリーデータ生成

### 3.2 拡張機能 (Post-MVP)

#### F-06: コスト予測・アラート
- 現在の消費ペースに基づく月末コスト予測
- 設定した閾値を超えた場合のデスクトップ通知

#### F-07: 長期トレンド分析ダッシュボード
- 日別・週別・月別の使用量推移グラフ
- モデル別使用量のトレンド変化
- コスト最適化の提案（高コストモデルの過剰使用検出等）

#### F-08: セッション分析
- プロジェクト/ワークスペース単位の消費量割り当て
- 時間帯別の使用パターン分析

#### F-09: Enterprise/Teams API連携
- Cursor Admin API対応（`/teams/filtered-usage-events` 等）
- チームメンバーの使用量一覧・比較
- Billing Groupごとの集計

#### F-10: エクスポート機能
- CSV/JSONエクスポート
- 経費精算用レポート生成

---

## 4. 非機能要件

### 4.1 パフォーマンス
- APIポーリングはバックグラウンドで非同期実行し、UIをブロックしない
- ダッシュボードのページ読み込みは1秒以内
- 集計クエリのレスポンス: 1年分のデータに対して500ms以内

### 4.2 セキュリティ
- Cursorセッショントークンはアプリ内でのみ使用し、PostgreSQLに保存しない
- `DATABASE_URL` は `.env` で管理しリポジトリにコミットしない
- ログにトークンやプロンプト内容を記録しない

### 4.3 互換性
- macOS 13+、Windows 10+、Linux（Ubuntu 22.04+）
- Node.js 20 LTS以上
- Cursorバージョン更新への追従（セッショントークン取得方法の変更に対応する抽象化層）

### 4.4 保守性
- Cursorの内部API変更に対する耐性（API応答スキーマのバリデーション、変更検知）
- セッショントークン取得ロジックの差し替え可能な設計

---

## 5. データソース詳細

### 5.1 個人ユーザー向けデータ取得フロー

```
Cursorローカル SQLite DB
(~/Library/Application Support/Cursor/User/globalStorage/state.vscdb)
  ↓ セッショントークン抽出
Cursor内部API (api2.cursor.sh)
  ↓ 使用量データ取得
PostgreSQL に蓄積
  ↓
ダッシュボードで可視化
```

#### 認証トークン
- **保存場所**: `~/Library/Application Support/Cursor/User/globalStorage/state.vscdb` (SQLite)
- **キー名**: `WorkosCursorSessionToken` 関連エントリ
- **代替手段**: ブラウザCookieからの手動取得（`cursor.com/settings`）

#### 利用API（推定）
- **使用量取得**: `api2.cursor.sh` 配下の使用量エンドポイント
- **認証確認**: `/api/auth/stripe` エンドポイント（課金タイプ判定）
- **プロトコル**: REST/JSON + gRPC (AIリクエスト)

### 5.2 Enterprise/Teams向けデータ取得フロー（拡張機能）

```
Cursor Admin API (api.cursor.com)
  Basic Auth (Admin API Key)
  ↓
POST /teams/filtered-usage-events  ← 最も詳細（トークン単位、chargedCents付き）
POST /teams/daily-usage-data       ← 日次集計
POST /teams/spend                  ← 課金サイクルの支出
GET  /analytics/team/models        ← モデル別使用量
GET  /analytics/team/agent-edits   ← Agent編集メトリクス
GET  /analytics/team/tabs          ← Tab補完メトリクス
  ↓
PostgreSQL に蓄積
  ↓
ダッシュボードで可視化
```

---

## 6. 料金モデル対応仕様

### 6.1 Cursorの現行課金体系（2026年4月時点）

| プラン | 月額 | API予算 | Auto+Composer |
|-------|------|---------|---------------|
| Pro | $20 | $20含む | 大幅な使用量含む |
| Pro+ | $60 | $70含む | 大幅な使用量含む |
| Ultra | $200 | $400含む | 大幅な使用量含む |

### 6.2 トークン料金体系

**Auto + Composerプール**:
| トークン種別 | 料金 (per 1M tokens) |
|-------------|---------------------|
| Input + Cache Write | $1.25 |
| Output | $6.00 |
| Cache Read | $0.25 |

**APIプール**: モデル個別料金（モデルごとに異なる）

**Max Mode**: 通常料金に20%上乗せ

### 6.3 コスト計算ロジック

ツール内で以下の計算を行う:
1. APIレスポンスに `chargedCents` が含まれる場合はそれを使用（最も正確）
2. 含まれない場合: `(input_tokens * input_rate + output_tokens * output_rate + cache_read_tokens * cache_rate) / 1_000_000`
3. モデル別料金テーブルはリモート更新可能な設計（Cursor料金変更への追従）

---

## 7. リスクと対策

| リスク | 影響度 | 対策 |
|-------|-------|------|
| Cursor内部APIの仕様変更 | 高 | APIレスポンスのスキーマバリデーション、変更検知アラート、cursor-usage-monitor等OSSの動向ウォッチ |
| セッショントークン取得方法の変更 | 高 | トークン取得ロジックの抽象化、複数取得方法の並行サポート（SQLite + 手動入力） |
| Cursor利用規約への抵触 | 中 | 非公式APIの利用は最小限に、データはローカルのみ保存、公式API公開時の移行パスを用意 |
| 料金体系の変更 | 中 | 料金テーブルの外部設定ファイル化、更新通知の仕組み |

---

## 8. 開発フェーズ

### Phase 1: MVP（CLIツール）
- セッショントークン自動取得
- 使用量データ取得・表示（コンソール出力）
- PostgreSQL保存
- 基本的なコスト計算

### Phase 2: Webダッシュボード
- Next.jsベースのダッシュボード
- モデル別・機能別のグラフ表示
- 日別トレンド

### Phase 3: 拡張機能
- コスト予測・アラート
- Enterprise API連携
- エクスポート機能
