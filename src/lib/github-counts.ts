/** Reads issue and pull request counts from the repository navigation tabs. */
export const fetchGithubCounts = async (owner: string, repo: string) => {
  if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo)) return { issues: null, pullRequests: null };
  try {
    const res = await fetch(`https://github.com/${owner}/${repo}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return { issues: null, pullRequests: null };

    const html = await res.text();
    const parseTabCount = (id: string): number | null => {
      const m = new RegExp(`id="${id}"[^>]*title="([\\d,]+)"`).exec(html);
      return m ? parseInt(m[1].replace(/,/g, ""), 10) : null;
    };
    return {
      issues: parseTabCount("issues-repo-tab-count"),
      pullRequests: parseTabCount("pull-requests-repo-tab-count"),
    };
  } catch {
    return { issues: null, pullRequests: null };
  }
};
