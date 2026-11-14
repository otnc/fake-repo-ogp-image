# fake-repo-ogp-image

Generate GitHub-style repository cards as 1200 × 600 PNG images. Includes a Node.js API, CLI, and Next.js web editor.

## Node.js API

Requires Node.js 20 or later. The package provides ESM exports and TypeScript declarations.

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

Only `owner` and `repo` are required. Options also include `avatar` (URL or data URL), `useGithubAvatar`, `avatarFallback` (`none` or `identicon`), `identiconSeed`, `languages` (`{ id, name, color, percent }[]`), `othersColor`, all seven statistics (`contributors`, `usedBy`, `issues`, `pullRequests`, `discussions`, `stars`, `forks`), and `hiddenStats` (an array of statistic names). Colors use six-digit hex notation. Counts must be nonnegative safe integers. Unknown options are rejected.

Counts default to zero. Used by, pull requests, and discussions are hidden by default. Pass `hiddenStats: []` to display all statistics. The default theme is light and no avatar is shown.

`generateImage()` returns a `Promise<Buffer>` and rejects invalid options or rendering failures. Latin fonts are bundled. Non-ASCII text uses the existing Google Fonts subset loader, which requires network access and falls back to Latin fonts if retrieval fails. Remote avatars also require network access.

## CLI

```sh
npx fake-repo-ogp-image --owner octocat --repo hello-world --stars 1200 --theme dark -o og.png
npx fake-repo-ogp-image --help
```

The CLI accepts owner, repo, description, theme, stars, forks, issues, contributors, avatar, and `--github-avatar`. Output defaults to `og.png`. Existing output files are overwritten. Invalid arguments or generation failures produce a nonzero exit status.

## Development

```sh
pnpm install
pnpm dev
pnpm build
pnpm build:package
pnpm lint
```

`pnpm build` builds the Vercel web application. `pnpm build:package` builds the API, CLI, declarations, and bundled fonts in `dist`. `pnpm pack` runs the package build before packaging.

## Vercel deployment

Keep the project root set to the repository root. The checked-in `vercel.json` selects Next.js, installs development dependencies, runs `pnpm build`, and uses `.next` as the output directory. Development dependencies include the web application tooling. The package build writes to `dist`.

If deployment settings were customized in the dashboard, align them with `vercel.json`. Use a supported Node.js version such as 22 or 24. The existing font tracing configuration includes the web endpoint's bundled TTF assets. `NEXT_PUBLIC_SITE_URL` should contain the production site's URL.

## CI and releases

CI checks lint, types, package integration tests, release version transitions, the Next.js build, and packaging on Node.js 20, 22, and 24.

Run the `release` workflow manually with `version` set to `patch`, `minor`, `major`, `prerelease`, or an explicit version. Optional `preid` starts a prerelease such as `rc`. An explicit version such as `1.2.0-rc` selects the next numeric suffix from existing tags. The npm dist-tag defaults to the prerelease identifier or `latest`. Set `dist_tag` to override it.

The workflow commits and tags the version before publishing. To retry a partial release, rerun it from the release commit with the same explicit version. Existing npm versions and GitHub releases are skipped. An existing Git tag must point to the checked-out release commit. Branch protection must allow the workflow's version commit.

Configure npm trusted publishing for owner `otnc`, repository `fake-repo-ogp-image`, and workflow filename `release.yml` in the package's npm publishing settings. Publication uses OIDC and provenance. The workflows are based on [npm-biome-ts](https://github.com/oto-lab/npm-biome-ts) and its [release behavior issue](https://github.com/oto-lab/npm-biome-ts/issues/3).
