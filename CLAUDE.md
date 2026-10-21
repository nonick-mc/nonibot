# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 概要

nonibot(Discord BOT + Webダッシュボード)の v6 モノレポ。pnpm workspaces + Turborepo。Node >=22、pnpm 10。レビューや応答は日本語で行う(PRレビューも日本語)。コミットメッセージは `type(scope): 日本語の説明` の1行(`.claude/commands/commit.md` 参照)。

`README.md` は旧構成(`apps/dashboard`, `packages/bot`)の記述が残っており、現状とは異なる。

## コマンド

ルートの `package.json` に各ワークスペース用のショートカットがある(`pnpm bot <cmd>`, `pnpm web <cmd>`, `pnpm database <cmd>`)。

- `pnpm dev` / `pnpm build`: 全ワークスペースを turbo で実行
- Bot: `pnpm bot dev`(tsx watch)、`pnpm bot build`(`tsc --noEmit && tsdown`)、`pnpm bot lint`(= `tsc --noEmit`、型チェックのみ)
- Web: `pnpm web dev` / `pnpm web build`
- DB: `pnpm database generate`(マイグレーション生成)、`migrate`、`push`、`studio`
- Lint/Format: `npx biome check --write <対象パス>`。**リポジトリ全体や `apps` 全体には実行しない**(無関係なファイルが大量に書き換わる)。変更したファイル/ディレクトリだけを指定する
- テストは存在しない

環境変数は `apps/bot/.env` と `apps/web/.env.local`(それぞれ `.env.sample` 参照)。

## アーキテクチャ

- `apps/bot`: discord.js + [sunar](https://www.npmjs.com/package/sunar)。`src/index.ts` が `src/app/**/*.{mjs,ts}` を glob で自動ロードするので、機能の登録処理は不要で、ファイルを置くだけでよい。
  - `src/app/features/<feature>/signals/*.ts`: イベントハンドラ(`new Signal(Events.X)` + `execute(signal, …)`)。ボタン・モーダル・コンテキストメニューも `features/<feature>/` 配下に置く。
  - `src/api`: Hono製の**内部APIサーバー**。Webが Bearer シークレットで叩き、ギルドのロール/チャンネル/絵文字/メンバー情報(Botのキャッシュ由来、チャンネルは Bot の権限 `bot_permissions` 付き)を返す。
  - `src/constants/emoji.ts`: アプリケーション絵文字の名前定義(`getAppEmoji`)。
  - `src/lib/webhook.ts`: イベントログ用Webhookの取得・作成・送信(DBの `webhook` テーブルで管理)。
- `apps/web`: Next.js(App Router)+ better-auth + fumadocs。
  - `src/app/dashboard/guilds/[guildId]/<feature>/`: 機能ごとの設定ページ。典型は `page.tsx`(Server Component、`verifyDashboardAccessPermission` → DB と内部APIから取得)、`form.tsx`(react-hook-form)、`schema.ts`(drizzle-zod)、`action.ts`(`guildActionClient` による Server Action、保存後に `insertSettingAuditLog`)の4点セット。
  - Discord情報は Discord API ではなく Bot の内部API経由で取得する(`src/lib/discord/api.ts`)。
  - `src/components/rhf/*`: react-hook-form 用の Controlled* ラッパー。`src/components/ui`(shadcn)・`reui`(ReUI)・`discord`(チャンネル/ロール選択など)。
  - ドキュメントは `content/docs/features/*.mdx`(`meta.json` に登録が必要)。
  - `apps/web/AGENTS.md`: この Next.js は既知のものと破壊的変更があるため、実装前に `node_modules/next/dist/docs/` を確認する。
- `packages/database` (`@repo/database`): drizzle-orm のスキーマとマイグレーション(`drizzle/`)。設定テーブルは `public_setting` スキーマ(`src/schema/setting.ts`)。監査ログの対象名は `src/schema/audit-log.ts` の列挙に追加が必要。
- `packages/shared` (`@repo/shared`): Bot↔Web 共通の型(内部APIのレスポンス型など)。
- `packages/placeholders` (`@repo/placeholders`): メッセージのプレースホルダー定義。

`@repo/*` はビルド成果物(`dist`)を参照するので、パッケージ側を変更したら `pnpm database build` などで再ビルドするか、`dev`(`tsc --watch`)を動かす。

## 新しい機能(設定)を追加する流れ

1. `packages/database` にスキーマ追加 → `pnpm database generate`。**既存行がある表に NOT NULL カラムを足す場合**は、生成SQLを「`DEFAULT` 付きで追加 → `DROP DEFAULT`」に手で書き換える(スキーマ側に DEFAULT を持たせない方針のため)。
2. 監査ログの `targetName` に追加。
3. Bot: `features/<feature>/signals/` にハンドラを置く。
4. Web: 上記4点セットのページを作り、`sidebar-navigation-items.tsx` に項目を追加。
5. ドキュメントを `content/docs/features/` に追加し `meta.json` に登録。
