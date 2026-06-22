// GitHub の公開リポジトリから実データを取得して RepoData の一部を作る。
// 基本情報 (stars/forks/description): ungh.cc (非公式キャッシュ型プロキシ) を優先し、
// 失敗時は公式 REST API にフォールバック。
// 言語・コントリビューター・Issues は公式 API の別クォータを使用。
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

type RepoBasic = {
  ownerLogin: string;
  repoName: string;
  description: string;
  avatarUrl: string | null;
  stars: number;
  forks: number;
  openIssuesCount: number;
};

// ungh.cc (非公式) → 公式 REST API の順で基本情報を取得。
// ungh.cc は GitHub API レート制限を回避できるキャッシュ型プロキシ。
async function fetchRepoBasic(owner: string, repo: string): Promise<RepoBasic> {
  try {
    const res = await fetch(`https://ungh.cc/repos/${owner}/${repo}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const { repo: r } = await res.json();
      return {
        ownerLogin: owner,
        repoName: r.name ?? repo,
        description: r.description ?? "",
        // ungh.cc には avatar_url がないので GitHub のアバター URL を直接組む
        avatarUrl: `https://github.com/${encodeURIComponent(owner)}.png`,
        stars: r.stars ?? 0,
        forks: r.forks ?? 0,
        openIssuesCount: 0, // ungh.cc にはない。Issues は Search API で取得
      };
    }
  } catch {
    // タイムアウト・ネットワークエラー → 公式 API へフォールバック
  }

  // 公式 REST API (フォールバック)
  const res = await gh(`https://api.github.com/repos/${owner}/${repo}`);
  if (res.status === 404) throw new Error("リポジトリが見つかりません");
  if (res.status === 403) throw new Error("GitHub API のレート制限に達した可能性があります");
  if (!res.ok) throw new Error(`取得に失敗しました (${res.status})`);
  const r = await res.json();
  return {
    ownerLogin: r.owner?.login ?? owner,
    repoName: r.name ?? repo,
    description: r.description ?? "",
    avatarUrl: r.owner?.avatar_url ?? null,
    stars: r.stargazers_count ?? 0,
    forks: r.forks_count ?? 0,
    openIssuesCount: r.open_issues_count ?? 0,
  };
}

// owner/repo または URL からカードの内容を取得する。
// Used by / Discussions は API で取れないので含めない。
export async function importRepo(input: string): Promise<Partial<RepoData>> {
  const parsed = parseRepoInput(input);
  if (!parsed) throw new Error("owner/repo か GitHub の URL を入力してください");
  const { owner, repo } = parsed;

  // 基本情報を先に取得してリポジトリ存在を確認してから他データを並列取得
  const basic = await fetchRepoBasic(owner, repo);

  const [languages, contributors, counts] = await Promise.all([
    fetchLanguages(owner, repo),
    fetchContributorCount(owner, repo),
    fetchIssuePrCounts(owner, repo),
  ]);

  return {
    owner: basic.ownerLogin,
    repo: basic.repoName,
    description: basic.description,
    avatar: basic.avatarUrl,
    useGithubAvatar: false,
    languages,
    contributors,
    usedBy: 0,
    // Search API が取れた値を優先し、なければ公式 API のまとめカウントを使う
    issues: counts.issues ?? basic.openIssuesCount,
    pullRequests: counts.pullRequests ?? 0,
    discussions: 0,
    stars: basic.stars,
    forks: basic.forks,
  };
}

// open の Issue / PR 件数を取得。
// ブラウザから github.com を直接 fetch すると CORS ブロックされるため、
// サーバーサイドプロキシ (/api/proxy/gh-counts) 経由でスクレイピング。
// 失敗時は GitHub Search API (別クォータ 10 req/min) にフォールバック。
async function fetchIssuePrCounts(
  owner: string,
  repo: string,
): Promise<{ issues: number | null; pullRequests: number | null }> {
  try {
    const url = `/api/proxy/gh-counts?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data = await res.json();
      if (data.issues !== null || data.pullRequests !== null) return data;
    }
  } catch {
    // フォールバックへ
  }

  // フォールバック: GitHub Search API (別クォータ 10 req/min)
  const countViaSearch = async (type: "issue" | "pr"): Promise<number | null> => {
    const q = encodeURIComponent(`repo:${owner}/${repo} type:${type} state:open`);
    const r = await gh(`https://api.github.com/search/issues?q=${q}&per_page=1`);
    if (!r.ok) return null;
    return (await r.json()).total_count ?? null;
  };
  try {
    const [issues, pullRequests] = await Promise.all([
      countViaSearch("issue"),
      countViaSearch("pr"),
    ]);
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
