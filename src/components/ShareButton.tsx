"use client";

import { useState } from "react";
import { encodeShare } from "@/lib/share";
import { shrinkForShare } from "@/lib/image";
import { PALETTES } from "@/lib/theme";
import type { RepoData } from "@/lib/types";

// d が大きくなりすぎると URL 長制限に当たるので上限を設ける
const MAX_D = 10000;

// 共有 URL (/share?d=...) を生成してクリップボードへコピーする。
export default function ShareButton({ data }: { data: RepoData }) {
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function copy() {
    let payload = data;

    if (data.useGithubAvatar && data.owner) {
      // GitHub アバターを data URL に変換して埋め込む。
      // ブラウザから github.com を直接 fetch すると CORS でブロックされるため、
      // サーバーサイドプロキシ (/api/proxy/gh-avatar) 経由で取得する。
      try {
        const src = `/api/proxy/gh-avatar?owner=${encodeURIComponent(data.owner)}`;
        const blob = await fetch(src).then((r) => {
          if (!r.ok) throw new Error("avatar fetch failed");
          return r.blob();
        });
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        const shrunk = await shrinkForShare(dataUrl, PALETTES[data.theme].bg);
        payload = { ...data, avatar: shrunk, useGithubAvatar: false };
      } catch {
        // 取得失敗時はアバターなしで共有
        payload = { ...data, useGithubAvatar: false };
      }
    } else if (data.avatar?.startsWith("data:")) {
      // アップロード画像(data URL)は共有用に縮小して載せる
      try {
        payload = { ...data, avatar: await shrinkForShare(data.avatar, PALETTES[data.theme].bg) };
      } catch {
        payload = { ...data, avatar: null };
      }
    }

    let d = encodeShare(payload);
    // それでも長すぎる場合はアバターを諦める
    if (d.length > MAX_D && payload.avatar) {
      d = encodeShare({ ...payload, avatar: null });
      setNote("画像が大きすぎるため、共有 URL にはアバターを含めませんでした");
    } else {
      setNote(null);
    }

    await navigator.clipboard.writeText(`${window.location.origin}/share?d=${d}`);
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
