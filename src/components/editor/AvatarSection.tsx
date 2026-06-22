"use client";

import { useEffect } from "react";
import type { RepoData } from "@/lib/types";
import { useGithubAvatarExists } from "@/lib/useGithubAvatar";
import { Field, TextInput } from "./Field";
import AvatarUploader from "./AvatarUploader";

// アバター関連の入力をまとめたセクション。
export default function AvatarSection({
  data,
  update,
}: {
  data: RepoData;
  update: (patch: Partial<RepoData>) => void;
}) {
  const owner = data.owner.trim();
  const status = useGithubAvatarExists(data.owner);
  // 存在するときだけ「GitHub アバターを使う」を選べる
  const usingGithub = data.useGithubAvatar && status === "exists";

  // ユーザーが見つからなくなったらチェックを自動で外す (壊れた画像を防ぐ)
  useEffect(() => {
    if (status === "missing" && data.useGithubAvatar) update({ useGithubAvatar: false });
  }, [status, data.useGithubAvatar, update]);

  return (
    <div className="space-y-3">
      {/* GitHub ユーザ/Org が実在するときだけチェックボックスを表示 */}
      {status === "checking" && (
        <p className="text-xs text-neutral-400">@{owner} を確認中…</p>
      )}
      {status === "exists" && (
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={data.useGithubAvatar}
            onChange={(e) => update({ useGithubAvatar: e.target.checked })}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://github.com/${encodeURIComponent(owner)}.png?size=40`}
            alt=""
            className="h-5 w-5 rounded-full"
          />
          @{owner} のアイコンを使用する
        </label>
      )}
      {status === "missing" && owner && (
        <p className="text-xs text-neutral-400">@{owner} は見つかりませんでした</p>
      )}

      {/* GitHub アバター使用時は画像指定を隠す */}
      {!usingGithub && (
        <>
          <AvatarUploader value={data.avatar} onChange={(v) => update({ avatar: v })} />
          <Field label="アバター URL" hint="共有 URL ではこちらを使用 (例: https://github.com/octocat.png)">
            <TextInput
              value={data.avatar && data.avatar.startsWith("http") ? data.avatar : ""}
              placeholder="https://github.com/octocat.png"
              onChange={(e) => update({ avatar: e.target.value || null })}
            />
          </Field>

          {/* 画像未指定のときの表示を選ぶ */}
          {!data.avatar && (
            <div className="space-y-2">
              <span className="block text-sm font-medium text-neutral-700">画像がないとき</span>
              <div className="flex items-center gap-2">
                <Toggle
                  active={data.avatarFallback === "none"}
                  onClick={() => update({ avatarFallback: "none" })}
                  label="空のまま"
                />
                <Toggle
                  active={data.avatarFallback === "identicon"}
                  onClick={() => update({ avatarFallback: "identicon" })}
                  label="ランダムアイコン"
                />
                {data.avatarFallback === "identicon" && (
                  <button
                    onClick={() => update({ identiconSeed: Math.floor(Math.random() * 1e9) })}
                    className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100"
                  >
                    別のアイコン
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Toggle({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md border px-3 py-1.5 text-sm ${
        active ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 hover:bg-neutral-100"
      }`}
    >
      {label}
    </button>
  );
}
