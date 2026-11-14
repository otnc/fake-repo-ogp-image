import { z } from "zod";
import { languageColor } from "./languages";
const count = z.number().nonnegative().max(Number.MAX_SAFE_INTEGER).default(0);
const stat = z.enum(["contributors", "usedBy", "issues", "pullRequests", "discussions", "stars", "forks"]);
export const repoOptionsSchema = z.strictObject({
  owner: z.string().default("octocat"),
  repo: z.string().default("hello-world"),
  description: z.string().default("My first repository on GitHub!"),
  theme: z.enum(["light", "dark"]).default("light"),
  avatar: z.string().nullable().default(null),
  useGithubAvatar: z.boolean().default(false),
  avatarFallback: z.enum(["none", "identicon"]).default("identicon"),
  identiconSeed: z.number().int().default(1),
  languages: z.array(z.strictObject({
    id: z.string().optional(), name: z.string(), color: z.string().optional(),
    percent: z.number().min(0),
  })).default([]),
  othersColor: z.string().regex(/^#[\da-f]{6}$/i).default("#ededed"),
  contributors: count, usedBy: count, issues: count, pullRequests: count,
  discussions: count, stars: count, forks: count,
  hiddenStats: z.array(stat).default(["usedBy", "pullRequests", "discussions"]),
});


export type GenerateImageOptions = z.input<typeof repoOptionsSchema>;

/** Validates card settings and fills missing language IDs and standard colors. */
export const createRepoData = (options: GenerateImageOptions = {}) => {
  const data = repoOptionsSchema.parse(options);
  return { ...data, languages: data.languages.map((entry, index) => ({
    ...entry, id: entry.id ?? String(index), color: entry.color ?? languageColor(entry.name),
  })) };
};

export const INITIAL = createRepoData({ owner: "octocat", repo: "hello-world", description: "My first repository on GitHub!" });

/** Validates a partial update without inserting defaults for absent properties. */
export const parseRepoPatch = (input: unknown): GenerateImageOptions => {
  const source = z.record(z.string(), z.unknown()).parse(input);
  const parsed = repoOptionsSchema.partial().parse(source);
  return Object.fromEntries(Object.entries(parsed).filter(([key]) => Object.hasOwn(source, key)));
};
