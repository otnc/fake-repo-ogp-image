// 数値を GitHub 風に短縮する (例: 1234 -> "1.2k", 1500000 -> "1.5m")
export function formatCount(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "0";
  if (n < 1000) return String(n);
  if (n < 1_000_000) return trim(n / 1000) + "k";
  return trim(n / 1_000_000) + "m";
}

// 10 未満なら小数 1 桁、それ以上は整数 (GitHub の表示に合わせる)
function trim(v: number): string {
  const s = v < 10 ? (Math.floor(v * 10) / 10).toFixed(1) : String(Math.round(v));
  return s.replace(/\.0$/, "");
}

// パーセントを 1 桁の小数で表示 (例: 60 -> "60.0%")
export function formatPercent(p: number): string {
  return `${p.toFixed(1)}%`;
}
