---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*), AskUserQuestion
description: Create a git commit
---

## Context

- Current git status: !`git status`
- Current git diff (staged and unstaged changes): !`git diff HEAD`
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -10`

## Your task

変更内容を分析し、3つのコミットメッセージ候補を生成してユーザーに選択させます。

1. **変更の分析**: diffとgit statusから変更の種類・影響範囲・目的を把握
2. **スコープの判定**: 変更されたファイルのパスから影響範囲を判定
   - 変更が `apps/<name>/` 配下のみ → スコープは `<name>`（例: `web`, `bot`）
   - 変更が `packages/<name>/` 配下のみ → スコープは `<name>`（例: `database`, `placeholders`, `shared`）
   - 2つ以上のプロジェクト/パッケージにまたがる、またはルート直下のファイルのみ等 → スコープは省略
3. **候補の生成**: 異なる視点で3つのメッセージを作成
   - 形式: `type(スコープ): 説明`（スコープ省略時は `type: 説明`）
   - typeはConventional Commits形式（feat/fix/docs/refactor/chore/test/style/perf/build/ci等）
   - 日本語で記述（type・スコープは英語）
   - 各候補は異なる詳細度や視点を提供（例: 技術的詳細重視、ビジネス価値重視、シンプル表現）
   - スコープと type は3候補で原則そろえ、説明文のみ変える
4. **ユーザー選択**: AskUserQuestionで3候補を提示し選択を受ける
   - 各選択肢の `label` に視点（例: `シンプル表現`）、`description` にコミットメッセージ全文を入れる
   - `preview` は使わない（左右分割の表示になり、メッセージが途中で切れるため）
5. **コミット実行**: 必要に応じてgit addし、選択されたメッセージでコミット

## コミットメッセージの例

- `feat(web): ダッシュボードにメンバー認証の設定ページを追加`
- `fix(bot): 認証ボタン押下時にロールが付与されない問題を修正`
- `feat(database): メンバー認証の設定テーブルにログ用Columnを追加`
- `refactor: DiscordMessageの値の受け渡しをリファクタリング`（複数プロジェクトに影響するためスコープなし）

## Constraint

- Claude co-authorshipフッターは不要
- メッセージは日本語（type・スコープのみ英語）
- 1行で完結（本文なし）
