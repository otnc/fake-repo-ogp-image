import { fetchGithubCounts } from "@/lib/github-counts";
export const runtime = "nodejs";
export const GET = async (request: Request) => {
  const params = new URL(request.url).searchParams;
  return Response.json(await fetchGithubCounts(params.get("owner") ?? "", params.get("repo") ?? ""));
};
