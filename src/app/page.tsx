"use client";

import { useEffect, useState } from "react";
import type { RepoData } from "@/lib/types";
import { decodeShare } from "@/lib/share";
import Editor from "@/components/editor/Editor";
import Preview from "@/components/preview/Preview";
import DownloadButton from "@/components/DownloadButton";
import ShareButton from "@/components/ShareButton";

import { INITIAL } from "@/lib/repo-options";

export default function Home() {
  const [data, setData] = useState<RepoData>(INITIAL);

  // 共有 URL (?d=) で開かれたら復元する。SSR と一致させるため初回マウント後に行う
  useEffect(() => {
    const d = new URLSearchParams(window.location.search).get("d");
    const loaded = d && decodeShare(d);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (loaded) setData(loaded);
  }, []);

  // 部分更新ヘルパー: 子からはこれ 1 つで状態を変える
  const update = (patch: Partial<RepoData>) => setData((d) => ({ ...d, ...patch }));

  // デフォルト値に戻す
  const resetToDefault = () => {
    if (confirm("デフォルトに戻しますか?")) setData(INITIAL);
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">
        <a href="https://www.npmjs.com/package/fake-repo-ogp-image" className="font-medium underline decoration-blue-300 underline-offset-4 hover:decoration-blue-700">
          APIとCLIが登場しました✨️
        </a>
        <span className="ml-2">npmからインストールして使えます。</span>
      </div>
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            GitHub OGP 風画像ジェネレーター
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            値を入力してプレビューを確認し、PNG をダウンロードできます。
          </p>
        </div>
        <button
          onClick={resetToDefault}
          className="shrink-0 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100"
        >
          全てクリア
        </button>
      </header>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_minmax(0,640px)]">
        {/* 左: 入力フォーム */}
        <Editor data={data} update={update} />

        {/* 右: プレビュー + ダウンロード (スクロール追従) */}
        <div className="lg:sticky lg:top-10 lg:self-start">
          <div className="space-y-4">
            <Preview data={data} />
            <div className="flex flex-wrap items-start gap-3">
              <DownloadButton
                data={data}
                filename={`${data.owner || "owner"}-${data.repo || "repo"}`}
              />
              <ShareButton data={data} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
