// 動的 OGP 画像エンドポイント: /api/og?d=<base64url>
// Discord 等のクローラはこの画像を OGP として読み込む。
import { ImageResponse } from "next/og";
import { decodeShare } from "@/lib/share";
import { collectText, loadFonts } from "@/lib/og-fonts";
import { formatCount } from "@/lib/format";
import type { RepoData } from "@/lib/types";
import OgImage, { OG_W, OG_H } from "./OgImage";

export const runtime = "nodejs";

// d が無い/壊れている場合のサンプル
const FALLBACK: RepoData = {
  avatar: null,
  useGithubAvatar: false,
  avatarFallback: "none",
  identiconSeed: 1,
  owner: "octocat",
  repo: "hello-world",
  description: "GitHub OGP 風画像をブラウザだけで生成できます。",
  languages: [{ id: "1", name: "TypeScript", color: "#3178c6", percent: 80 }],
  othersColor: "#ededed",
  contributors: 24,
  usedBy: 1300,
  issues: 12,
  pullRequests: 0,
  discussions: 0,
  stars: 18200,
  forks: 940,
  hiddenStats: ["pullRequests", "discussions"],
  theme: "light",
};

// フォント部分集合のために、画像に出る全テキストを集める
function textOf(d: RepoData): string {
  const counts = [d.contributors, d.usedBy, d.issues, d.pullRequests, d.discussions, d.stars, d.forks]
    .map(formatCount)
    .join("");
  return collectText([
    d.owner,
    d.repo,
    d.description,
    "Contributors Used by Issues Pull requests Discussions Stars Forks",
    counts,
  ]);
}

// リモート画像のアバターをサーバーサイドで取得して data URL 化する。
// Satori に外部 URL を直接渡すと取得失敗時に画像生成ごと落ちるため、先に解決しておく。
// useGithubAvatar は owner 名から GitHub アバター URL を組む (共有 URL には owner 名だけ載る)。
async function resolveRemoteAvatar(data: RepoData): Promise<RepoData> {
  const url =
    data.useGithubAvatar && data.owner
      ? `https://github.com/${encodeURIComponent(data.owner)}.png?size=460`
      : data.avatar?.startsWith("http")
        ? data.avatar
        : null;
  if (!url) return data;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/")) throw new Error(`avatar ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    return {
      ...data,
      avatar: `data:${type};base64,${buf.toString("base64")}`,
      useGithubAvatar: false,
    };
  } catch {
    // 取得できなければアバターなしで描画を続ける
    return { ...data, avatar: null, useGithubAvatar: false };
  }
}

export async function GET(req: Request) {
  const d = new URL(req.url).searchParams.get("d");
  const data = await resolveRemoteAvatar((d && decodeShare(d)) || FALLBACK);
  const fonts = await loadFonts(textOf(data));

  return new ImageResponse(<OgImage data={data} />, {
    width: OG_W,
    height: OG_H,
    fonts: fonts.length ? fonts : undefined,
  });
}
