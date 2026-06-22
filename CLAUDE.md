# fake-repo-ogp-image

GitHub リポジトリの OGP 風画像を、ブラウザだけで生成・ダウンロードできるツール。
任意の値を入力して本家そっくりのカードを作り、PNG 保存や共有 URL での OGP 表示ができる。

> Next.js 16 はトレーニングデータと差異がある。迷ったら `node_modules/next/dist/docs/` を読む。

## 技術スタック

- Next.js 16 (App Router, `src/`, TypeScript) / React 19
- Tailwind CSS v4 (`@import "tailwindcss"`、`tailwind.config` なし。**左カラム UI 専用**)
- html-to-image … プレビューカードを PNG 書き出し
- next/og (`ImageResponse` = Satori) … 共有用の動的 OGP 画像
- パッケージマネージャは **pnpm**

```bash
pnpm dev     # 開発サーバー (http://localhost:3000)
pnpm build   # 本番ビルド
pnpm lint    # ESLint
```

## ディレクトリ構成

```
public/github-colors.json     # 言語名→色 (ozh/github-colors)
src/app/
  page.tsx                    # 状態を持つ親。Editor と Preview を並べる。?d= で共有内容を復元
  layout.tsx, globals.css
  share/page.tsx              # 共有ページ。generateMetadata で OGP メタタグを出す
  api/og/route.tsx            # 動的 OGP 画像 (/api/og?d=...)
  api/og/OgImage.tsx          # Satori 用カード (DOM 版とは別実装)
src/components/
  editor/                     # 入力フォーム (左カラム)
  preview/                    # OGP カード本体 (右カラム) + 共有部品
  icons/Octicons.tsx          # GitHub 公式 octicons (SVG, MIT)
  DownloadButton.tsx, ShareButton.tsx
src/lib/
  types.ts        # 共有の型 (RepoData)
  theme.ts        # ライト/ダークのパレット
  format.ts       # 数値短縮 (1234→1.2k) と % 表示
  languages.ts    # github-colors.json の読み込み
  avatar.ts       # 設定→表示アバターの解決 (resolveAvatar)
  identicon.ts    # seed から GitHub 風 identicon を生成
  share.ts        # RepoData ⇄ base64url(JSON)
  og-fonts.ts     # Satori 用フォントを Google Fonts から部分集合取得
  site.ts         # 絶対 URL のベース (Vercel/環境変数)
  useGithubAvatar.ts # ユーザ/Org の実在チェック (画像読込の成否で判定)
```

## 設計の約束ごと

- **状態は `page.tsx` が一括で持つ** (`RepoData`)。子は props で受け取り、`update(patch)` で更新する
  (状態管理ライブラリなし)。`INITIAL` がデフォルト値で「全てクリア」もここへ戻す。
- **カードは実寸 1200x600 でレンダリング**し、画面表示は親で `transform: scale()` 縮小するだけ。
  PNG 書き出しは実寸ノードを `ref` で掴む (縮小は書き出しに影響させない)。
- **カードの見た目は inline style で px 指定**。Tailwind は左カラム UI に使う。
  html-to-image と画面表示を一致させるため。フォントはシステムフォント (Web フォント埋め込みを避ける)。
- **DOM 版カード (`preview/OgpCard`) と Satori 版 (`api/og/OgImage`) は別実装**。
  Satori は flexbox サブセットのみ (複数子は `display:flex` 必須、`grid`/`inline-block` 不可)。
  パレット・octicons・統計一覧 (`preview/stats`)・言語バー (`LanguageStripe`)・%/数値整形は共通で流用する。
- 1 ファイルを肥大化させない。コメントは「なぜ」を簡潔に、日本語で良い。

## 仕様

- **アバター** (`avatar.ts` の優先順): GitHub アバター > 指定画像 > identicon > なし。
  - 「ユーザー名のアバターを使用する」は **owner が実在するときだけ**表示 (`useGithubAvatar.ts`)。
  - 画像はアップロード(D&D 可)/URL 指定。未指定時は「空 / ランダム identicon (reload 可)」を選択。
  - 共有 URL に載るのは **http(s) URL と identicon (seed)** のみ (data URL は載らない)。
- **言語バー**: 「言語を追加」でポップアップ (検索・A↔Z 並べ替え・色付き一覧) から選ぶ。
  各行は色 (hex 上書き可) と % を編集。合計 100% 未満の残りは「Others」色で埋める。
- **統計**: Contributors / Used by / Issues / Discussions / Stars / Forks。
  6 項目すべてチェックで表示/非表示 (null=非表示)。デフォルト表示は Contributors/Issues/Stars/Forks。
  数値は `112k` 等に短縮。アイコンは数値の横に高さを合わせ、ラベルは数値の左端にそろえる。

## 本家 OGP の見た目 (.sample/*.png に合わせる)

- キャンバス **1200x600**、白背景 (ダーク対応)。
- タイトルは `owner/repo` を一列に。`owner/` 通常ウェイト + `repo` 太字 (約 76px)、長ければ折り返す。
- アバター/ロゴは右上、円形にせず元画像のまま (`object-fit: contain`)。
- 説明は灰色 (約 28px)。統計は下部に縦積み (アイコン+数値が上、ラベル下)。
- GitHub マークは右下 (灰)。言語バーは最下端のフルブリード帯 (高さ 13px、凡例なし)。

## 共有 (動的 OG) 機能

URL を Discord 等に貼ると同じカードが OGP として表示される。

- 入力を base64url(JSON) にして `?d=` に載せる (`lib/share.ts`、UTF-8 対応・外部入力は normalize)。
- `app/share/page.tsx` … `generateMetadata` で `?d=` を読み、`openGraph.images` に `/api/og?d=...` を設定。
- `app/api/og/route.tsx` … `ImageResponse` で `OgImage` を描画。日本語も出るよう、
  使う文字だけの部分集合フォント (Noto Sans JP) を取得して埋め込む。
- Next 16 では `searchParams` は **Promise** (await する)。

## デプロイ

- **Vercel** 想定。`metadataBase` は `NEXT_PUBLIC_SITE_URL` / `VERCEL_URL` から組む (`lib/site.ts`)。
  本番は `NEXT_PUBLIC_SITE_URL` に公開 URL を設定する。
