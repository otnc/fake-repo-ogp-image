import { encodeShare, decodeShare } from "./share";
import { createRepoData, type GenerateImageOptions } from "./repo-options";
import { PALETTES } from "./theme";

/** Creates a share URL and reports when the avatar was omitted to fit the URL budget. */
export const buildShareUrl = async (
  options: GenerateImageOptions,
  baseUrl: string,
  shrink: (source: string, background: string, size: number) => Promise<string>,
) => {
  const data = createRepoData(options);
  const payload = { ...data, avatar: data.useGithubAvatar && data.owner ? null : data.avatar };
  if (payload.avatar?.startsWith("data:")) {
    const source = payload.avatar;
    payload.avatar = null;
    for (const size of [120, 96, 72]) {
      try {
        const avatar = await shrink(source, PALETTES[data.theme].bg, size);
        if (encodeShare({ ...payload, avatar }).length <= 10000) {
          payload.avatar = avatar;
          break;
        }
      } catch {
        break;
      }
    }
  }
  if (encodeShare(payload).length > 10000) payload.avatar = null;
  const encoded = encodeShare(payload);
  if (encoded.length > 10000) throw new Error("Card text exceeds the share URL size limit.");
  const url = new URL("/share", baseUrl);
  if (!["https:", "http:"].includes(url.protocol)) throw new Error("Share URLs require HTTP or HTTPS.");
  url.searchParams.set("d", encoded);
  return { url: url.href, avatarDropped: Boolean(data.avatar && !payload.avatar && !(data.useGithubAvatar && data.owner)) };
};

/** Reads a share URL or its encoded payload, including legacy hidden-stat settings. */
export const parseShareUrl = (input: string) => {
  const encoded = /^https?:\/\//.test(input) ? new URL(input).searchParams.get("d") : input;
  const data = encoded && decodeShare(encoded);
  if (!data) throw new Error("Invalid share URL or payload.");
  return data;
};
