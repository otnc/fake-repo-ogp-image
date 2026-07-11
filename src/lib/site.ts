// 絶対 URL を組むためのサイトベース URL。独自指定は NEXT_PUBLIC_SITE_URL。
// VERCEL_URL はデプロイ固有 URL (Deployment Protection で外部クローラが 401 になる) なので、
// 本番ドメインを指す VERCEL_PROJECT_PRODUCTION_URL を優先する。
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");
