import { test } from "node:test";
import assert from "node:assert/strict";
import { nextVersion } from "./release-version.mjs";

test("release transitions and retries", () => {
  for (const [current, input, preid, expected] of [
    ["1.0.0", "minor", "rc", "1.1.0-rc.0"],
    ["1.0.0", "major", "beta", "2.0.0-beta.0"],
    ["1.0.0", "prerelease", "rc", "1.0.1-rc.0"],
    ["1.1.0-rc.0", "prerelease", "", "1.1.0-rc.1"],
    ["1.1.0-beta.2", "prerelease", "rc", "1.1.0-rc.0"],
    ["1.1.0-rc.1", "minor", "", "1.1.0"],
    ["1.2.0-rc.1", "1.2.0-rc.1", "", "1.2.0-rc.1"],
  ]) assert.equal(nextVersion(current, input, preid), expected);
  assert.equal(nextVersion("1.1.0", "1.2.0-rc"), "1.2.0-rc.0");
  assert.equal(nextVersion("1.2.0-rc.1", "1.2.0-rc", "", ["v1.2.0-rc.9", "v1.2.0-rc.10"]), "1.2.0-rc.11");
});

test("invalid and regressive releases fail", () => {
  assert.throws(() => nextVersion("1.0.0", "prerelease"));
  assert.throws(() => nextVersion("1.1.0-rc.0", "prerelease", "beta"));
  assert.throws(() => nextVersion("1.0.0", "1.0.1-0"));
  assert.throws(() => nextVersion("1.0.0", "0.9.0"));
});
