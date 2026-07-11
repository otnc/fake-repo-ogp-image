// GitHub ユーザー/Org のアバター画像をサーバー経由で取得して返す。
// github.com への直接 fetch はブラウザで CORS ブロックされるため、
// このルート経由で画像を取得し、クライアントが data URL 変換できるようにする。
export const runtime = "nodejs";

const SAFE = /^[A-Za-z0-9_.\-]+$/;

export async function GET(req: Request) {
  const owner = new URL(req.url).searchParams.get("owner") ?? "";
  if (!SAFE.test(owner)) return new Response(null, { status: 400 });

  try {
    // size=460: PNG 書き出しは高解像度 (pixelRatio 2) なので大きめに取る
    const res = await fetch(`https://github.com/${owner}.png?size=460`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return new Response(null, { status: 404 });

    const buf = await res.arrayBuffer();
    return new Response(buf, {
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response(null, { status: 500 });
  }
}
