# Contributing

:::kiritan{locale=ja}
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
:::

:::kiritan{locale=en}
## Development

```sh
pnpm install
pnpm dev
pnpm build
pnpm build:package
pnpm lint
```

`pnpm build` builds the Vercel web application. `pnpm build:package` builds the API, CLI, declarations, and bundled fonts in `dist`. `pnpm pack` runs the package build before packaging.


Run `pnpm test:web` after `pnpm build` to exercise the production server. Satori produces SVG and Sharp converts it to PNG. Satori is listed in `serverExternalPackages` so Node.js loads its packaged WASM assets. Sharp is unified through `overrides` in `pnpm-workspace.yaml`; verify upgrades with `pnpm why sharp` and the production smoke test.
:::

:::kiritan{locale=ja}
## Vercel デプロイ

プロジェクトのルートにはリポジトリのルートを指定します。`vercel.json` は Next.js を選択し、開発依存を含めてインストールしたあと `pnpm build` を実行します。出力先は `.next` です。npm パッケージの出力先は `dist` です。

ダッシュボードで設定を変更している場合は `vercel.json` と揃えてください。Node.js は `package.json` の要件を満たす版を選びます。Web エンドポイントの TTF は `next.config.ts` のトレース設定で含めます。`NEXT_PUBLIC_SITE_URL` は `https://fake-repo-ogp-image.vercel.app/` に設定します。
:::

:::kiritan{locale=en}
## Vercel deployment

Keep the project root set to the repository root. The checked-in `vercel.json` selects Next.js, installs development dependencies, runs `pnpm build`, and uses `.next` as the output directory. Development dependencies include the web application tooling. The package build writes to `dist`.

If deployment settings were customized in the dashboard, align them with `vercel.json`. Use Node.js 22.12 or later, such as Node.js 24. The existing font tracing configuration includes the web endpoint's bundled TTF assets. `NEXT_PUBLIC_SITE_URL` should contain the production site's URL.
:::

:::kiritan{locale=ja}
## CI とリリース

CI は lint、型チェック、ドキュメントの整合性、API・CLI とリリース版計算のテスト、Web ビルド、本番サーバー経由の画像生成、パッケージ作成を確認します。

`release` ワークフローは手動で実行します。`version` に `patch`、`minor`、`major`、`prerelease` または明示的なバージョンを指定します。`preid` は `rc` などのプレリリース識別子です。`1.2.0-rc` のように番号を省略すると、既存タグの次の番号を採番します。npm の dist-tag はプレリリース識別子または `latest` になり、`dist_tag` で上書きできます。

公開前にバージョンのコミットとタグを作成します。途中で失敗した場合は、そのコミットから同じバージョンを明示して再実行します。公開済みの npm バージョンと GitHub Release はスキップします。既存の Git タグはチェックアウトしたコミットを指している必要があります。ブランチ保護ではワークフローによるバージョンコミットを許可してください。

npm の Trusted Publisher に owner `otnc`、repository `fake-repo-ogp-image`、workflow `release.yml` を登録します。公開には OIDC と provenance を使います。ワークフローは [npm-biome-ts](https://github.com/oto-lab/npm-biome-ts) と [リリース挙動の Issue](https://github.com/oto-lab/npm-biome-ts/issues/3) を参考にしています。
:::

:::kiritan{locale=en}
## CI and releases

CI checks lint, types, package integration tests, release version transitions, the Next.js build, and packaging on the Node.js versions in the CI matrix.

Run the `release` workflow manually with `version` set to `patch`, `minor`, `major`, `prerelease`, or an explicit version. Optional `preid` starts a prerelease such as `rc`. An explicit version such as `1.2.0-rc` selects the next numeric suffix from existing tags. The npm dist-tag defaults to the prerelease identifier or `latest`. Set `dist_tag` to override it.

The workflow commits and tags the version before publishing. To retry a partial release, rerun it from the release commit with the same explicit version. Existing npm versions and GitHub releases are skipped. An existing Git tag must point to the checked-out release commit. Branch protection must allow the workflow's version commit.

Configure npm trusted publishing for owner `otnc`, repository `fake-repo-ogp-image`, and workflow filename `release.yml` in the package's npm publishing settings. Publication uses OIDC and provenance. The workflows are based on [npm-biome-ts](https://github.com/oto-lab/npm-biome-ts) and its [release behavior issue](https://github.com/oto-lab/npm-biome-ts/issues/3).
:::

:::kiritan{locale=ja}
## ドキュメントの編集

README と CONTRIBUTING は `base/*.base.md` から Kiritan で生成します。日本語が既定で、英語版は `*.en.md` です。編集は base ファイルに行い、次のコマンドで生成・検証します。

```sh
pnpm docs:build
pnpm docs:check
pnpm docs:verify
```

言語ごとの文章は `:::kiritan{locale=ja}` と `:::kiritan{locale=en}` に記述します。生成済みの Markdown は直接編集せず、base と生成結果を一緒にコミットしてください。
:::

:::kiritan{locale=en}
## Editing documentation

Kiritan generates README and CONTRIBUTING from `base/*.base.md`. Japanese is the default language; English outputs use `*.en.md`. Edit the base sources, then run the following commands.

```sh
pnpm docs:build
pnpm docs:check
pnpm docs:verify
```

Write localized sections in `:::kiritan{locale=ja}` and `:::kiritan{locale=en}` blocks. Commit both the sources and generated Markdown. Make edits in the base files so regeneration preserves them.
:::
