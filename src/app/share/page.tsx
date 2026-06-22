// 共有ページ: /share?d=<base64url>
// generateMetadata で OGP メタタグを出し、画像は /api/og?d=... を指す。
// このページ URL を Discord 等に貼ると同じカードがプレビュー表示される。
import type { Metadata } from "next";
import Link from "next/link";
import { decodeShare } from "@/lib/share";

type Props = { searchParams: Promise<{ d?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { d } = await searchParams;
  const data = d ? decodeShare(d) : null;
  const title = data ? `${data.owner}/${data.repo}` : "GitHub OGP 風画像";
  const description = data?.description || "ブラウザだけで作る GitHub OGP 風画像";
  const image = `/api/og${d ? `?d=${encodeURIComponent(d)}` : ""}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 1200, height: 600 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function SharePage({ searchParams }: Props) {
  const { d } = await searchParams;
  const image = `/api/og${d ? `?d=${encodeURIComponent(d)}` : ""}`;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      {/* 生成された OGP 画像をそのまま表示 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="OGP preview" className="w-full rounded-xl border border-neutral-200" />
      <div className="mt-6 flex gap-3">
        <Link
          href={`/${d ? `?d=${encodeURIComponent(d)}` : ""}`}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          このカードを編集する
        </Link>
        <a
          href={image}
          download="ogp.png"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100"
        >
          画像を開く
        </a>
      </div>
    </main>
  );
}
