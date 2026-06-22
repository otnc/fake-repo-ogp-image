"use client";

import { useState } from "react";
import type { LanguageEntry } from "@/lib/types";
import LanguagePickerModal from "./LanguagePickerModal";

// 言語バーの編集セクション。
// 「言語を追加」や各行の言語名ボタンを押すとポップアップで一覧から選ぶ。
// 合計が 100% に満たない残りは Others 色で表示される。
export default function LanguageBar({
  languages,
  othersColor,
  onChange,
  onOthersColorChange,
}: {
  languages: LanguageEntry[];
  othersColor: string;
  onChange: (next: LanguageEntry[]) => void;
  onOthersColorChange: (color: string) => void;
}) {
  // 言語選択ポップアップの対象: "new"=新規追加 / 行 id=その行を変更 / null=閉
  const [pickerFor, setPickerFor] = useState<string | null>(null);

  const total = languages.reduce((s, l) => s + (l.percent || 0), 0);
  const rest = Math.max(0, 100 - total);

  function patchRow(id: string, patch: Partial<LanguageEntry>) {
    onChange(languages.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function removeRow(id: string) {
    onChange(languages.filter((l) => l.id !== id));
  }

  // ポップアップで言語が選ばれたとき
  function handleSelect(name: string, color: string) {
    if (pickerFor === "new") {
      onChange([...languages, { id: crypto.randomUUID(), name, color, percent: 0 }]);
    } else if (pickerFor) {
      patchRow(pickerFor, { name, color });
    }
  }

  return (
    <div className="space-y-3">
      {languages.map((l) => (
        <div key={l.id} className="flex flex-wrap items-center gap-2">
          {/* 言語名: 押すとポップアップで変更 */}
          <button
            onClick={() => setPickerFor(l.id)}
            className="flex flex-1 items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-left text-sm hover:bg-neutral-50"
          >
            <span
              className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/10"
              style={{ background: l.color }}
            />
            <span className={l.name ? "" : "text-neutral-400"}>{l.name || "言語を選択"}</span>
          </button>

          {/* 色: ピッカー + hex 直接入力 */}
          <input
            type="color"
            value={l.color}
            onChange={(e) => patchRow(l.id, { color: e.target.value })}
            className="h-9 w-9 shrink-0 cursor-pointer rounded border border-neutral-300"
          />
          <input
            type="text"
            value={l.color}
            onChange={(e) => patchRow(l.id, { color: e.target.value })}
            className="w-24 shrink-0 rounded-md border border-neutral-300 px-2 py-2 text-sm"
          />

          {/* パーセント */}
          <div className="flex shrink-0 items-center gap-1">
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={l.percent}
              onChange={(e) =>
                patchRow(l.id, { percent: Math.max(0, Number(e.target.value) || 0) })
              }
              className="w-20 rounded-md border border-neutral-300 px-2 py-2 text-sm"
            />
            <span className="text-sm text-neutral-500">%</span>
          </div>

          <button
            onClick={() => removeRow(l.id)}
            className="shrink-0 px-2 py-2 text-neutral-400 hover:text-red-600"
            aria-label="削除"
          >
            ×
          </button>
        </div>
      ))}

      {/* Others (残り%) の色と割合 */}
      <div className="flex items-center gap-2 text-sm text-neutral-600">
        <input
          type="color"
          value={othersColor}
          onChange={(e) => onOthersColorChange(e.target.value)}
          className="h-7 w-7 shrink-0 cursor-pointer rounded border border-neutral-300"
        />
        <span>Others {rest.toFixed(1)}%</span>
        <span className={total > 100 ? "text-red-600" : "text-neutral-400"}>
          (合計 {total.toFixed(1)}%)
        </span>
      </div>

      <button
        onClick={() => setPickerFor("new")}
        className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100"
      >
        + 言語を追加
      </button>

      <LanguagePickerModal
        open={pickerFor !== null}
        onClose={() => setPickerFor(null)}
        onSelect={handleSelect}
      />
    </div>
  );
}
