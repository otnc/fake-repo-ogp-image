"use client";

import { useState } from "react";
import type { RepoData } from "@/lib/types";
import { importRepo } from "@/lib/github";

// GitHub の公開リポジトリから実データを取得して入力欄へ反映する。
export default function ImportBar({
  update,
}: {
  update: (patch: Partial<RepoData>) => void;
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      update(await importRepo(input));
    } catch (e) {
      setError(e instanceof Error ? e.message : "インポートに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          placeholder="owner/repo または https://github.com/owner/repo"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
        />
        <button
          onClick={run}
          disabled={loading}
          className="shrink-0 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {loading ? "取得中…" : "インポート"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-xs text-neutral-400">
        公開リポジトリの実データを取得します (Used by / Discussions は API で取得できません)。
      </p>
    </div>
  );
}
