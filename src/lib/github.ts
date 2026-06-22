// GitHub の公開リポジトリから実データを取得して RepoData の一部を作る。
// 認証なしの GitHub REST API (api.github.com) を使う (60 req/h・CORS 許可)。
import type { RepoData, LanguageEntry } from "./types";
import { loadLanguages } from "./languages";

// "owner/repo" でも GitHub URL でも owner/repo を取り出す
export function parseRepoInput(input: string): { owner: string; repo: string } | null {
  const s = input
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^(www\.)?github\.com\//, "");
  const [owner, repo] = s.split("/");
  if (!owner || !repo) return null;
  return { owner, repo: repo.replace(/\.git$/, "") };
}

function gh(url: string): Promise<Response> {
  return fetch(url, { headers: { Accept: "application/vnd.github+json" } });
}

// owner/repo または URL からカードの内容を取得する。
// Used by / Discussions は API で取れないので含めない (null = 非表示)。
export async function importRepo(input: string): Promise<Partial<RepoData>> {
  const parsed = parseRepoInput(input);
  if (!parsed) throw new Error("owner/repo か GitHub の URL を入力してください");
  const { owner, repo } = parsed;

  const res = await gh(`https://api.github.com/repos/${owner}/${repo}`);
  if (res.status === 404) throw new Error("リポジトリが見つかりません");
  if (res.status === 403) throw new Error("GitHub API のレート制限に達した可能性があります");
  if (!res.ok) throw new Error(`取得に失敗しました (${res.status})`);
  const r = await res.json();

  const [languages, contributors, counts] = await Promise.all([
    fetchLanguages(owner, repo),
    fetchContributorCount(owner, repo),
    fetchIssuePrCounts(owner, repo),
  ]);

  // 取れる値はすべて取得する。Used by / Discussions は公開 API で取れないため 0。
  // hiddenStats は更新しないので、PR は既定どおり非表示のまま (値だけ入る)。
  return {
    owner: r.owner?.login ?? owner,
    repo: r.name ?? repo,
    description: r.description ?? "",
    avatar: r.owner?.avatar_url ?? null,
    useGithubAvatar: false,
    languages,
    contributors,
    usedBy: 0,
    // Search が使えないときは open_issues_count (PR 込み) で代用
    issues: counts.issues ?? r.open_issues_count ?? 0,
    pullRequests: counts.pullRequests ?? 0,
    discussions: 0,
    stars: r.stargazers_count ?? 0,
    forks: r.forks_count ?? 0,
  };
}

// open の Issue / PR 件数を分けて取る (Search API)。失敗時は null。
async function fetchIssuePrCounts(
  owner: string,
  repo: string,
): Promise<{ issues: number | null; pullRequests: number | null }> {
  const count = async (type: "issue" | "pr"): Promise<number | null> => {
    const q = encodeURIComponent(`repo:${owner}/${repo} type:${type} state:open`);
    const res = await gh(`https://api.github.com/search/issues?q=${q}&per_page=1`);
    if (!res.ok) return null;
    return (await res.json()).total_count ?? null;
  };
  try {
    const [issues, pullRequests] = await Promise.all([count("issue"), count("pr")]);
    return { issues, pullRequests };
  } catch {
    return { issues: null, pullRequests: null };
  }
}

// 言語のバイト数から % を計算し、色を github-colors.json から引く
async function fetchLanguages(owner: string, repo: string): Promise<LanguageEntry[]> {
  const res = await gh(`https://api.github.com/repos/${owner}/${repo}/languages`);
  if (!res.ok) return [];
  const bytesOf: Record<string, number> = await res.json();
  const entries = Object.entries(bytesOf).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, b]) => s + b, 0);
  if (!total) return [];

  const colors = await loadLanguages();
  const list: LanguageEntry[] = entries.map(([name, bytes]) => ({
    id: crypto.randomUUID(),
    name,
    color: colors.find((c) => c.name.toLowerCase() === name.toLowerCase())?.color ?? "#cccccc",
    percent: Math.round((bytes / total) * 1000) / 10,
  }));
  // 端数を最大言語へ寄せて合計をちょうど 100% にする
  if (list.length) {
    const sum = list.reduce((s, l) => s + l.percent, 0);
    list[0].percent = Math.round((list[0].percent + 100 - sum) * 10) / 10;
  }
  return list;
}

// コントリビューター数。per_page=1 にして Link ヘッダの最終ページ番号 = 総数。
async function fetchContributorCount(owner: string, repo: string): Promise<number> {
  const res = await gh(
    `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=1&anon=true`,
  );
  if (!res.ok) return 0;
  const last = res.headers.get("Link")?.match(/[?&]page=(\d+)>;\s*rel="last"/);
  if (last) return Number(last[1]);
  const arr = await res.json();
  return Array.isArray(arr) ? arr.length : 0;
}
