// Satori (next/og) 用のフォント取得。
// Latin は Arial 系メトリクスの Arimo (DOM のシステムフォントと折り返しを揃える)、
// 日本語は Noto Sans JP。Google Fonts から「使う文字だけ」の部分集合を TTF で取り軽量に埋め込む。

type Font = { name: string; data: ArrayBuffer; weight: 400 | 700; style: "normal" };

// ASCII は常に含める (数値・ラベル・記号が確実に出るように)
const ASCII =
  " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~";

// data に登場する全テキストから重複のない文字集合を作る
export function collectText(parts: string[]): string {
  return Array.from(new Set((ASCII + parts.join("")).split(""))).join("");
}

// 1 ファミリ・1 ウェイト分のフォントを取得 (失敗時は null)
async function fetchOne(family: string, text: string, weight: 400 | 700): Promise<Font | null> {
  try {
    const fam = family.replace(/ /g, "+");
    const api = `https://fonts.googleapis.com/css2?family=${fam}:wght@${weight}&text=${encodeURIComponent(text)}`;
    // 既定の (非ブラウザ) UA だと Google は TTF を返す。Satori は woff2 非対応。
    const css = await fetch(api).then((r) => r.text());
    const url = css.match(/src:\s*url\(([^)]+)\)/)?.[1];
    if (!url) return null;
    const data = await fetch(url).then((r) => r.arrayBuffer());
    return { name: family, data, weight, style: "normal" };
  } catch {
    return null;
  }
}

// Arimo (Latin) + Noto Sans JP (日本語) を 400/700 で取得。取れたものだけ返す。
export async function loadFonts(text: string): Promise<Font[]> {
  const reqs: Promise<Font | null>[] = [];
  for (const family of ["Arimo", "Noto Sans JP"]) {
    reqs.push(fetchOne(family, text, 400), fetchOne(family, text, 700));
  }
  return (await Promise.all(reqs)).filter((f): f is Font => f !== null);
}
