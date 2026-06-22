// public/github-colors.json を読み込み、言語の色を引けるようにする

export type LanguageColor = { name: string; color: string };

// JSON の生の形 (色が null の言語もある)
type RawColors = Record<string, { color: string | null; url: string | null }>;

let cache: LanguageColor[] | null = null;

// 全言語を一度だけ取得してキャッシュ (色が付いているものだけ、名前順)
export async function loadLanguages(): Promise<LanguageColor[]> {
  if (cache) return cache;
  const res = await fetch("/github-colors.json");
  const raw: RawColors = await res.json();
  cache = Object.entries(raw)
    .filter(([, v]) => !!v.color)
    .map(([name, v]) => ({ name, color: v.color as string }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return cache;
}
