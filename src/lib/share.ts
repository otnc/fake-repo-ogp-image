// 共有用に RepoData を URL クエリ (?d=) へエンコード/デコードする。
// アバターは http(s) URL のみ載せる (data URL は長すぎるため共有不可)。
import type { RepoData, LanguageEntry, Theme, StatKey } from "./types";

// --- UTF-8 対応の base64url (ブラウザ / Node / Edge 共通) ---
function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

// avatar は http(s) URL か (共有用に縮小済みの) data URL のみ載せる
const SHAREABLE_AVATAR = /^(https?:|data:image\/)/;

export function encodeShare(data: RepoData): string {
  const avatar = data.avatar && SHAREABLE_AVATAR.test(data.avatar) ? data.avatar : null;
  return toBase64Url(JSON.stringify({ ...data, avatar }));
}

export function decodeShare(d: string): RepoData | null {
  try {
    return normalize(JSON.parse(fromBase64Url(d)));
  } catch {
    return null;
  }
}

const STAT_KEYS: StatKey[] = [
  "contributors",
  "usedBy",
  "issues",
  "pullRequests",
  "discussions",
  "stars",
  "forks",
];

// 外部から来た値なので型と範囲を安全側に整える
function normalize(o: Record<string, unknown>): RepoData {
  const num = (v: unknown, def = 0) => (Number.isFinite(Number(v)) ? Number(v) : def);
  const str = (v: unknown, def = "") => (typeof v === "string" ? v : def);

  // hiddenStats: 新形式は配列。旧形式 (統計が null=非表示) からも移行する
  const hiddenStats = Array.isArray(o.hiddenStats)
    ? o.hiddenStats.filter((k): k is StatKey => STAT_KEYS.includes(k as StatKey))
    : STAT_KEYS.filter((k) => o[k] === null || o[k] === undefined);

  const languages: LanguageEntry[] = Array.isArray(o.languages)
    ? (o.languages as unknown[]).slice(0, 12).map((l, i) => {
        const e = (l ?? {}) as Record<string, unknown>;
        return {
          id: str(e.id, String(i)),
          name: str(e.name),
          color: str(e.color, "#cccccc"),
          percent: Math.max(0, Math.min(100, num(e.percent))),
        };
      })
    : [];

  return {
    avatar: o.avatar && SHAREABLE_AVATAR.test(String(o.avatar)) ? String(o.avatar) : null,
    useGithubAvatar: o.useGithubAvatar === true,
    avatarFallback: o.avatarFallback === "identicon" ? "identicon" : "none",
    identiconSeed: num(o.identiconSeed, 1),
    owner: str(o.owner),
    repo: str(o.repo),
    description: str(o.description),
    languages,
    othersColor: str(o.othersColor, "#ededed"),
    contributors: num(o.contributors),
    usedBy: num(o.usedBy),
    issues: num(o.issues),
    pullRequests: num(o.pullRequests),
    discussions: num(o.discussions),
    stars: num(o.stars),
    forks: num(o.forks),
    hiddenStats,
    theme: (o.theme === "dark" ? "dark" : "light") as Theme,
  };
}
