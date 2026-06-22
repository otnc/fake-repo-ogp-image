"use client";

import { useState, type RefObject } from "react";
import { toPng } from "html-to-image";

// プレビューカードの実寸ノードを PNG にして保存する (すべてブラウザ内で完結)
export default function DownloadButton({
  cardRef,
  filename,
}: {
  cardRef: RefObject<HTMLDivElement | null>;
  filename: string;
}) {
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      // pixelRatio: 2 で高解像度 (2400x1200) に書き出す
      const dataUrl = await toPng(cardRef.current, {
        width: 1200,
        height: 600,
        pixelRatio: 2,
        cacheBust: true,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${filename || "ogp"}.png`;
      a.click();
    } catch (e) {
      console.error(e);
      alert("画像の生成に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={busy}
      className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
    >
      {busy ? "生成中…" : "PNG をダウンロード"}
    </button>
  );
}
