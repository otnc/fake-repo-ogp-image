"use client";

import { useState } from "react";
import { fetchCardImage } from "@/lib/fetch-card-image";
import type { RepoData } from "@/lib/types";

// Downloads the shared renderer output at twice the card resolution.
export default function DownloadButton({
  data,
  filename,
}: {
  data: RepoData;
  filename: string;
}) {
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    setBusy(true);
    try {
      const dataUrl = URL.createObjectURL(await fetchCardImage(data, 2));
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${filename || "ogp"}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(dataUrl), 1000);
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
