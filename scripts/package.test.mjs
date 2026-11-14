import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { generateImage } from "../dist/index.js";

test("API renders PNG and rejects invalid counts", async () => {
  const png = await generateImage({ owner: "octocat", repo: "hello-world", theme: "dark" });
  assert.equal(png.subarray(1, 4).toString(), "PNG");
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 600);
  await assert.rejects(generateImage({ owner: "a", repo: "b", stars: -1 }));
});

test("CLI resolves bundled fonts outside the project", async () => {
  const directory = await mkdtemp(join(tmpdir(), "fake-repo-ogp-"));
  const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
  try {
    await promisify(execFile)(process.execPath, [cli, "--owner", "octocat", "--repo", "hello-world"], { cwd: directory });
    const png = await readFile(join(directory, "og.png"));
    assert.equal(png.readUInt32BE(16), 1200);
    await assert.rejects(promisify(execFile)(process.execPath, [cli, "--unknown"], { cwd: directory }));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
