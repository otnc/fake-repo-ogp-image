import type { RepoData } from "@/lib/types";
import { PALETTES } from "@/lib/theme";
import { resolveAvatar } from "@/lib/avatar";
import { MarkGithub } from "@/components/icons/Octicons";
import AvatarVisual from "./AvatarVisual";
import LanguageStripe from "./LanguageStripe";
import StatItem from "./StatItem";
import { visibleStats } from "./stats";

// OGP カード本体。本家 (.sample) に合わせて実寸 1200x600 でレンダリングする。
// 画面表示の縮小は親側で transform: scale() を掛けるだけにする。
export const CARD_W = 1200;
export const CARD_H = 600;

// 画像書き出しを安定させるため Web フォントではなくシステムフォントを使う
const FONT =
  '"Helvetica Neue", Helvetica, Arial, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif';

export default function OgpCard({ data }: { data: RepoData }) {
  const p = PALETTES[data.theme];
  const avatar = resolveAvatar(data);

  return (
    <div
      style={{
        position: "relative",
        width: CARD_W,
        height: CARD_H,
        background: p.bg,
        color: p.text,
        fontFamily: FONT,
        padding: "64px 72px 0 72px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* アバター/ロゴ: 右上に元画像のまま (円形にしない) */}
      {avatar && (
        <div style={{ position: "absolute", top: 60, right: 72, display: "flex" }}>
          <AvatarVisual avatar={avatar} />
        </div>
      )}

      {/* タイトル: owner/ は通常、repo は太字。長ければ折り返す */}
      <div
        style={{
          maxWidth: 820,
          fontSize: 76,
          fontWeight: 400,
          lineHeight: 1.05,
          letterSpacing: "-0.5px",
          wordBreak: "break-word",
        }}
      >
        {(data.owner || "owner") + "/"}
        <span style={{ fontWeight: 700 }}>{data.repo || "repo"}</span>
      </div>

      {/* 説明 */}
      {data.description && (
        <div
          style={{
            maxWidth: 720,
            marginTop: 18,
            fontSize: 33,
            lineHeight: 1.4,
            color: p.muted,
            wordBreak: "break-word",
          }}
        >
          {data.description}
        </div>
      )}

      {/* 統計: 下端の言語バーの少し上に配置。null の項目は非表示 */}
      <div style={{ marginTop: "auto", marginBottom: 52, display: "flex", gap: 52 }}>
        {visibleStats(data).map((s) => (
          <StatItem key={s.key} icon={s.icon} value={s.value} label={s.label} palette={p} />
        ))}
      </div>

      {/* GitHub マーク: 右下 */}
      <div style={{ position: "absolute", right: 72, bottom: 56 }}>
        <MarkGithub size={58} color={p.logo} />
      </div>

      {/* 言語バー: 最下端フルブリード */}
      <LanguageStripe languages={data.languages} othersColor={data.othersColor} palette={p} />
    </div>
  );
}
