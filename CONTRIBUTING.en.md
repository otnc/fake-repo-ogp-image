# Contributing

[日本語](CONTRIBUTING.md) | **English**

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

## Vercel deployment

Keep the project root set to the repository root. The checked-in `vercel.json` selects Next.js, installs development dependencies, runs `pnpm build`, and uses `.next` as the output directory. Development dependencies include the web application tooling. The package build writes to `dist`.

If deployment settings were customized in the dashboard, align them with `vercel.json`. Use Node.js 22.12 or later, such as Node.js 24. The existing font tracing configuration includes the web endpoint's bundled TTF assets. `NEXT_PUBLIC_SITE_URL` should contain the production site's URL.

## CI and releases

CI checks lint, types, package integration tests, release version transitions, the Next.js build, and packaging on the Node.js versions in the CI matrix.

Run the `release` workflow manually with `version` set to `patch`, `minor`, `major`, `prerelease`, or an explicit version. Optional `preid` starts a prerelease such as `rc`. An explicit version such as `1.2.0-rc` selects the next numeric suffix from existing tags. The npm dist-tag defaults to the prerelease identifier or `latest`. Set `dist_tag` to override it.

The workflow commits and tags the version before publishing. To retry a partial release, rerun it from the release commit with the same explicit version. Existing npm versions and GitHub releases are skipped. An existing Git tag must point to the checked-out release commit. Branch protection must allow the workflow's version commit.

Configure npm trusted publishing for owner `otnc`, repository `fake-repo-ogp-image`, and workflow filename `release.yml` in the package's npm publishing settings. Publication uses OIDC and provenance. The workflows are based on [npm-biome-ts](https://github.com/oto-lab/npm-biome-ts) and its [release behavior issue](https://github.com/oto-lab/npm-biome-ts/issues/3).

## Editing documentation

Kiritan generates README and CONTRIBUTING from `base/*.base.md`. Japanese is the default language; English outputs use `*.en.md`. Edit the base sources, then run the following commands.

```sh
pnpm docs:build
pnpm docs:check
pnpm docs:verify
```

Write localized sections in `:::kiritan{locale=ja}` and `:::kiritan{locale=en}` blocks. Commit both the sources and generated Markdown. Make edits in the base files so regeneration preserves them.
