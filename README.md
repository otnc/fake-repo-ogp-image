# fake-repo-ogp-image

**日本語** | [English](README.en.md)

[Web](https://fake-repo-ogp-image.vercel.app/) · [npm](https://www.npmjs.com/package/fake-repo-ogp-image)

GitHub リポジトリの OGP 風画像を作成するツールです。Web エディター、Node.js API、CLI から利用できます。カードのレイアウトは 1200×600 です。

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

## 画像生成

Web のプレビュー、保存、共有 OGP、API、CLI は共通の Satori 描画処理を使います。Web のプレビューと保存は `/api/og` へ POST するため、サーバーへの接続が必要です。全 7 項目の統計を表示するときは 2 段に配置します。

開発、ドキュメント編集、Vercel デプロイ、リリースの手順は [CONTRIBUTING](./CONTRIBUTING.md) を参照してください。
