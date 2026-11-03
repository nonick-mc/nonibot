# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`apps/bot` 固有の事項。リポジトリ全体の構成、新機能(設定)の追加手順、コミット規約はルートの `CLAUDE.md` を参照。

## コマンド

ルートから `pnpm bot <cmd>` で実行する。

- `pnpm bot dev`: `tsx watch src`
- `pnpm bot dev --register`: 起動後にスラッシュコマンド/コンテキストメニューをDiscordへ登録する(`ready/bootstrap.ts` が `process.argv` の `--register` を見る)。コマンドの定義を変えたときだけ付ける
- `pnpm bot lint`: `tsc --noEmit` のみ(型チェック。ESLint はない)。`pnpm bot build` は型チェックのあと `tsdown` で `dist/` に出力する
- `@repo/*` は `dist` を参照する(`tsdown` でも bundle せず external)。`packages/database` などを変更したら、そちらを再ビルドしてから確認する

環境変数は `.env`(`.env.sample` 参照)。`INTERNAL_API_SECRET` が未設定だと起動時に例外で落ちる。

## アーキテクチャ

エントリは `src/index.ts`。`Client`(intents は `MessageContent` や `GuildModeration` を含む)を作って `export` し、`src/app/**/*.{mjs,ts}` を [sunar](https://www.npmjs.com/package/sunar) の `load()` で自動ロードしてからログインする。**登録処理は不要で、ファイルを置くだけでよい。**

- `import { client } from '..'` のように `index.ts` の `client` を直接参照するコードがある(例: `constants/emoji.ts`)。循環 import に注意
- パスエイリアスは `@/*` → `src` 直下の1つ上の階層(`./*`)なので、`@/src/lib/db` のように **`src/` を含めて書く**
- `src/app/core/signals/`: 機能に依存しない基盤。`interaction-create.ts` が `handleInteraction` で全インタラクションを振り分け、`ready/bootstrap.ts` が絵文字のフェッチ→内部API起動→(任意で)コマンド登録を行う。`ready/audit-log.ts` は毎日 0:00(JST)に保持期間を過ぎた監査ログを削除する cron
- `src/app/commands/`: スラッシュコマンド(`new Slash` + `execute`)。`info/` のようにボタンやコンテキストメニューを同じディレクトリに置く
- `src/app/features/<feature>/`: 機能ごとに `signals/`(`new Signal(Events.X)` + `execute`)、`buttons/`、`modals/`、`contexts/`、`select-menus/` を持つ。設定は DB の `public_setting` スキーマから `db.query.<table>.findFirst` で読み、行がなければ何もせず `return` する
- `src/app/shared/`: 複数機能で使う処理。`protectors/perms.ts` の `memberPerms` / `appPerms` は sunar の `Protector` で、実行者や Bot の権限不足を共通の文言で返す(`protect(...)` でコマンドに付ける)
- `src/lib/db.ts`: `@repo/database` の全スキーマを渡した drizzle クライアント。`src/lib/placeholder.ts` は `@repo/placeholders` に渡すパラメーターを組み立てる。`src/lib/format.ts` に `successMessage` / `errorMessage` がある
- `src/lib/webhook.ts`: イベントログ・通報などの送信用 Webhook を、DB の `webhook` テーブル(チャンネル単位)で管理する。外部から削除されていた場合は記録を破棄して作り直し、**一度だけ再送**する
- `src/constants/emoji.ts`: Bot に登録されたアプリケーション絵文字の名前(`success_*` / `destructive_*` など)を型付きで定義し、`getAppEmoji` で取得する。キャッシュにない名前は `❌️` にフォールバックするため、絵文字を足すときは名前をここにも追加する

### 内部API(`src/api`)

Hono製。`ready` 時に `startApi(client)` が起動し、Web(`apps/web`)が `Authorization: Bearer <INTERNAL_API_SECRET>` で叩く。認証は SHA-256 に通した値の `timingSafeEqual` で比較しており、**全ルートに共通のミドルウェア**で行う。

- ギルド・ロール・チャンネル・絵文字・メンバー・ユーザーは Discord API ではなく **Bot のキャッシュ**(`client.guilds.cache` など)から返す。チャンネルには Bot の権限(`bot_permissions`)を含める
- レスポンスの整形は `serializers.ts`、型は `@repo/shared/types`。ルートを足す・返す形を変えるときは `packages/shared` の型も変更し、`pnpm -C packages/shared build` する(Web 側が同じ型を参照する)
- `GET /guilds?ids=a,b,c`(最大50件、不正なIDは400): 指定したサーバーの概要(名前・アイコン・オーナーID・メンバー数)を返す。管理者ページ用で、一覧・ページング・検索は Web が DB で行う。キャッシュにないIDは結果に含めない
- 送信系(`POST /guilds/:guildId/channels/:channelId/messages`)は、チャンネルが指定ギルドのものかを確認してから送る
- 待受は既定で `127.0.0.1:3001`(`INTERNAL_API_HOST` / `INTERNAL_API_PORT`)。listen に失敗するとプロセスごと終了する

## 実装上の注意

- `pnpm bot start` は `node dist/index.mjs`。`tsdown` は `src/**/*.ts` を1ファイルずつ `.mjs` として出力するので、ビルド後も `load()` が `dist/app/**/*.mjs` を拾う(`dist/app/` が出力されることを確認済み)。`src/index.ts` のグロブが `.{mjs,ts}` なのはこのため
- `assets/` は認証のキャプチャ画像(`features/verification/captcha.ts`、`@napi-rs/canvas`)で使うフォントを置く場所。パスは実行位置ではなく `root` から解決される
