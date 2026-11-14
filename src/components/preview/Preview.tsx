"use client";

import { useEffect, useState } from "react";
import type { RepoData } from "@/lib/types";
import { fetchCardImage } from "@/lib/fetch-card-image";

export default function Preview({ data }: { data: RepoData }) {
  const [image, setImage] = useState<string>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetchCardImage(data, 1, controller.signal).then((blob) => {
        if (controller.signal.aborted) return;
        const url = URL.createObjectURL(blob);
        setImage(url);
        setError(undefined);
      }).catch((error: unknown) => {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Image generation failed.");
      });
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [data]);
  useEffect(() => () => {
    if (image) URL.revokeObjectURL(image);
  }, [image]);
  return <div className="w-full max-w-[600px]">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {image ? <img src={image} alt="Repository card preview" width={1200} height={600} className="w-full rounded-xl border border-neutral-300 shadow-sm" /> : <div className="aspect-[2/1] rounded-xl border border-neutral-300" />}
    {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
  </div>;
}
