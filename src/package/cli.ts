#!/usr/bin/env node
import { parseArgs } from "node:util";
import { writeFile } from "node:fs/promises";
import { generateImage } from "./index";

const main = async () => {
  const { values } = parseArgs({ options: {
    owner: { type: "string" }, repo: { type: "string" },
    description: { type: "string" }, theme: { type: "string" },
    stars: { type: "string" }, forks: { type: "string" },
    issues: { type: "string" }, contributors: { type: "string" },
    avatar: { type: "string" },
    "github-avatar": { type: "boolean" },
    output: { type: "string", short: "o", default: "og.png" },
    help: { type: "boolean", short: "h" },
  } });
  if (values.help) {
    console.log(`Usage: fake-repo-ogp-image --owner NAME --repo NAME [options]

Options:
  --description TEXT
  --theme light|dark
  --stars N --forks N --issues N --contributors N
  --avatar URL             Image URL or data URL
  --github-avatar          Use the owner's GitHub avatar
  -o, --output FILE        Output PNG (default: og.png)
  -h, --help               Show help`);
    return;
  }
  const { output, help, "github-avatar": useGithubAvatar, ...input } = values;
  void help;
  const png = await generateImage({
    ...input,
    owner: input.owner ?? "", repo: input.repo ?? "",
    theme: input.theme as "light" | "dark" | undefined,
    useGithubAvatar,
    stars: input.stars === undefined ? undefined : Number(input.stars),
    forks: input.forks === undefined ? undefined : Number(input.forks),
    issues: input.issues === undefined ? undefined : Number(input.issues),
    contributors: input.contributors === undefined ? undefined : Number(input.contributors),
  });
  await writeFile(output, png);
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
