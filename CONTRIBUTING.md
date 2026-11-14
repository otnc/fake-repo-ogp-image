# Contributing

**日本語** | [English](CONTRIBUTING.en.md)

## 開発

```sh
pnpm install
pnpm dev
pnpm build
pnpm build:package
pnpm test
pnpm test:web
pnpm lint
```

`pnpm dev` は開発サーバー、`pnpm build` は Vercel 用の Web ビルドです。`pnpm build:package` は API、CLI、型定義、フォントを `dist` へ出力します。`pnpm test:web` は Web ビルド後に実行し、一時的に本番サーバーを起動して画像生成を確認したあと停止します。`pnpm pack` はパッケージをビルドしてから配布ファイルを作ります。

Satori で SVG を作り、Sharp で PNG に変換します。Satori は `serverExternalPackages` に指定し、Node.js がパッケージの WASM を読み込めるようにします。

Sharp は `pnpm-workspace.yaml` の `overrides` で直接依存と同じ版に統一しています。Next.js の間接依存も同じ版に揃え、異なる native ライブラリの混在を防ぎます。更新時は `pnpm why sharp` で解決結果を確認し、`pnpm build` と `pnpm test:web` を実行してください。

## Vercel デプロイ

プロジェクトのルートにはリポジトリのルートを指定します。`vercel.json` は Next.js を選択し、開発依存を含めてインストールしたあと `pnpm build` を実行します。出力先は `.next` です。npm パッケージの出力先は `dist` です。

ダッシュボードで設定を変更している場合は `vercel.json` と揃えてください。Node.js は `package.json` の要件を満たす版を選びます。Web エンドポイントの TTF は `next.config.ts` のトレース設定で含めます。`NEXT_PUBLIC_SITE_URL` は `https://fake-repo-ogp-image.vercel.app/` に設定します。

## CI とリリース

CI は lint、型チェック、ドキュメントの整合性、API・CLI とリリース版計算のテスト、Web ビルド、本番サーバー経由の画像生成、パッケージ作成を確認します。

`release` ワークフローは手動で実行します。`version` に `patch`、`minor`、`major`、`prerelease` または明示的なバージョンを指定します。`preid` は `rc` などのプレリリース識別子です。`1.2.0-rc` のように番号を省略すると、既存タグの次の番号を採番します。npm の dist-tag はプレリリース識別子または `latest` になり、`dist_tag` で上書きできます。

公開前にバージョンのコミットとタグを作成します。途中で失敗した場合は、そのコミットから同じバージョンを明示して再実行します。公開済みの npm バージョンと GitHub Release はスキップします。既存の Git タグはチェックアウトしたコミットを指している必要があります。ブランチ保護ではワークフローによるバージョンコミットを許可してください。

npm の Trusted Publisher に owner `otnc`、repository `fake-repo-ogp-image`、workflow `release.yml` を登録します。公開には OIDC と provenance を使います。ワークフローは [npm-biome-ts](https://github.com/oto-lab/npm-biome-ts) と [リリース挙動の Issue](https://github.com/oto-lab/npm-biome-ts/issues/3) を参考にしています。

## ドキュメントの編集

README と CONTRIBUTING は `base/*.base.md` から Kiritan で生成します。日本語が既定で、英語版は `*.en.md` です。編集は base ファイルに行い、次のコマンドで生成・検証します。

```sh
pnpm docs:build
pnpm docs:check
pnpm docs:verify
```

言語ごとの文章は `:::kiritan{locale=ja}` と `:::kiritan{locale=en}` に記述します。生成済みの Markdown は直接編集せず、base と生成結果を一緒にコミットしてください。
