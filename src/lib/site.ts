// 絶対 URL を組むためのサイトベース URL。
// Vercel では VERCEL_URL が自動で入る。独自指定は NEXT_PUBLIC_SITE_URL。
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
