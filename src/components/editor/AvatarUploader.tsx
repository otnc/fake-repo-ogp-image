"use client";

import { useRef, useState } from "react";

// アバター画像をアップロード (クリック選択 + ドラッグ&ドロップ)。
// 読み込んだ画像は data URL にして親へ渡す。
export default function AvatarUploader({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  // File を data URL に変換して親へ
  function readFile(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-neutral-700">アバター画像</span>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          readFile(e.dataTransfer.files[0]);
        }}
        className={`flex cursor-pointer items-center gap-3 rounded-md border border-dashed p-3 text-sm ${
          dragging ? "border-neutral-600 bg-neutral-100" : "border-neutral-300"
        }`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="avatar" className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <div className="h-12 w-12 rounded-full bg-neutral-200" />
        )}
        <span className="text-neutral-600">
          クリックで選択、またはドラッグ&ドロップ
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => readFile(e.target.files?.[0])}
      />

      {value && (
        <button
          onClick={() => onChange(null)}
          className="mt-1 text-xs text-neutral-500 underline hover:text-neutral-700"
        >
          画像を削除
        </button>
      )}
    </div>
  );
}
