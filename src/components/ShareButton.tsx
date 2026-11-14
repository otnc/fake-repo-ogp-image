"use client";

import { useState } from "react";
import { buildShareUrl } from "@/lib/share-url";
import { shrinkForShare } from "@/lib/image";
import type { RepoData } from "@/lib/types";


// 共有 URL (/share?d=...) を生成してクリップボードへコピーする。
export default function ShareButton({ data }: { data: RepoData }) {
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function copy() {
    try {
      const { url, avatarDropped } = await buildShareUrl(data, window.location.origin, shrinkForShare);
      setNote(avatarDropped ? "画像が大きすぎるため、共有 URL にはアバターを含めませんでした" : null);
      await navigator.clipboard.writeText(url);
    } catch (error) {
      setNote(error instanceof Error ? error.message : "共有 URL の生成に失敗しました");
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-1">
      <button
        onClick={copy}
        className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100"
      >
        {copied ? "コピーしました" : "共有 URL をコピー"}
      </button>
      {note && <p className="text-xs text-amber-600">{note}</p>}
    </div>
  );
}
