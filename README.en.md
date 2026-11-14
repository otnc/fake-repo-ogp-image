# fake-repo-ogp-image

[日本語](README.md) | **English**

[Web](https://fake-repo-ogp-image.vercel.app/) · [npm](https://www.npmjs.com/package/fake-repo-ogp-image)

Generate GitHub-style repository cards as PNG images from a 1200 × 600 card layout. Includes a Node.js API, CLI, and Next.js web editor.

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

## Shared rendering

The web preview, downloads, shared OGP endpoint, API, and CLI use one Satori renderer. Web previews and downloads request the existing `/api/og` endpoint using POST, so web image generation requires the server. This replaces browser DOM screenshots. All seven statistics fit into two rows when necessary.

See [CONTRIBUTING](./CONTRIBUTING.en.md) for development, documentation, deployment, and release instructions.
