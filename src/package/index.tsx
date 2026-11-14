import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { renderImage } from "../lib/render-image";
import { buildShareUrl } from "../lib/share-url";
import { loadAvatar } from "./avatar-file";
import type { GenerateImageOptions } from "../lib/repo-options";

export { createRepoData } from "../lib/repo-options";
export type { GenerateImageOptions } from "../lib/repo-options";
export type { RepoData, LanguageEntry, Theme, StatKey } from "../lib/types";
export { listLanguages, languageColor } from "../lib/languages";
export { importRepo, parseRepoInput } from "../lib/github";
export { encodeShare, decodeShare } from "../lib/share";
export { parseShareUrl } from "../lib/share-url";
export { loadAvatar } from "./avatar-file";
export { createIdenticonSeed } from "../lib/identicon";

const withLocalAvatar = async (options: GenerateImageOptions) => ({
  ...options,
  avatar: options.avatar && !/^(https?:|data:image\/)/.test(options.avatar) ? await loadAvatar(options.avatar) : options.avatar,
});

/**
 * Generates a PNG using the same renderer as web previews and downloads.
 * Defaults to 2400 × 1200. Set pixelRatio to 1 for 1200 × 600; ratios 1–4 are supported.
 * Rejects invalid settings or rendering failures. Remote avatars and Japanese fonts require network access.
 * @example
 * await writeFile("og.png", await generateImage({ owner: "octocat", repo: "hello-world" }));
 */
export const generateImage = async (options: GenerateImageOptions = {}, rendering: { pixelRatio?: number } = {}) =>
  renderImage(await withLocalAvatar(options), fileURLToPath(new URL("./fonts/", import.meta.url)), rendering.pixelRatio);

/**
 * Creates a web share URL, compressing embedded avatars and reporting omissions.
 * baseUrl is the deployed web editor origin. Rejects invalid settings or oversized text.
 * @example
 * const { url, avatarDropped } = await createShareUrl({ owner: "octocat" }, "https://example.com");
 */
export const createShareUrl = async (options: GenerateImageOptions, baseUrl: string) =>
  buildShareUrl(await withLocalAvatar(options), baseUrl, async (source, background, size) => {
    const response = await fetch(source);
    const bytes = await response.arrayBuffer();
    const image = await sharp(Buffer.from(bytes))
      .rotate().resize(size, size, { fit: "inside", withoutEnlargement: true })
      .flatten({ background }).jpeg({ quality: 82 }).toBuffer();
    return `data:image/jpeg;base64,${image.toString("base64")}`;
  });
