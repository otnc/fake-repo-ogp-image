import type { LanguageEntry } from "@/lib/types";
import type { Palette } from "@/lib/theme";

type Segment = { name: string; color: string; percent: number };

// 言語一覧に「Others」(残り%)を足したセグメント配列を作る。
export function toSegments(
  languages: LanguageEntry[],
  othersColor: string,
): Segment[] {
  const used = languages.reduce((s, l) => s + (l.percent || 0), 0);
  const segments: Segment[] = languages
    .filter((l) => l.percent > 0)
    .map((l) => ({ name: l.name || "Unknown", color: l.color, percent: l.percent }));
  const rest = 100 - used;
  if (rest > 0.05) segments.push({ name: "Others", color: othersColor, percent: rest });
  return segments;
}

// 本家同様、カード最下端のフルブリード言語バー (凡例なし)。
export default function LanguageStripe({
  languages,
  othersColor,
  palette,
}: {
  languages: LanguageEntry[];
  othersColor: string;
  palette: Palette;
}) {
  const segments = toSegments(languages, othersColor);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 16,
        display: "flex",
        background: palette.track,
      }}
    >
      {segments.map((s, i) => (
        <div key={i} style={{ width: `${s.percent}%`, background: s.color }} />
      ))}
    </div>
  );
}
