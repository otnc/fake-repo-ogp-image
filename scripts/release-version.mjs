import semver from "semver";

/** Resolves release inputs, including omitted prerelease counters and exact retries. */
export const nextVersion = (current, requested, preid = "", tags = []) => {
  if (preid && !/^[a-z]+$/.test(preid)) throw new Error("preid must contain lowercase letters only.");
  const omitted = requested.match(/^(\d+\.\d+\.\d+)-([a-z]+)$/);
  const next = (() => {
    if (omitted) {
      const prefix = `${requested}.`;
      const counters = tags.map((tag) => tag.replace(/^v/, "")).filter((tag) => tag.startsWith(prefix) && /^\d+$/.test(tag.slice(prefix.length))).map((tag) => Number(tag.slice(prefix.length)));
      return `${prefix}${Math.max(-1, ...counters) + 1}`;
    }
    if (["patch", "minor", "major", "prerelease"].includes(requested)) {
      if (requested === "prerelease" && !preid && !semver.prerelease(current)) throw new Error("A prerelease identifier is required.");
      const bump = preid && requested !== "prerelease" ? `pre${requested}` : requested;
      return semver.inc(current, bump, preid || undefined);
    }
    if (preid) throw new Error("preid is only supported with version bumps.");
    return semver.valid(requested);
  })();
  if (!next || semver.lt(next, current)) throw new Error("The release version must not be older than the current version.");
  const prerelease = semver.prerelease(next);
  if (prerelease && !/^[a-z]+$/.test(String(prerelease[0]))) throw new Error("The prerelease identifier must contain lowercase letters only.");
  return next;
};
