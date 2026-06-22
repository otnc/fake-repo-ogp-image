// 各種設定から「実際にカードへ出すアバター」を 1 つに決める。
import type { RepoData } from "./types";

export type ResolvedAvatar =
  | { kind: "image"; src: string } // 画像 URL / data URL
  | { kind: "identicon"; seed: string }
  | null;

// 優先順: GitHub アバター > 指定画像 > identicon > なし
export function resolveAvatar(d: RepoData): ResolvedAvatar {
  if (d.useGithubAvatar && d.owner) {
    return { kind: "image", src: `https://github.com/${encodeURIComponent(d.owner)}.png` };
  }
  if (d.avatar) return { kind: "image", src: d.avatar };
  if (d.avatarFallback === "identicon") return { kind: "identicon", seed: String(d.identiconSeed) };
  return null;
}
