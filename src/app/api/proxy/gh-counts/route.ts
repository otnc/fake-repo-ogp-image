// GitHub リポジトリページを HTML スクレイプして Issues/PR 件数を返す。
// ブラウザから github.com を直接 fetch すると CORS でブロックされるため、
// サーバーサイドでスクレイプしてクライアントに返す。
export const runtime = "nodejs";

// 英数字・ハイフン・ドット・アンダースコアのみ許可 (パストラバーサル防止)
const SAFE = /^[A-Za-z0-9_.\-]+$/;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const owner = searchParams.get("owner") ?? "";
  const repo = searchParams.get("repo") ?? "";
  if (!SAFE.test(owner) || !SAFE.test(repo)) {
    return Response.json({ issues: null, pullRequests: null });
  }

  try {
    const res = await fetch(`https://github.com/${owner}/${repo}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return Response.json({ issues: null, pullRequests: null });

    const html = await res.text();
    const parseTabCount = (id: string): number | null => {
      const m = new RegExp(`id="${id}"[^>]*title="([\\d,]+)"`).exec(html);
      return m ? parseInt(m[1].replace(/,/g, ""), 10) : null;
    };
    return Response.json({
      issues: parseTabCount("issues-repo-tab-count"),
      pullRequests: parseTabCount("pull-requests-repo-tab-count"),
    });
  } catch {
    return Response.json({ issues: null, pullRequests: null });
  }
}
