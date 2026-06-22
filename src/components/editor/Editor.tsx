"use client";

import type { RepoData } from "@/lib/types";
import { Field, TextInput, TextArea } from "./Field";
import ImportBar from "./ImportBar";
import AvatarSection from "./AvatarSection";
import LanguageBar from "./LanguageBar";
import StatsFields from "./StatsFields";

// 左カラムの入力フォーム全体。状態は親(page)が持ち、update で部分更新する。
export default function Editor({
  data,
  update,
}: {
  data: RepoData;
  update: (patch: Partial<RepoData>) => void;
}) {
  return (
    <div className="space-y-8">
      {/* GitHub からインポート */}
      <Section title="GitHub からインポート">
        <ImportBar update={update} />
      </Section>

      {/* アバター */}
      <Section title="アバター">
        <AvatarSection data={data} update={update} />
      </Section>

      {/* 基本情報 */}
      <Section title="基本情報">
        <Field label="ユーザー名 / Owner">
          <TextInput
            value={data.owner}
            placeholder="octocat"
            onChange={(e) => update({ owner: e.target.value })}
          />
        </Field>
        <Field label="リポジトリ名">
          <TextInput
            value={data.repo}
            placeholder="hello-world"
            onChange={(e) => update({ repo: e.target.value })}
          />
        </Field>
        <Field label="説明" hint="長い場合は自動で折り返されます">
          <TextArea
            value={data.description}
            rows={2}
            placeholder="リポジトリの説明文"
            onChange={(e) => update({ description: e.target.value })}
          />
        </Field>
      </Section>

      {/* 言語バー */}
      <Section title="言語">
        <LanguageBar
          languages={data.languages}
          othersColor={data.othersColor}
          onChange={(languages) => update({ languages })}
          onOthersColorChange={(othersColor) => update({ othersColor })}
        />
      </Section>

      {/* 統計 */}
      <Section title="統計">
        <StatsFields data={data} update={update} />
      </Section>

      {/* テーマ */}
      <Section title="テーマ">
        <div className="flex gap-2">
          {(["light", "dark"] as const).map((t) => (
            <button
              key={t}
              onClick={() => update({ theme: t })}
              className={`rounded-md border px-4 py-2 text-sm ${
                data.theme === t
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 hover:bg-neutral-100"
              }`}
            >
              {t === "light" ? "ライト" : "ダーク"}
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}

// セクションの見出し + 中身
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold tracking-wide text-neutral-500 uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}
