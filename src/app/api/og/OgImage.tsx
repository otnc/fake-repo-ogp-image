// next/og (Satori) で描画する OGP カード。
// DOM 用 (components/preview) とは別実装 (Satori は flexbox サブセットのみ)。
// パレット・統計部品・アイコン・アバター・%計算は共通ロジックを流用する。
import type { RepoData } from "@/lib/types";
import { PALETTES } from "@/lib/theme";
import { resolveAvatar } from "@/lib/avatar";
import { MarkGithub } from "@/components/icons/Octicons";
import AvatarVisual from "@/components/preview/AvatarVisual";
import StatItem from "@/components/preview/StatItem";
import LanguageStripe from "@/components/preview/LanguageStripe";
import { visibleStats } from "@/components/preview/stats";

export const OG_W = 1200;
export const OG_H = 600;

export default function OgImage({ data }: { data: RepoData }) {
  const p = PALETTES[data.theme];
  const avatar = resolveAvatar(data);

  return (
    <div
      style={{
        position: "relative",
        width: OG_W,
        height: OG_H,
        background: p.bg,
        color: p.text,
        padding: "64px 72px 0 72px",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Arimo", // Latin。日本語は Noto Sans JP にフォールバック
      }}
    >
      {/* アバター/ロゴ: 右上 */}
      {avatar && (
        <div style={{ position: "absolute", top: 60, right: 72, display: "flex" }}>
          <AvatarVisual avatar={avatar} />
        </div>
      )}

      {/* タイトル: owner/ 通常 + repo 太字 */}
      <div style={{ display: "flex", flexWrap: "wrap", maxWidth: 820, fontSize: 76, lineHeight: 1.05 }}>
        <span style={{ fontWeight: 400 }}>{(data.owner || "owner") + "/"}</span>
        <span style={{ fontWeight: 700 }}>{data.repo || "repo"}</span>
      </div>

      {/* 説明 */}
      {data.description && (
        <div style={{ display: "flex", maxWidth: 720, marginTop: 18, fontSize: 33, lineHeight: 1.4, color: p.muted }}>
          {data.description}
        </div>
      )}

      {/* 統計: null の項目は非表示 */}
      <div style={{ marginTop: "auto", marginBottom: 52, display: "flex", gap: 52 }}>
        {visibleStats(data).map((s) => (
          <StatItem key={s.key} icon={s.icon} value={s.value} label={s.label} palette={p} />
        ))}
      </div>

      {/* GitHub マーク: 右下 */}
      <div style={{ position: "absolute", right: 72, bottom: 56, display: "flex" }}>
        <MarkGithub size={58} color={p.logo} />
      </div>

      {/* 言語バー: 最下端フルブリード */}
      <LanguageStripe languages={data.languages} othersColor={data.othersColor} palette={p} />
    </div>
  );
}
