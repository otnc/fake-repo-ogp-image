"use client";

import { useEffect, useRef, useState } from "react";
import type { RepoData } from "@/lib/types";
import { decodeShare } from "@/lib/share";
import Editor from "@/components/editor/Editor";
import Preview from "@/components/preview/Preview";
import DownloadButton from "@/components/DownloadButton";
import ShareButton from "@/components/ShareButton";

// 初期表示 / リセット時のデフォルト値
const INITIAL: RepoData = {
  avatar: null,
  useGithubAvatar: false,
  avatarFallback: "identicon", // 画像未指定時はランダムアイコン
  identiconSeed: 1,
  owner: "octocat",
  repo: "hello-world",
  description: "My first repository on GitHub!",
  languages: [],
  othersColor: "#ededed",
  // 値はすべて 0。デフォルト表示は Contributors / Issues / Stars / Forks
  contributors: 0,
  usedBy: 0,
  issues: 0,
  pullRequests: 0,
  discussions: 0,
  stars: 0,
  forks: 0,
  hiddenStats: ["usedBy", "pullRequests", "discussions"],
  theme: "light",
};

export default function Home() {
  const [data, setData] = useState<RepoData>(INITIAL);
  const cardRef = useRef<HTMLDivElement>(null);

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
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            GitHub OGP 風画像ジェネレーター
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            すべてブラウザ内で生成します。値を入力して PNG をダウンロードできます。
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
            <Preview data={data} cardRef={cardRef} />
            <div className="flex flex-wrap items-start gap-3">
              <DownloadButton
                cardRef={cardRef}
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
