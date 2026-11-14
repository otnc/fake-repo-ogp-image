import { ImageResponse } from "@vercel/og";
import sharp from "sharp";
import { z } from "zod";
import OgImage from "../components/preview/OgpCard";
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
export const renderImage = async (options: GenerateImageOptions, fontDirectory: string, pixelRatio = 2) => {
  const ratio = z.number().int().min(1).max(4).parse(pixelRatio);
  const data = await resolveRemoteAvatar(createRepoData(options));
  const fonts = await loadFonts(collectText([data.owner, data.repo, data.description]), fontDirectory);
  if (fonts.length < 2) throw new Error("Bundled fonts could not be loaded.");
  const response = new ImageResponse(
    <div style={{ display: "flex", width: 1200 * ratio, height: 600 * ratio }}>
      <div style={{ display: "flex", transform: `scale(${ratio})`, transformOrigin: "top left" }}><OgImage data={data} /></div>
    </div>,
    { width: 1200 * ratio, height: 600 * ratio, fonts },
  );
  return Buffer.from(await response.arrayBuffer());
};
