import type { ReactNode } from "react";
import type { RepoData, StatKey } from "@/lib/types";
import {
  People,
  PackageDependencies,
  IssueOpened,
  GitPullRequest,
  CommentDiscussion,
  Star,
  RepoForked,
} from "@/components/icons/Octicons";

// 統計アイコンのサイズ (StatItem のラベル位置もこれに合わせる)
export const STAT_ICON_SIZE = 30;

type Stat = { key: StatKey; value: number; label: string; icon: ReactNode };

// 表示順どおりの統計一覧 (hiddenStats のものは除外)。両カードで共有する。
export function visibleStats(d: RepoData): Stat[] {
  const s = STAT_ICON_SIZE;
  const all: Stat[] = [
    { key: "contributors", value: d.contributors, label: "Contributors", icon: <People size={s} /> },
    { key: "usedBy", value: d.usedBy, label: "Used by", icon: <PackageDependencies size={s} /> },
    { key: "issues", value: d.issues, label: "Issues", icon: <IssueOpened size={s} /> },
    { key: "pullRequests", value: d.pullRequests, label: "Pull requests", icon: <GitPullRequest size={s} /> },
    { key: "discussions", value: d.discussions, label: "Discussions", icon: <CommentDiscussion size={s} /> },
    { key: "stars", value: d.stars, label: "Stars", icon: <Star size={s} /> },
    { key: "forks", value: d.forks, label: "Forks", icon: <RepoForked size={s} /> },
  ];
  return all.filter((stat) => !d.hiddenStats.includes(stat.key));
}
