import type { Palette } from "@/lib/theme";
import { formatCount } from "@/lib/format";
import { STAT_ICON_SIZE } from "./stats";

const GAP = 9; // アイコンと数値の間隔

// カード下部の統計 1 項目。
// アイコンは数値と同じ行に置いて高さを合わせ、ラベルは数値の左端にそろえる。
export default function StatItem({
  icon,
  value,
  label,
  palette,
  compact = false,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  palette: Palette;
  compact?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: compact ? 220 : "auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: GAP }}>
        <span style={{ color: palette.muted, display: "flex" }}>{icon}</span>
        <span style={{ color: palette.text, fontSize: compact ? 28 : 34, fontWeight: 500, lineHeight: 1.1 }}>
          {formatCount(value)}
        </span>
      </div>
      {/* アイコン幅 + gap だけ右へ寄せて数値の左端にそろえる */}
      <span style={{ marginLeft: STAT_ICON_SIZE + GAP, color: palette.muted, fontSize: compact ? 18 : 22 }}>
        {label}
      </span>
    </div>
  );
}
