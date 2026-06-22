"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { RepoData } from "@/lib/types";
import OgpCard, { CARD_W, CARD_H } from "./OgpCard";

// 実寸 1200x600 のカードを、コンテナ幅に合わせて縮小表示する (スマホ対応)。
// cardRef は縮小していない実寸ノードに付けて、PNG 書き出しに使う。
const MAX_SCALE = 0.5; // デスクトップでは 0.5 倍 (600x300) を上限にする

export default function Preview({
  data,
  cardRef,
}: {
  data: RepoData;
  cardRef: RefObject<HTMLDivElement | null>;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(MAX_SCALE);

  // コンテナ幅に追従して倍率を決める
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(MAX_SCALE, el.clientWidth / CARD_W));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="w-full overflow-hidden">
      <div
        className="overflow-hidden rounded-xl border border-neutral-300 shadow-sm"
        style={{ width: CARD_W * scale, height: CARD_H * scale }}
      >
        <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <div ref={cardRef}>
            <OgpCard data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}
