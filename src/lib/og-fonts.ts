// Satori (next/og) 用のフォント取得。
// Arimo (Latin): プロジェクト内の TTF を直接読む (外部依存なし・高速)。
// Noto Sans JP (日本語): Google Fonts から部分集合取得 (失敗しても Latin は出る)。

import fs from "fs/promises";
import path from "path";

type Font = { name: string; data: ArrayBuffer; weight: 400 | 700; style: "normal" };

// ASCII は常に含める (数値・ラベル・記号が確実に出るように)
const ASCII =
  " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~";

export function collectText(parts: string[]): string {
  return Array.from(new Set((ASCII + parts.join("")).split(""))).join("");
}

// Arimo はプロジェクト同梱の TTF を読む。外部 fetch が不要なので確実に取得できる。
async function readArimo(weight: 400 | 700, directory: string): Promise<Font | null> {
  try {
    const name = weight === 700 ? "Arimo-Bold.ttf" : "Arimo-Regular.ttf";
    const p = path.join(directory, name);
    const buf = await fs.readFile(p);
    return {
      name: "Arimo",
      data: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer,
      weight,
      style: "normal",
    };
  } catch {
    return null;
  }
}

// Noto Sans JP: 日本語を含む場合のみ Google Fonts から部分集合取得 (失敗時は null)
async function fetchNotoSansJP(text: string, weight: 400 | 700): Promise<Font | null> {
  try {
    const api = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@${weight}&text=${encodeURIComponent(text)}`;
    const css = await fetch(api).then((r) => r.text());
    const url = css.match(/src:\s*url\(([^)]+)\)/)?.[1];
    if (!url) return null;
    const data = await fetch(url).then((r) => r.arrayBuffer());
    return { name: "Noto Sans JP", data, weight, style: "normal" };
  } catch {
    return null;
  }
}

// text に ASCII 以外の文字が含まれていれば true (日本語など)
function hasNonAscii(text: string): boolean {
  return /[^\x00-\x7F]/.test(text);
}

// Arimo + (日本語あれば Noto Sans JP) を返す。
// Arimo は同梱 TTF なので確実。Noto Sans JP は失敗しても Arimo があれば Latin は描画できる。
export async function loadFonts(text: string, directory = path.join(process.cwd(), "src", "lib", "fonts")): Promise<Font[]> {
  const reqs: Promise<Font | null>[] = [readArimo(400, directory), readArimo(700, directory)];
  if (hasNonAscii(text)) {
    reqs.push(fetchNotoSansJP(text, 400), fetchNotoSansJP(text, 700));
  }
  return (await Promise.all(reqs)).filter((f): f is Font => f !== null);
}
