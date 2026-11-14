import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { z } from "zod";
import { renderImage } from "../lib/render-image";
import { OG_W, OG_H } from "../components/preview/OgpCard";
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

export type ImageRenderingOptions = {
  pixelRatio?: number;
  width?: number;
  height?: number;
};

const imageDimension = z.number().int().min(1).max(8192);

/**
 * Generates a PNG using the same renderer as web previews and downloads.
 * Defaults to 2400 × 1200. Set pixelRatio to 1 for 1200 × 600; ratios 1–4 are supported.
 * Pass width or height in pixels to set the output size instead of pixelRatio.
 * A single dimension preserves the card's aspect ratio. Two dimensions center the card on its theme background.
 * Rejects invalid settings or rendering failures. Remote avatars and Japanese fonts require network access.
 * @example
 * await writeFile("og.png", await generateImage({ owner: "octocat", repo: "hello-world" }));
 */
export const generateImage = async (options: GenerateImageOptions = {}, rendering: ImageRenderingOptions = {}) => {
  const { pixelRatio, width, height } = rendering;
  const fontDirectory = fileURLToPath(new URL("./fonts/", import.meta.url));
  if (width === undefined && height === undefined) {
    return renderImage(await withLocalAvatar(options), fontDirectory, pixelRatio);
  }
  if (pixelRatio !== undefined) throw new Error("Choose either width or height, or pixelRatio.");

  const requested = z.object({ width: imageDimension.optional(), height: imageDimension.optional() }).parse({ width, height });
  const size = {
    width: imageDimension.parse(requested.width ?? Math.round(requested.height! * OG_W / OG_H)),
    height: imageDimension.parse(requested.height ?? Math.max(1, Math.round(requested.width! * OG_H / OG_W))),
  };
  return renderImage(await withLocalAvatar(options), fontDirectory, undefined, size);
};

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
