---
description: 変更内容を確認し、Conventional Commits 形式でステージしてコミットする。
---

# commit

## 目的

現在の作業ツリーの変更を把握し、**1 コミット＝1 意図**になるよう整理してから `git commit` まで実行する。

## 手順

1. `git status -sb` と `git diff`（必要なら `git diff --staged`）で変更を確認する。
2. コミットに含める範囲を決め、`git add` でステージする（全体なら `git add -A`、追跡ファイルのみなら `git add -u`）。
3. メッセージは **Conventional Commits**（英語プレフィックス + 簡潔な説明）とする。例:
   - `feat: ...` 機能追加
   - `fix: ...` バグ修正
   - `chore: ...` ツール・設定・依存
   - `docs: ...` ドキュメントのみ
   - `refactor: ...` 挙動を変えない整理
4. 次でコミットする（メッセージは実際の変更に合わせて書き換える）:

```bash
git commit -m "feat: short English summary of the change"
```

5. 作業ツリーがクリーンか `git status` で確認する。

## 制約

- シークレット（`.env` の実値、API キーなど）をコミットに含めない。
- ユーザーが「コミットしない」「メッセージだけ」など別指示を出した場合はそれに従う。
- 変更がない場合はコミットせず、その旨を伝える。
