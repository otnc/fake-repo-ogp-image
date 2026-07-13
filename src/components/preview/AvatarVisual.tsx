/* eslint-disable @next/next/no-img-element */
// アバター描画 (画像 or identicon グリッド)。DOM/Satori 両対応 (inline style のみ)。
import type { ResolvedAvatar } from "@/lib/avatar";
import { identicon } from "@/lib/identicon";

const AVATAR_SIZE = 150;
const BORDER_RADIUS = 16;

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
        style={{
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
          objectFit: "cover",
          borderRadius: BORDER_RADIUS,
        }}
      />
    );
  }

  // identicon: 5x5 の色付きセルを薄灰の正方形に並べる
  const { cells, color } = identicon(avatar.seed);
  const pad = Math.round(AVATAR_SIZE * 0.12);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        padding: pad,
        boxSizing: "border-box",
        background: "#f0f0f0",
        borderRadius: BORDER_RADIUS,
        overflow: "hidden",
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
