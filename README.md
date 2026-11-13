<!-- PROJECT LOGO -->
<div align="center">
  <a href="https://github.com/nonick-mc/nonibot">
    <img src="https://cdn.nonick.net/nonibot/profile_dark.png" alt="Logo" width="80" height="80">
  </a>

<h3 align="center">nonibot</h3>
  <p align="center">
    Discordサーバーの運営をサポートする、次世代のDiscordBot
    <br />
    <a href="https://bot.nonick.net/docs"><strong>ドキュメントを見る »</strong></a>
    <br />
    <br />
    <a href="https://discord.gg/nonick-mc">サポートサーバー</a>
    &middot;
    <a href="https://github.com/nonick-mc/nonibot/issues/new?template=bug-report.yaml">バグを報告する</a>
    &middot;
    <a href="https://github.com/nonick-mc/nonibot/issues/new?template=new-feature.yaml">機能をリクエストする</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>目次</summary>
  <ol>
    <li><a href="#このプロジェクトについて">このプロジェクトについて</a></li>
    <li><a href="#使用技術">使用技術</a></li>
    <li>
      <a href="#はじめる">はじめる</a>
      <ul>
        <li><a href="#インストール">インストール</a></li>
      </ul>
    </li>
    <li><a href="#ロードマップ">ロードマップ</a></li>
    <li>
      <a href="#コントリビューション">コントリビューション</a>
      <ul>
        <li><a href="#主なコントリビューター">主なコントリビューター</a></li>
      </ul>
    </li>
    <li><a href="#ライセンス">ライセンス</a></li>
  </ol>
</details>

## このプロジェクトについて

![banner](https://cdn.nonick.net/nonibot/twitter-banner.png)

nonibotは、Discordサーバー運営のサポートに特化したDiscordBotです。  
コミュニティの雰囲気づくりに役立つ機能から、サーバーのモデレーションを支援する機能まで、サーバー運営に役立つ様々な機能を搭載しています。

* ⚡️ **モダンな構成**: Discord.js、Next.jsを使用して構築
* 🚀 **豊富な機能**: 様々な規模のサーバー運営をサポートする機能やコマンドを搭載
* 🔧 **高いカスタマイズ性**: サーバーのニーズに合わせて細かい設定が可能
* 🎨 **Webダッシュボード**: Botの設定変更に使用する、UI・UXに優れたダッシュボード

### 使用技術

![stack-diagram](https://cdn.nonick.net/nonibot/stack-diagram.png)

<!-- GETTING STARTED -->
## はじめる

これは、プロジェクトをローカル環境にセットアップする方法の一例です。
ローカルコピーを動作可能な状態にするには、以下の手順に従ってください。

### インストール

1. [Discord開発者ポータル](https://discord.com/developers/applications)から新たなアプリケーションを作成する
1. 作成したアプリケーションの`OAuth2`→`Redirect`に以下のURLを設定する

   ```
   http://localhost:3000/api/auth/callback/discord
   http://localhost:3000/api/invite/callback
   ```

1. [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/)からサイトキーとシークレットキーを取得する
1. リポジトリをクローンする

   ```sh
   git clone https://github.com/nonick-mc/nonibot.git
   ```

1. npmパッケージをインストールする

   ```sh
   pnpm install
   ```

1. それぞれの`.env.sample`をコピーし、環境変数を設定する

   ```sh
   cp apps/bot/.env.sample apps/bot/.env
   cp apps/web/.env.sample apps/web/.env.local
   cp packages/database/.env.sample packages/database/.env
   ```

1. 開発サーバーを起動する

   ```sh
   pnpm dev
   ```

## ロードマップ

[ロードマップ](https://github.com/users/nonick-mc/projects/2)では、今後追加予定の機能の概要や開発予定を確認することができます。  
提案されている機能（および既知の問題）の一覧については、[issues](https://github.com/nonick-mc/nonibot/issues)を確認してください。

<!-- CONTRIBUTION -->
## コントリビューション

プロジェクトをより良くするアイデアをお持ちの場合は、リポジトリをフォークしてプルリクエストを作成してください。あるいは、issueを作成して頂くだけでも構いません。

1. このリポジトリをフォークする
2. featureブランチを作成する (`git checkout -b feature/AmazingFeature`)
3. 変更をコミットする (`git commit -m 'Add some AmazingFeature'`)
4. ブランチをプッシュする (`git push origin feature/AmazingFeature`)
5. プルリクエストを作成する

### 主なコントリビューター

<a href="https://github.com/nonick-mc/nonibot/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=nonick-mc/nonibot" alt="contrib.rocks image" />
</a>

## ライセンス

AGPL-3.0ライセンスに基づいて配布されています。詳細については`LICENSE`をご確認ください。
