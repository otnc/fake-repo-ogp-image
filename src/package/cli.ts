#!/usr/bin/env node
import { Command } from "commander";
import { parse, printParseErrorCode, type ParseError } from "jsonc-parser";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { z } from "zod";
import { createIdenticonSeed, generateImage, createShareUrl, parseShareUrl, importRepo, loadAvatar, listLanguages } from "./index";
import { repoOptionsSchema, createRepoData, parseRepoPatch } from "../lib/repo-options";

const parseJson = (source: string): unknown => {
  const errors: ParseError[] = [];
  const result: unknown = parse(source, errors, { allowTrailingComma: true });
  if (errors.length) throw new Error(errors.map((error) => `${printParseErrorCode(error.error)} at offset ${error.offset}`).join("\n"));
  return result;
};

const main = async () => {
  const program = new Command()
    .name("fake-repo-ogp-image")
    .description("Generate repository card PNGs and share URLs.")
    .option("--config <file>", "Read card settings from JSONC")
    .option("--import <repository>", "Import a GitHub URL or owner/repo")
    .option("--from-share <url>", "Read a share URL or encoded payload")
    .option("--owner <name>", "Repository owner")
    .option("--repo <name>", "Repository name")
    .option("--description <text>", "Description")
    .option("--theme <theme>", "light or dark")
    .option("--avatar <source>", "Image URL, data URL, or local image path")
    .option("--github-avatar", "Use the GitHub owner's avatar")
    .option("--no-github-avatar", "Disable the GitHub avatar")
    .option("--avatar-fallback <kind>", "none or identicon")
    .option("--identicon-seed <number>", "Deterministic identicon seed", Number)
    .option("--random-identicon", "Select an identicon with a new random seed")
    .option("--languages <json>", "Ordered JSONC array of {name, percent, color?, id?}")
    .option("--others-color <hex>", "Color for remaining language percentage")
    .option("--contributors <number>", "Contributor count", Number)
    .option("--used-by <number>", "Used by count", Number)
    .option("--issues <number>", "Open issue count", Number)
    .option("--pull-requests <number>", "Open pull request count", Number)
    .option("--discussions <number>", "Discussion count", Number)
    .option("--stars <number>", "Star count", Number)
    .option("--forks <number>", "Fork count", Number)
    .option("--hidden-stats <names>", "Comma-separated statistic keys; empty string shows all")
    .option("--list-languages [query]", "List standard language names and colors")
    .option("--pixel-ratio <number>", "Output scale from 1 to 4 (default: 2)", Number)
    .option("--share-url <origin>", "Print a share URL for the specified web editor origin")
    .option("--save-config <file>", "Save resolved card data as JSON")
    .option("-o, --output <file>", "PNG output path (default: og.png)")
    .addHelpText("after", "\nPrecedence: defaults < imported/shared data < config < explicit options.\nStatistics use camelCase keys in JSON and --hidden-stats. Existing output files are overwritten.");
  program.parse();
  const values = program.opts<Record<string, unknown>>();
  if (values.listLanguages !== undefined) {
    const query = z.union([z.string(), z.literal(true)]).parse(values.listLanguages);
    console.log(JSON.stringify(listLanguages(query === true ? "" : query), null, 2));
    return;
  }
  const controls = z.object({
    config: z.string().optional(), import: z.string().optional(), fromShare: z.string().optional(),
    output: z.string().default("og.png"), shareUrl: z.string().optional(), saveConfig: z.string().optional(),
    pixelRatio: z.number().int().min(1).max(4).default(2), randomIdenticon: z.boolean().optional(),
  }).parse(values);
  if (controls.import && controls.fromShare) throw new Error("Choose either --import or --from-share.");
  const base = controls.import ? await importRepo(controls.import) : controls.fromShare ? parseShareUrl(controls.fromShare) : {};
  const config = controls.config ? parseRepoPatch(parseJson(await readFile(controls.config, "utf8"))) : {};
  const explicit = Object.fromEntries(Object.entries(values).filter(([key]) => key in repoOptionsSchema.shape));
  if (values.githubAvatar !== undefined) explicit.useGithubAvatar = values.githubAvatar;
  if (values.languages !== undefined) explicit.languages = parseJson(z.string().parse(values.languages));
  if (values.hiddenStats !== undefined) explicit.hiddenStats = z.string().parse(values.hiddenStats).split(",").map((key) => key.trim()).filter(Boolean);
  const data = createRepoData({ ...base, ...config, ...parseRepoPatch(explicit) });
  if (controls.randomIdenticon) {
    data.avatarFallback = "identicon";
    data.identiconSeed = createIdenticonSeed();
  }
  if (data.avatar && !/^(https?:|data:image\/)/.test(data.avatar)) {
    const directory = values.avatar === undefined && controls.config ? dirname(resolve(controls.config)) : process.cwd();
    data.avatar = await loadAvatar(resolve(directory, data.avatar));
  }
  const png = await generateImage(data, { pixelRatio: controls.pixelRatio });
  await writeFile(controls.output, png);
  if (controls.saveConfig) await writeFile(controls.saveConfig, `${JSON.stringify(data, null, 2)}\n`);
  if (controls.shareUrl) {
    const result = await createShareUrl(data, controls.shareUrl);
    console.log(result.url);
    if (result.avatarDropped) console.error("Avatar omitted because it exceeds the share URL size limit.");
  }
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
