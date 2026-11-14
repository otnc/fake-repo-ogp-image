import path from "node:path";
import { z } from "zod";
import { decodeShare } from "@/lib/share";
import { INITIAL, repoOptionsSchema } from "@/lib/repo-options";
import { renderImage } from "@/lib/render-image";

export const runtime = "nodejs";
const fonts = path.join(process.cwd(), "src", "lib", "fonts");
const responseFor = async (data: z.input<typeof repoOptionsSchema>, pixelRatio: number) =>
  new Response(new Uint8Array(await renderImage(data, fonts, pixelRatio)), { headers: { "Content-Type": "image/png" } });

export const GET = async (request: Request) => {
  const encoded = new URL(request.url).searchParams.get("d");
  return responseFor((encoded && decodeShare(encoded)) || INITIAL, 1);
};

export const POST = async (request: Request) => {
  const parsed = z.strictObject({ data: repoOptionsSchema, pixelRatio: z.number().int().min(1).max(4).default(2) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });
  return responseFor(parsed.data.data, parsed.data.pixelRatio);
};
