// アプリ全体で共有する型

export type Theme = "light" | "dark";

// 言語バーの 1 セグメント
export type LanguageEntry = {
  id: string; // React の key 用の一意な値
  name: string; // 言語名
  color: string; // 表示色 (hex)
  percent: number; // 0〜100
};

// 画像未指定のときの挙動
export type AvatarFallback = "none" | "identicon";

// 統計の種類
export type StatKey =
  | "contributors"
  | "usedBy"
  | "issues"
  | "pullRequests"
  | "discussions"
  | "stars"
  | "forks";

// カードに表示する全データ。page.tsx が状態として保持する
export type RepoData = {
  avatar: string | null; // アップロード画像(data URL) または画像 URL
  useGithubAvatar: boolean; // ON なら https://github.com/{owner}.png を使う
  avatarFallback: AvatarFallback; // 画像も GitHub も無いときの表示
  identiconSeed: number; // identicon の種 (reload で変わる)
  owner: string;
  repo: string;
  description: string;
  languages: LanguageEntry[];
  othersColor: string; // 合計 100% に満たない残り (Others) の色
  // 統計の値は常に保持し、表示/非表示は hiddenStats で管理する
  // (チェックを外しても値は消えない)
  contributors: number;
  usedBy: number;
  issues: number;
  pullRequests: number;
  discussions: number;
  stars: number;
  forks: number;
  hiddenStats: StatKey[]; // 非表示にする統計
  theme: Theme;
};
