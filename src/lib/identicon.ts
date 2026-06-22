// GitHub 風 identicon を seed から決定的に生成する。
// 5x5 の左右対称グリッド + 1 色 (背景は薄灰)。DOM/Satori どちらでも div で描画できる。

// 文字列 → 32bit ハッシュ (FNV-1a)
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g] = [c, x];
  else if (h < 120) [r, g] = [x, c];
  else if (h < 180) [g, b] = [c, x];
  else if (h < 240) [g, b] = [x, c];
  else if (h < 300) [r, b] = [x, c];
  else [r, b] = [c, x];
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

export type Identicon = { cells: boolean[][]; color: string };

export function identicon(seed: string): Identicon {
  const h = hash(seed);
  const color = hslToHex(h % 360, 0.55, 0.57);
  // 左 3 列をビットで決め、右 2 列はミラー
  const cells: boolean[][] = [];
  for (let y = 0; y < 5; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < 3; x++) row[x] = ((h >> (y * 3 + x)) & 1) === 1;
    row[3] = row[1];
    row[4] = row[0];
    cells.push(row);
  }
  return { cells, color };
}
