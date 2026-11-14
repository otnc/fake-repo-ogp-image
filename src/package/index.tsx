import { fileURLToPath } from "node:url";
import { ImageResponse } from "@vercel/og";
import { z } from "zod";
import OgImage, { OG_W, OG_H } from "../app/api/og/OgImage";
import { collectText, loadFonts } from "../lib/og-fonts";

const count = z.number().int().nonnegative().safe().default(0);
const stat = z.enum(["contributors", "usedBy", "issues", "pullRequests", "discussions", "stars", "forks"]);
const optionsSchema = z.strictObject({
  owner: z.string().min(1),
  repo: z.string().min(1),
  description: z.string().default(""),
  theme: z.enum(["light", "dark"]).default("light"),
  avatar: z.string().nullable().default(null),
  useGithubAvatar: z.boolean().default(false),
  avatarFallback: z.enum(["none", "identicon"]).default("none"),
  identiconSeed: z.number().int().default(1),
  languages: z.array(z.strictObject({
    id: z.string(), name: z.string(), color: z.string().regex(/^#[\da-f]{6}$/i),
    percent: z.number().min(0).max(100),
  })).default([]),
  othersColor: z.string().regex(/^#[\da-f]{6}$/i).default("#ededed"),
  contributors: count, usedBy: count, issues: count, pullRequests: count,
  discussions: count, stars: count, forks: count,
  hiddenStats: z.array(stat).default(["usedBy", "pullRequests", "discussions"]),
});

/** Options for a 1200 × 600 PNG. Only owner and repo are required. */
export type GenerateImageOptions = z.input<typeof optionsSchema>;

/**
 * Generates PNG bytes using the shared repository card renderer.
 * Rejects invalid options and rendering failures. Non-ASCII fonts and remote avatars require network access.
 * @example
 * const png = await generateImage({ owner: "octocat", repo: "hello-world", stars: 1200 });
 * await writeFile("og.png", png);
 */
export const generateImage = async (options: GenerateImageOptions) => {
  const data = optionsSchema.parse(options);
  const fonts = await loadFonts(collectText([data.owner, data.repo, data.description]), fileURLToPath(new URL("./fonts/", import.meta.url)));
  if (fonts.length < 2) throw new Error("Bundled fonts could not be loaded.");
  const response = new ImageResponse(<OgImage data={data} />, { width: OG_W, height: OG_H, fonts });
  return Buffer.from(await response.arrayBuffer());
};
