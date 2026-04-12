---
name: coding-principals
description: Review TypeScript code for quality, maintainability, and adherence to coding principles. Use when reviewing TypeScript code, examining code changes, or when the user asks for a code review based on coding principles.
---

# TypeScriptコードレビュー - コーディング原則

TypeScriptコードレビュー時に、コーディング原則に基づいてコードを評価します。

## レビュープロセス

1. **変更されたコードを分析**
   - 変更範囲を把握
   - 影響範囲を確認

2. **該当する原則ファイルを参照**
   - 関数/クラスの責務 → [solid.md](references/solid.md)
   - 重複コード → [dry.md](references/dry.md)
   - 複雑さの評価 → [kiss.md](references/kiss.md)
   - 過剰設計の検出 → [yagni.md](references/yagni.md)
   - 可読性・命名 → [readability.md](references/readability.md)
   - レイヤー分離・関心の分離 → [separation-of-concerns.md](references/separation-of-concerns.md)
   - 不変性・副作用管理 → [immutability.md](references/immutability.md)

3. **原則に基づいて評価**
   - 各原則の観点からコードをチェック
   - 違反パターンを特定
   - 改善提案を検討

4. **フィードバックを提供**

## フィードバックフォーマット

レビュー結果は以下の形式で提供：

- 🔴 **Critical**: マージ前に修正必須（バグ、セキュリティ、重大な設計問題）
- 🟡 **Suggestion**: 改善を推奨（可読性、保守性の向上）
- 🟢 **Nice to have**: 任意の改善（コード品質の微調整）

各フィードバックには：
- 該当する原則名
- 問題の説明
- 具体的なコード例（該当箇所）
- 改善案（可能な場合）

## チェックリスト

コードレビュー時に確認する観点：

- [ ] **SOLID原則**: 単一責任、開放閉鎖、リスコフ置換、インターフェース分離、依存性逆転
- [ ] **DRY**: 重複コードがないか
- [ ] **KISS**: シンプルで理解しやすいか
- [ ] **YAGNI**: 過剰な抽象化や将来の機能への過度な準備がないか
- [ ] **可読性**: 名前が適切か、説明なしで読めるか
- [ ] **関心の分離**: 責務が適切に分離されているか
- [ ] **不変性・副作用**: 副作用が適切に管理されているか

## 原則ファイルの参照

各原則の詳細は、同じディレクトリ内の対応するファイルを参照してください：

- [solid.md](references/solid.md) - 5つの設計原則
- [dry.md](references/dry.md) - 重複の排除
- [kiss.md](references/kiss.md) - シンプルさの維持
- [yagni.md](references/yagni.md) - 過剰設計の回避
- [readability.md](references/readability.md) - 可読性の確保
- [separation-of-concerns.md](references/separation-of-concerns.md) - 関心の分離
- [immutability.md](references/immutability.md) - 不変性と副作用管理
