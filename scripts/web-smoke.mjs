import assert from "node:assert/strict";
import { spawn } from "node:child_process";

// Exercise Next's production bundling and native dependencies, which isolated route tests bypass.
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "0"], {
  windowsHide: true,
  env: { ...process.env, FORCE_COLOR: "0" },
});
const closed = new Promise((resolve) => server.once("close", resolve));
const logs = [];
server.stderr.on("data", (data) => logs.push(data.toString()));

try {
  const origin = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Next.js startup timed out.\n${logs.join("")}`)), 30000);
    server.once("error", (error) => { clearTimeout(timer); reject(error); });
    server.once("exit", (code) => { clearTimeout(timer); reject(new Error(`Next.js exited with ${code}.\n${logs.join("")}`)); });
    server.stdout.on("data", (data) => {
      logs.push(data.toString());
      const output = logs.join("");
      const address = output.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
      if (address && output.includes("Ready")) {
        clearTimeout(timer);
        resolve(address);
      }
    });
  });
  const home = await fetch(origin, { signal: AbortSignal.timeout(30000) });
  assert.equal(home.status, 200, logs.join(""));
  const html = await home.text();
  assert.match(html, /lang="ja"/);
  assert.match(html, /APIとCLIが登場しました/);
  assert.match(html, /https:\/\/www\.npmjs\.com\/package\/fake-repo-ogp-image/);
  const avatar = `data:image/svg+xml;base64,${Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="red"/></svg>').toString("base64")}`;
  for (const pixelRatio of [1, 2]) {
    const response = await fetch(`${origin}/api/og`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: { owner: "octocat", repo: "production-test", avatar }, pixelRatio }),
      signal: AbortSignal.timeout(30000),
    });
    assert.equal(response.status, 200, logs.join(""));
    assert.match(response.headers.get("content-type"), /image\/png/);
    const png = Buffer.from(await response.arrayBuffer());
    assert.equal(png.subarray(1, 4).toString(), "PNG");
    assert.equal(png.readUInt32BE(16), 1200 * pixelRatio);
    assert.equal(png.readUInt32BE(20), 600 * pixelRatio);
    console.log(`Production POST generated ${1200 * pixelRatio}x${600 * pixelRatio} PNG.`);
  }
  const shared = await fetch(`${origin}/api/og`, { signal: AbortSignal.timeout(30000) });
  assert.equal(shared.status, 200, logs.join(""));
  assert.match(shared.headers.get("content-type"), /image\/png/);
  await shared.arrayBuffer();
  console.log("Production GET generated the shared OGP image.");
} finally {
  server.kill();
  await closed;
}
