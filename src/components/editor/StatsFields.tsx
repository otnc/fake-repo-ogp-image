"use client";

import type { RepoData, StatKey } from "@/lib/types";

// 統計の入力。チェックで表示/非表示を切り替える (外しても値は保持される)。
// デフォルト表示は Contributors / Issues / Stars / Forks。
const STATS: { key: StatKey; label: string }[] = [
  { key: "contributors", label: "Contributors" },
  { key: "usedBy", label: "Used by" },
  { key: "issues", label: "Issues" },
  { key: "pullRequests", label: "Pull requests" },
  { key: "discussions", label: "Discussions" },
  { key: "stars", label: "Stars" },
  { key: "forks", label: "Forks" },
];

export default function StatsFields({
  data,
  update,
}: {
  data: RepoData;
  update: (patch: Partial<RepoData>) => void;
}) {
  // 表示/非表示の切り替え (値はそのまま)
  const setVisible = (key: StatKey, show: boolean) =>
    update({
      hiddenStats: show
        ? data.hiddenStats.filter((k) => k !== key)
        : [...data.hiddenStats, key],
    });

  return (
    <div className="grid grid-cols-2 gap-3">
      {STATS.map(({ key, label }) => {
        const visible = !data.hiddenStats.includes(key);
        return (
          <div key={key}>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-neutral-700">
              <input
                type="checkbox"
                checked={visible}
                onChange={(e) => setVisible(key, e.target.checked)}
              />
              {label}
            </label>
            <input
              type="number"
              min={0}
              disabled={!visible}
              value={data[key]}
              onChange={(e) =>
                update({ [key]: Math.max(0, Number(e.target.value) || 0) } as Pick<RepoData, StatKey>)
              }
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500 disabled:bg-neutral-100 disabled:text-neutral-400"
            />
          </div>
        );
      })}
    </div>
  );
}
