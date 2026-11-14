import { readFile, writeFile, appendFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import semver from "semver";
import { nextVersion } from "./release-version.mjs";

const pkg = JSON.parse(await readFile("package.json", "utf8"));
const tags = execFileSync("git", ["tag", "--list"], { encoding: "utf8" }).trim().split("\n");
const version = nextVersion(pkg.version, process.env.RELEASE_VERSION, process.env.PREID, tags);
const prerelease = semver.prerelease(version);
const distTag = process.env.DIST_TAG || (prerelease ? prerelease[0] : "latest");
if (!/^[a-z][a-z0-9-]*$/.test(distTag) || semver.validRange(distTag)) throw new Error("Invalid npm dist-tag.");
if (prerelease && distTag === "latest") throw new Error("Prereleases must use a prerelease dist-tag.");
await writeFile("package.json", `${JSON.stringify({ ...pkg, version }, null, 2)}\n`);
await appendFile(process.env.GITHUB_OUTPUT, `version=${version}\ntag=v${version}\nnpm_tag=${distTag}\nprerelease=${Boolean(prerelease)}\n`);
