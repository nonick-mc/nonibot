# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

`apps/web` 固有の事項。リポジトリ全体の構成、新機能(設定)の追加手順、コミット規約はルートの `CLAUDE.md` を参照。

## コマンド

- `pnpm web dev` / `pnpm web build`(ルートから)。`lint` と `test` のスクリプトはない
- 型チェック: `npx tsc --noEmit`(`apps/web` で実行)
- Lint/Format: `npx biome check --write <変更したパス>`(ルートから。リポジトリ全体には実行しない)
- 新しいルートを追加したら `npx next typegen` を実行する。`typedRoutes` が有効で、`PageProps<'/dashboard/...'>` や `Route` の型がこれで生成される。生成前は `PageProps` が `unknown` になる
- 動的な `router.push` / `href` の文字列は `as Route` が必要
- shadcn / ReUI の追加は `npx shadcn@latest add <name>`。既存の `components/ui` を上書きしないよう、上書き確認には `n` を答える(`yes n | npx shadcn@latest add ...`)

## アクセス制御の流れ

ダッシュボードの権限チェックは3層あり、新しいページや Server Action は同じ流れに乗せる。

1. `src/proxy.ts`: セッションクッキーの有無と、`guildId` が Snowflake かどうかだけを見る(`/dashboard/*`、`/verify/guilds/*`)
2. `page.tsx` の冒頭で `verifyDashboardAccessPermission(guildId)`(`lib/dal.ts`)。サーバーの所有者、または `ManageGuild` / `Administrator` を持つメンバーのみ通過し、DB にギルドが登録済みであることも必要。それ以外は `/dashboard` にリダイレクトする
3. Server Action は `guildActionClient`(`lib/safe-action/client.ts`)で作る。第1の bind 引数が `guildId` で、`authMiddleware`(10秒あたり5回のレート制限、`ctx.session`)と `guildPermissionMiddleware`(2と同じ `canAccessDashboard`)が自動で効く。ユーザー本人向けの操作は `memberActionClient`

ユーザー向けのエラー文は `ActionClientError` を投げる(それ以外の例外は汎用メッセージに置き換わる)。

## Discord 情報の取得

Web から Discord API を直接叩いてギルド情報を取ることはしない。`lib/discord/api.ts` の `internalFetch` が Bot の内部API(`INTERNAL_API_URL`)に Bearer で問い合わせ、ロール・チャンネル・絵文字・メンバー・ユーザーを返す。`React.cache` 済みなので、同じリクエスト内の重複呼び出しは1回にまとまる。例外はログインユーザー本人の OAuth トークンで取るギルド一覧(`getUserGuilds`)。Bot 側のルートを足したら、`packages/shared` の型を変更して `pnpm -C packages/shared build` する。

## メッセージの編集・プレビュー

`components/discord/` に Components V2 のエディタとプレビューがある。`preview/message.tsx` の `DiscordMessage` は `PreviewResourcesContext`(ロール・チャンネル・プレースホルダー)を `resources` で受け取り、メンションを名前に解決して描画する。メッセージを持つ設定を追加するときは、フォームの `Watch` で `DiscordMessage` を並べる既存パターン(`leave-message/form.tsx` など)に倣う。

## 監査ログ(`dashboard/guilds/[guildId]/audit-log/`)

- 書き込みは各機能の `action.ts` から `lib/audit-log.ts` の `insertSettingAuditLog`(設定の更新)か、`auditLog` への直接 insert(ルール・カスタムメッセージ等)で行う。`before` / `after` は jsonb で、機能ごとに形が違う(DB の行そのもの、`{ name, steps }` など)
- 詳細 Sheet の文章は `describe.ts` が `before`/`after` から作る。**ラベルは `targetLabels`(機能 × キー)にあるものだけが表示され、ないキーは「不明な設定」になる**。設定のカラムを足す・名前を変えるときは、ここに各フォームの `FieldLabel` と同じ文言を追加する。チャンネル・ロール・enum の値の整形も同じファイルにある(`ChannelKeys` / `RoleKeys` / `enums`)
- 絞り込み(`?user=&target=&action=`)とページ(`?page=&pageSize=`)はすべて URL で持ち、`page.tsx` がサーバー側で `where` と `limit/offset` を組む。`user` の値は Discord のユーザーID
- 開発用に `?data=worst|empty|one` で `worst-case.ts` のデータへ差し替えられる(`NODE_ENV === 'development'` のときだけ、動的 import)。新しい表示を足したら、このデータで長い値・空・削除ログの見え方を確認する
- ログの保持日数は `@repo/shared/constants` の `AuditLogRetentionDays`。Bot の cron(`apps/bot/.../core/signals/ready/audit-log.ts`)と説明文で共有している

## データグリッド

一覧表は ReUI の DataGrid(`components/reui/data-grid`、TanStack Table v9)を使う。必要なファイルだけを残していて、列フィルタ・DnD・仮想化・セル選択は入れていない。ページングを DB 側で行うときは `manualPagination: true` と `rowCount` を `useTable` に渡し、`DataGrid` の `recordCount` にも同じ総数を渡す。
