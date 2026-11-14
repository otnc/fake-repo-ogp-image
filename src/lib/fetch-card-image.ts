import type { RepoData } from "./types";

export const fetchCardImage = async (data: RepoData, pixelRatio: number, signal?: AbortSignal) => {
  const response = await fetch("/api/og", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data, pixelRatio }), signal });
  if (!response.ok) throw new Error("Image generation failed.");
  return response.blob();
};
