import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { generateImage, createRepoData, createShareUrl, parseShareUrl, listLanguages, loadAvatar } from "../dist/index.js";
import { build } from "tsup";

test("API and CLI support pixel dimensions while preserving the card layout", async () => {
  const options = { description: "" };
  for (const [rendering, width, height] of [
    [{ width: 1600, height: 900 }, 1600, 900],
    [{ width: 901 }, 901, 451],
    [{ height: 375 }, 750, 375],
  ]) {
    const png = await generateImage(options, rendering);
    assert.equal(png.readUInt32BE(16), width);
    assert.equal(png.readUInt32BE(20), height);
  }
  await assert.rejects(generateImage(options, { width: 0 }));
  await assert.rejects(generateImage(options, { height: 8192 }));
  await assert.rejects(generateImage(options, { width: 900, pixelRatio: 2 }), /Choose either/);

  const directory = await mkdtemp(join(tmpdir(), "fake-repo-ogp-size-"));
  try {
    const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
    await promisify(execFile)(process.execPath, [cli, "--description", "", "--width", "1600", "--height", "900"], { cwd: directory });
    assert.deepEqual(await readFile(join(directory, "og.png")), await generateImage(options, { width: 1600, height: 900 }));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("web handlers and package API generate identical PNGs", async () => {
  const directory = await mkdtemp(join(process.cwd(), ".verify-route-"));
  try {
    await build({ config: false, entry: { route: "src/app/api/og/route.tsx" }, outDir: directory, format: ["esm"], dts: false, splitting: false, silent: true });
    const { GET, POST } = await import(pathToFileURL(join(directory, "route.js")).href);
    const data = createRepoData({ owner: "", repo: "", description: "", hiddenStats: [], theme: "dark" });
    const response = await POST(new Request("https://example.com/api/og", { method: "POST", body: JSON.stringify({ data, pixelRatio: 1 }) }));
    assert.equal(response.status, 200);
    const png = await generateImage(data, { pixelRatio: 1 });
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), png);
    const share = await createShareUrl(data, "https://example.com");
    const ogResponse = await GET(new Request(share.url.replace("/share?", "/api/og?")));
    assert.deepEqual(Buffer.from(await ogResponse.arrayBuffer()), png);
    const invalid = await POST(new Request("https://example.com/api/og", { method: "POST", body: "invalid JSON" }));
    assert.equal(invalid.status, 400);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("API renders PNG and rejects invalid counts", async () => {
  const png = await generateImage({ owner: "octocat", repo: "hello-world", theme: "dark" });
  assert.equal(png.subarray(1, 4).toString(), "PNG");
  assert.equal(png.readUInt32BE(16), 2400);
  assert.equal(png.readUInt32BE(20), 1200);
  await assert.rejects(generateImage({ owner: "a", repo: "b", stars: -1 }));
});

test("remote avatar failures use the supplied image and then the configured fallback", async () => {
  const originalFetch = globalThis.fetch;
  const sources = [];
  globalThis.fetch = async (url, options) => {
    if (String(url).startsWith("data:")) return originalFetch(url, options);
    sources.push(String(url));
    return new Response("missing", { status: 404 });
  };
  try {
    const options = { owner: "missing", repo: "test", description: "", avatarFallback: "identicon", identiconSeed: 17 };
    const png = await generateImage({ ...options, useGithubAvatar: true, avatar: "https://example.com/missing.png" }, { pixelRatio: 1 });
    assert.deepEqual(png, await generateImage(options, { pixelRatio: 1 }));
    assert.equal(sources.length, 2);
    assert.match(sources[0], /github.com/);
    assert.equal(sources[1], "https://example.com/missing.png");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("all card settings survive sharing, including more than twelve languages", async () => {
  const data = createRepoData({
    owner: "", repo: "", description: "", theme: "dark", useGithubAvatar: false,
    avatarFallback: "identicon", identiconSeed: 42, othersColor: "#123456",
    languages: Array.from({ length: 13 }, (_, i) => ({ name: "TypeScript", percent: i })),
    contributors: 1, usedBy: 2, issues: 3, pullRequests: 4, discussions: 5, stars: 6, forks: 7, hiddenStats: [],
  });
  assert.equal(data.languages[0].color, "#3178c6");
  assert.equal(listLanguages("typescript")[0].name, "TypeScript");
  const result = await createShareUrl(data, "https://example.com");
  assert.deepEqual(parseShareUrl(result.url), data);
  assert.equal(result.avatarDropped, false);
  await assert.rejects(createShareUrl({ description: "x".repeat(20000) }, "https://example.com"));
});

test("CLI config, explicit overrides, local avatars, and API render the same pixels", async () => {
  const directory = await mkdtemp(join(tmpdir(), "fake-repo-ogp-"));
  const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
  try {
    const { writeFile } = await import("node:fs/promises");
    const avatarPath = join(directory, "avatar.png");
    await writeFile(avatarPath, await generateImage({ description: "" }, { pixelRatio: 1 }));
    await writeFile(join(directory, "card.jsonc"), `{
      // Relative avatar paths resolve from this file.
      "owner": "config-owner", "repo": "config-repo", "theme": "dark",
      "avatar": "avatar.png", "usedBy": 10, "pullRequests": 3, "discussions": 5,
      "hiddenStats": [], "languages": [{"name": "TypeScript", "percent": 80}],
    }`);
    await promisify(execFile)(process.execPath, [cli, "--config", "card.jsonc", "--stars", "42", "--pixel-ratio", "1", "--save-config", "resolved.json"], { cwd: directory });
    const data = JSON.parse(await readFile(join(directory, "resolved.json"), "utf8"));
    assert.equal(data.owner, "config-owner");
    assert.equal(data.usedBy, 10);
    assert.equal(data.stars, 42);
    assert.deepEqual(data.hiddenStats, []);
    assert.deepEqual(await readFile(join(directory, "og.png")), await generateImage(data, { pixelRatio: 1 }));
    assert.equal(await loadAvatar(avatarPath), data.avatar);
    const shared = await createShareUrl(data, "https://example.com");
    assert.match(parseShareUrl(shared.url).avatar, /^data:image\/jpeg;base64,/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("CLI resolves bundled fonts outside the project", async () => {
  const directory = await mkdtemp(join(tmpdir(), "fake-repo-ogp-"));
  const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
  try {
    await promisify(execFile)(process.execPath, [cli, "--owner", "octocat", "--repo", "hello-world"], { cwd: directory });
    const png = await readFile(join(directory, "og.png"));
    assert.equal(png.readUInt32BE(16), 2400);
    await assert.rejects(promisify(execFile)(process.execPath, [cli, "--unknown"], { cwd: directory }));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
