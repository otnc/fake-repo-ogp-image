# fake-repo-ogp-image

[Web](https://fake-repo-ogp-image.vercel.app/) · [npm](https://www.npmjs.com/package/fake-repo-ogp-image)

:::kiritan{locale=ja}
GitHub リポジトリの OGP 風画像を作成するツールです。Web エディター、Node.js API、CLI から利用できます。カードのレイアウトは 1200×600 です。
:::

:::kiritan{locale=en}
Generate GitHub-style repository cards as PNG images from a 1200 × 600 card layout. Includes a Node.js API, CLI, and Next.js web editor.
:::

:::kiritan{locale=ja}
## Node.js API

Node.js 22.12 以降に対応し、ESM と TypeScript の型定義を提供します。

```sh
npm install fake-repo-ogp-image
```

```js
import { writeFile } from "node:fs/promises";
import { generateImage } from "fake-repo-ogp-image";

const png = await generateImage({
  owner: "octocat",
  repo: "hello-world",
  description: "リポジトリの説明",
  stars: 1200,
  theme: "dark",
});
await writeFile("og.png", png);
```

すべての設定を省略できます。初期値は Web エディターと共通で、サンプルのリポジトリ名と説明、ライトテーマ、identicon を使います。Owner とリポジトリ名に空文字を指定すると、画像には `owner/repo` と表示します。

| 設定 | 内容 |
| --- | --- |
| `owner`、`repo`、`description` | カードの文字列。空文字も指定可能 |
| `theme` | `light` または `dark` |
| `avatar` | HTTP(S) URL、画像の data URL、ローカルファイルパス、または `null` |
| `useGithubAvatar` | Owner の GitHub アバターを優先するか |
| `avatarFallback`、`identiconSeed` | 画像未指定時の `none` / `identicon` と、再現用の整数 seed |
| `languages` | `{ name, percent, color?, id? }[]`。色を省略すると同梱の GitHub 標準色を使用 |
| `othersColor` | 言語バーの残り部分の色。6 桁の hex 表記 |
| `contributors`、`usedBy`、`issues`、`pullRequests`、`discussions`、`stars`、`forks` | 0 以上の有限の数値。初期値は 0 |
| `hiddenStats` | 非表示にする統計キーの配列。`[]` で全 7 項目を表示 |

Used by、Pull requests、Discussions は初期状態では非表示です。値と表示状態は個別に保持します。言語バーは割合の大きい順に描画し、合計が 100% を超えた場合も Web と共通の処理を使います。未定義の設定キーはエラーになります。

`generateImage(data, { pixelRatio: 2 })` は PNG を含む `Promise<Buffer>` を返します。標準の保存サイズは Web と同じ 2400×1200 です。倍率は 1〜4 を指定でき、1 ならプレビューや共有 OGP と同じ 1200×600 になります。不正な設定や描画失敗時は例外を返します。リモートアバターを取得できなければ、GitHub アバター、指定画像、identicon または空欄の順にフォールバックします。

```js
import {
  createRepoData, importRepo, loadAvatar, listLanguages,
  createIdenticonSeed, createShareUrl, parseShareUrl,
} from "fake-repo-ogp-image";

const data = createRepoData({
  ...await importRepo("https://github.com/octocat/Hello-World"),
  avatar: await loadAvatar("./logo.png"),
  identiconSeed: createIdenticonSeed(),
  hiddenStats: [],
  languages: [{ name: "TypeScript", percent: 80 }],
});
console.log(listLanguages("script"));
const { url, avatarDropped } = await createShareUrl(data, "https://fake-repo-ogp-image.vercel.app/");
const restored = parseShareUrl(url);
```

`importRepo()` は `owner/repo` または GitHub URL から Web と同じ処理で情報を取得します。既存の取得元で提供されない Used by と Discussions は 0 になり、あとから上書きできます。`createRepoData()` は初期値と言語色を補完し、`loadAvatar()` は画像ファイルを PNG の data URL に変換します。`createIdenticonSeed()` は新しい seed を生成します。`listLanguages(query?)` で言語色の一覧・検索、`languageColor(name)` で色の取得ができます。

`createShareUrl()` は埋め込み画像を共有 URL の長さに収まるよう縮小し、`{ url, avatarDropped }` を返します。文字列だけで上限を超える場合はエラーになります。`parseShareUrl()` は URL 全体またはエンコード済みの値を復元し、旧形式の統計の表示設定にも対応します。`encodeShare()` と `decodeShare()` からも共有データを変換できます。共有 OGP の表示には、指定した URL の Web アプリを使います。

`generateImage(data, { width: 1600, height: 900 })` で出力 PNG のサイズをピクセル単位で指定できます。幅か高さの片方だけを指定すると 2:1 に合わせてもう片方を補います。両方を指定すると、カード全体が収まるよう中央に配置し、余白をテーマの背景色で埋めます。補完後の各辺は 1〜8192 ピクセルです。サイズ指定と `pixelRatio` は併用できません。

Latin フォントと言語色は同梱しています。日本語フォントは Google Fonts から取得し、失敗すると Latin フォントにフォールバックします。GitHub インポートとリモート画像にもネット接続が必要です。API のローカル画像パスはカレントディレクトリを基準にします。
:::

:::kiritan{locale=en}
## Node.js API

Requires Node.js 22.12 or later. The package provides ESM exports and TypeScript declarations.

```sh
npm install fake-repo-ogp-image
```

```js
import { writeFile } from "node:fs/promises";
import { generateImage } from "fake-repo-ogp-image";

const png = await generateImage({
  owner: "octocat",
  repo: "hello-world",
  description: "My repository",
  stars: 1200,
  theme: "dark",
});
await writeFile("og.png", png);
```

All settings are optional. Defaults match the web editor, including the sample repository, description, light theme, and identicon. Explicit empty owner/repo strings use the renderer's `owner/repo` placeholders.

| Setting | Behavior |
| --- | --- |
| `owner`, `repo`, `description` | Card text, including empty strings |
| `theme` | `light` or `dark` |
| `avatar` | HTTP(S) URL, image data URL, local file path, or `null` |
| `useGithubAvatar` | Prefer the owner's GitHub avatar |
| `avatarFallback`, `identiconSeed` | `none` or `identicon`, with a reproducible integer seed |
| `languages` | `{ name, percent, color?, id? }[]`; omitted colors use the bundled GitHub palette |
| `othersColor` | Six-digit hex color for the remainder of the language bar |
| `contributors`, `usedBy`, `issues`, `pullRequests`, `discussions`, `stars`, `forks` | Nonnegative finite counts, defaulting to zero |
| `hiddenStats` | Array of statistic keys; `[]` shows all seven |

Used by, pull requests, and discussions are hidden by default. Each setting is independent of its visibility. The rendered language bar sorts entries by descending percentage. Language totals above 100% use the same proportional rendering as the web editor. Unknown settings are rejected.

`generateImage(data, { pixelRatio: 2 })` returns a `Promise<Buffer>` containing a 2400 × 1200 PNG, matching web downloads. Ratios 1–4 are supported. Ratio 1 produces the 1200 × 600 web preview and shared OGP image. Invalid settings and rendering errors reject the promise. Missing remote avatars fall through from GitHub to the specified image and then to the configured identicon/empty fallback.

```js
import {
  createRepoData, importRepo, loadAvatar, listLanguages,
  createIdenticonSeed, createShareUrl, parseShareUrl,
} from "fake-repo-ogp-image";

const data = createRepoData({
  ...await importRepo("https://github.com/octocat/Hello-World"),
  avatar: await loadAvatar("./logo.png"),
  identiconSeed: createIdenticonSeed(),
  hiddenStats: [],
  languages: [{ name: "TypeScript", percent: 80 }],
});
console.log(listLanguages("script"));
const { url, avatarDropped } = await createShareUrl(data, "https://your-editor.example");
const restored = parseShareUrl(url);
```

`importRepo()` accepts `owner/repo` or a GitHub URL and uses the same import logic as the editor. Used by and discussions remain zero because the existing import sources do not provide them. You can override either value. `createRepoData()` fills defaults and language colors. `loadAvatar()` normalizes a local image into a PNG data URL. `createIdenticonSeed()` selects a new seed. `listLanguages(query?)` lists/searches the bundled palette, and `languageColor(name)` looks up a color.

`createShareUrl()` compresses embedded avatars using the web editor's size budget and returns `{ url, avatarDropped }`. Oversized text rejects the operation. `parseShareUrl()` accepts a full URL or its encoded payload, including legacy hidden-stat settings. `encodeShare()` and `decodeShare()` expose the underlying payload codec. Share images depend on the deployed editor at the supplied origin.

`generateImage(data, { width: 1600, height: 900 })` sets the PNG dimensions in pixels. Specify one dimension to preserve the 2:1 aspect ratio. Specify both to center the complete card on its theme background. Each resulting dimension must be between 1 and 8192 pixels. Choose dimensions or `pixelRatio`.

Latin fonts and language colors are bundled. Japanese fonts are fetched from Google Fonts with the existing Latin fallback on retrieval failure. GitHub imports and remote avatars require network access. Local image paths in the API resolve from the current directory.
:::

:::kiritan{locale=ja}
## CLI

```sh
npx fake-repo-ogp-image --owner octocat --repo hello-world --stars 1200 --theme dark -o og.png
npx fake-repo-ogp-image --import octocat/Hello-World --used-by 500 --discussions 10 --hidden-stats "" -o imported.png
npx fake-repo-ogp-image --width 1600 --height 900 -o wide.png
npx fake-repo-ogp-image --config card.jsonc --pixel-ratio 1 --save-config resolved.json
npx fake-repo-ogp-image --from-share "https://fake-repo-ogp-image.vercel.app/share?d=..." -o restored.png
npx fake-repo-ogp-image --avatar ./logo.png --share-url https://fake-repo-ogp-image.vercel.app/
npx fake-repo-ogp-image --list-languages script
npx fake-repo-ogp-image --help
```

すべてのカード設定に対応するオプションがあります。camelCase のキーは `--pull-requests`、`--used-by`、`--others-color`、`--identicon-seed`、`--avatar-fallback` のように kebab-case で指定します。GitHub アバターは `--github-avatar` / `--no-github-avatar` で切り替えます。`--random-identicon` は新しい seed の identicon を設定します。`--languages` は JSONC 配列、`--hidden-stats` は camelCase の統計キーをカンマ区切りで受け取ります。空文字を渡すと全統計を表示します。

設定ファイルはカード設定をそのまま記述する JSONC です。コメントと末尾のカンマも使えます。

```jsonc
{
  "owner": "octocat",
  "repo": "hello-world",
  "avatar": "./logo.png",
  "languages": [{ "name": "TypeScript", "percent": 80 }],
  "usedBy": 500,
  "pullRequests": 20,
  "discussions": 10,
  "hiddenStats": [],
}
```

設定は初期値、インポートまたは共有データ、設定ファイル、明示したオプションの順に上書きされます。設定ファイル内の画像パスはそのファイルの場所、CLI で渡すパスはカレントディレクトリを基準にします。`--save-config` は補完後の設定を保存し、ローカル画像は data URL として含めます。`--import` と `--from-share` は同時に指定できません。

`--width` と `--height` は API と同じサイズ指定です。

出力先の初期値は `og.png`、倍率は 2 です。同名のファイルは上書きします。`--share-url` は PNG 保存に加えて共有 URL を標準出力に表示し、画像を省略した場合は標準エラーに通知します。不正な引数や生成失敗時は終了コードが 0 以外になります。
:::

:::kiritan{locale=en}
## CLI

```sh
npx fake-repo-ogp-image --owner octocat --repo hello-world --stars 1200 --theme dark -o og.png
npx fake-repo-ogp-image --import octocat/Hello-World --used-by 500 --discussions 10 --hidden-stats "" -o imported.png
npx fake-repo-ogp-image --width 1600 --height 900 -o wide.png
npx fake-repo-ogp-image --config card.jsonc --pixel-ratio 1 --save-config resolved.json
npx fake-repo-ogp-image --from-share "https://your-editor.example/share?d=..." -o restored.png
npx fake-repo-ogp-image --avatar ./logo.png --share-url https://your-editor.example
npx fake-repo-ogp-image --list-languages script
npx fake-repo-ogp-image --help
```

Every card setting has a CLI option. CamelCase keys use kebab-case flags, such as `--pull-requests`, `--used-by`, `--others-color`, `--identicon-seed`, and `--avatar-fallback`. `--github-avatar` and `--no-github-avatar` control the GitHub avatar. `--random-identicon` selects the identicon fallback with a fresh seed. `--languages` takes an ordered JSONC array. `--hidden-stats` accepts comma-separated camelCase statistic keys; an empty string shows everything.

A JSONC configuration file contains the card settings directly. Comments and trailing commas are supported.

```jsonc
{
  "owner": "octocat",
  "repo": "hello-world",
  "avatar": "./logo.png",
  "languages": [{ "name": "TypeScript", "percent": 80 }],
  "usedBy": 500,
  "pullRequests": 20,
  "discussions": 10,
  "hiddenStats": [],
}
```

Settings are applied in order of defaults, import/share data, configuration file, and explicit flags. Local avatar paths from a configuration file resolve relative to that file; CLI paths resolve from the current directory. `--save-config` writes fully resolved card data, including embedded local avatars. `--import` and `--from-share` are mutually exclusive.

`--width` and `--height` follow the same rules as the API dimensions.

Output defaults to `og.png` at pixel ratio 2. Existing output files are overwritten. `--share-url` also prints the generated URL to stdout and reports omitted avatars on stderr. Invalid arguments and generation failures produce a nonzero exit status.
:::

:::kiritan{locale=ja}
## 画像生成

Web のプレビュー、保存、共有 OGP、API、CLI は共通の Satori 描画処理を使います。Web のプレビューと保存は `/api/og` へ POST するため、サーバーへの接続が必要です。全 7 項目の統計を表示するときは 2 段に配置します。

開発、ドキュメント編集、Vercel デプロイ、リリースの手順は [CONTRIBUTING](./CONTRIBUTING.md) を参照してください。
:::

:::kiritan{locale=en}
## Shared rendering

The web preview, downloads, shared OGP endpoint, API, and CLI use one Satori renderer. Web previews and downloads request the existing `/api/og` endpoint using POST, so web image generation requires the server. This replaces browser DOM screenshots. All seven statistics fit into two rows when necessary.


See [CONTRIBUTING](./CONTRIBUTING.en.md) for development, documentation, deployment, and release instructions.
:::
