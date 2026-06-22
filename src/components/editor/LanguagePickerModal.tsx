"use client";

import { useEffect, useMemo, useState } from "react";
import { loadLanguages, type LanguageColor } from "@/lib/languages";

// 言語一覧のポップアップ。検索 + A-Z/Z-A 並べ替え。各行に色と言語名を表示。
export default function LanguagePickerModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (name: string, color: string) => void;
}) {
  const [list, setList] = useState<LanguageColor[]>([]);
  const [query, setQuery] = useState("");
  const [asc, setAsc] = useState(true);

  // 開いたとき一度だけ読み込む (loadLanguages 側でキャッシュ)
  useEffect(() => {
    if (open) loadLanguages().then(setList);
  }, [open]);

  // Esc で閉じる
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const items = useMemo(() => {
    const q = query.toLowerCase();
    const r = list.filter((l) => l.name.toLowerCase().includes(q));
    r.sort((a, b) => a.name.localeCompare(b.name));
    if (!asc) r.reverse();
    return r;
  }, [list, query, asc]);

  if (!open) return null;

  return (
    // 背景クリックで閉じる
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー: 検索 + 並べ替え */}
        <div className="flex gap-2 border-b border-neutral-200 p-3">
          <input
            autoFocus
            type="text"
            value={query}
            placeholder="言語を検索"
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
          <button
            onClick={() => setAsc((v) => !v)}
            className="shrink-0 rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-100"
            title="並べ替え"
          >
            {asc ? "A→Z" : "Z→A"}
          </button>
        </div>

        {/* 一覧 (色 + 言語名)。空欄時も全言語を表示し、スクロールできる */}
        <ul className="min-h-0 flex-1 overflow-auto">
          {items.map((l) => (
            <li key={l.name}>
              <button
                onClick={() => {
                  onSelect(l.name, l.color);
                  onClose();
                }}
                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-neutral-100"
              >
                <span
                  className="h-4 w-4 shrink-0 rounded-full border border-black/10"
                  style={{ background: l.color }}
                />
                {l.name}
              </button>
            </li>
          ))}
          {items.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-neutral-400">該当なし</li>
          )}
        </ul>
      </div>
    </div>
  );
}
