/* eslint-disable @next/next/no-img-element */
// アバター描画 (画像 or identicon グリッド)。DOM/Satori 両対応 (inline style のみ)。
import type { ResolvedAvatar } from "@/lib/avatar";
import { identicon } from "@/lib/identicon";

const IMG_MAX_W = 230;
const IMG_MAX_H = 180;
const ICON_SIZE = 150;

// ブラウザでは GitHub avatar URL をプロキシ経由に変換。
// html-to-image が fetch() で読む際の CORS エラーを回避するため。
// サーバーサイド (Satori) では直接 URL のまま (github.com にアクセスできる)。
function toImgSrc(src: string): string {
  if (typeof window === "undefined") return src;
  const m = src.match(/^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\.png/);
  if (m) return `/api/proxy/gh-avatar?owner=${encodeURIComponent(m[1])}`;
  return src;
}

export default function AvatarVisual({ avatar }: { avatar: ResolvedAvatar }) {
  if (!avatar) return null;

  if (avatar.kind === "image") {
    return (
      <img
        src={toImgSrc(avatar.src)}
        alt=""
        style={{ maxWidth: IMG_MAX_W, maxHeight: IMG_MAX_H, objectFit: "contain" }}
      />
    );
  }

  // identicon: 5x5 の色付きセルを薄灰の正方形に並べる
  const { cells, color } = identicon(avatar.seed);
  const pad = Math.round(ICON_SIZE * 0.12);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: ICON_SIZE,
        height: ICON_SIZE,
        padding: pad,
        boxSizing: "border-box",
        background: "#f0f0f0",
      }}
    >
      {cells.map((row, y) => (
        <div key={y} style={{ display: "flex", flex: 1 }}>
          {row.map((on, x) => (
            <div key={x} style={{ flex: 1, background: on ? color : "transparent" }} />
          ))}
        </div>
      ))}
    </div>
  );
}
