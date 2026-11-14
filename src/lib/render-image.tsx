import satori from "satori";
import sharp from "sharp";
import { z } from "zod";
import OgImage, { OG_W, OG_H } from "../components/preview/OgpCard";
import { PALETTES } from "./theme";
import { createRepoData, type GenerateImageOptions } from "./repo-options";
import { collectText, loadFonts } from "./og-fonts";
import type { RepoData } from "./types";

const resolveImage = async (source: string) => {
  const response = await fetch(source, { signal: AbortSignal.timeout(5000) });
  if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) throw new Error("Avatar could not be loaded.");
  const png = await sharp(Buffer.from(await response.arrayBuffer())).rotate().png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
};

/** Resolves avatars in priority order, retaining the configured fallback on image failures. */
export const resolveRemoteAvatar = async (data: RepoData) => {
  const sources = [
    ...(data.useGithubAvatar && data.owner ? [`https://github.com/${encodeURIComponent(data.owner)}.png?size=460`] : []),
    ...(data.avatar ? [data.avatar] : []),
  ];
  for (const source of sources) {
    try {
      const avatar = await resolveImage(source);
      return { ...data, avatar, useGithubAvatar: false };
    } catch {
      // A missing GitHub avatar falls through to the uploaded image, then the identicon.
    }
  }
  return { ...data, avatar: null, useGithubAvatar: false };
};

/** Renders the shared card, with an integer pixel ratio from 1 through 4. */
export const renderImage = async (
  options: GenerateImageOptions,
  fontDirectory: string,
  pixelRatio = 2,
  size?: { width: number; height: number },
) => {
  const ratio = z.number().int().min(1).max(4).parse(pixelRatio);
  const data = await resolveRemoteAvatar(createRepoData(options));
  const fonts = await loadFonts(collectText([data.owner, data.repo, data.description]), fontDirectory);
  if (fonts.length < 2) throw new Error("Bundled fonts could not be loaded.");
  const svg = await satori(<OgImage data={data} />, {
    width: OG_W,
    height: OG_H,
    fonts,
    loadAdditionalAsset: async (language, segment) => {
      if (language !== "emoji") return [];
      const normalized = segment.includes("\u200d") ? segment : segment.replace(/\ufe0f/g, "");
      const code = Array.from(normalized, (character) => character.codePointAt(0)!.toString(16)).join("-");
      const response = await fetch(`https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${code}.svg`, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error(`Emoji image could not be loaded: ${code}`);
      return `data:image/svg+xml;base64,${Buffer.from(await response.arrayBuffer()).toString("base64")}`;
    },
  });
  if (!size) return sharp(Buffer.from(svg), { density: 72 * ratio }).png().toBuffer();

  const scale = Math.min(size.width / OG_W, size.height / OG_H);
  return sharp(Buffer.from(svg), { density: Math.max(1, 72 * scale) })
    .resize(size.width, size.height, { fit: "contain", background: PALETTES[data.theme].bg })
    .png()
    .toBuffer();
};
