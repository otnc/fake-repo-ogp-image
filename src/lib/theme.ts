// カードのライト/ダーク配色 (GitHub の色に合わせている)
import type { Theme } from "./types";

export type Palette = {
  bg: string;
  text: string;
  muted: string;
  border: string;
  track: string; // 言語バーの下地
  logo: string; // 右下の GitHub マーク (本家同様うすめ)
};

export const PALETTES: Record<Theme, Palette> = {
  light: {
    bg: "#ffffff",
    text: "#1f2328",
    muted: "#59636e",
    border: "#d1d9e0",
    track: "#eaeef2",
    logo: "#afb8c1",
  },
  dark: {
    bg: "#0d1117",
    text: "#e6edf3",
    muted: "#9198a1",
    border: "#3d444d",
    track: "#21262d",
    logo: "#545d68",
  },
};
