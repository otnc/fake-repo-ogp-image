# fake-repo-ogp-image

GitHub リポジトリの OGP 風画像を、Web、Node.js API、CLI から生成・ダウンロードできるツール。
任意の値を入力して本家そっくりのカードを作り、PNG 保存や共有 URL での OGP 表示ができる。

> Next.js 16 はトレーニングデータと差異がある。迷ったら `node_modules/next/dist/docs/` を読む。

## 技術スタック

- Next.js 16 (App Router, `src/`, TypeScript) / React 19
- Tailwind CSS v4 (`@import "tailwindcss"`、`tailwind.config` なし。**左カラム UI 専用**)
- sharp … 画像ファイルの読み込み、向きの補正、共有用画像の縮小
- satori / sharp … Web、API、CLI 共通の SVG レイアウトと PNG 生成
- commander / jsonc-parser / zod … CLI、JSONC 設定、入力検証
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
  repo-options.ts # 入力検証、デフォルト値、言語色の補完
  render-image.tsx # Web、API、CLI 共通の PNG 生成
  share-url.ts    # 共有用アバターの縮小方針と URL の生成・復元
  share.ts        # RepoData ⇄ base64url(JSON)
  og-fonts.ts     # Satori 用フォントを Google Fonts から部分集合取得
  site.ts         # 絶対 URL のベース (Vercel/環境変数)
  useGithubAvatar.ts # ユーザ/Org の実在チェック (画像読込の成否で判定)
```

## 設計の約束ごと

- **状態は `page.tsx` が一括で持つ** (`RepoData`)。子は props で受け取り、`update(patch)` で更新する（状態管理ライブラリなし）。`INITIAL` がデフォルト値で「全てクリア」もここへ戻す。
- **カードのレイアウトは 1200×600**。`src/lib/render-image.tsx` を Web、API、CLI で共用する。保存用は標準で 2400×1200、共有用とプレビューは 1200×600。
- **Web プレビューと保存は `/api/og` の POST を呼ぶ**。画像生成にはサーバーへの接続が必要。
- **カードは `components/preview/OgpCard.tsx` に集約**。Satori が扱える inline style と flexbox を使う。統計が 5 項目以上なら 2 段に配置する。
- 入力検証と初期値は `lib/repo-options.ts`、言語色は `lib/languages.ts`、共有 URL の処理は `lib/share-url.ts` に集約する。API と CLI で処理を再実装しない。
- 1 ファイルを肥大化させない。コメントは「なぜ」を簡潔に、日本語で良い。

## 仕様

- **アバター** (`avatar.ts` の優先順): GitHub アバター > 指定画像 > identicon > なし。
  - 「ユーザー名のアバターを使用する」は **owner が実在するときだけ**表示 (`useGithubAvatar.ts`)。
  - 画像はアップロード(D&D 可)/URL 指定。未指定時は「空 / ランダム identicon (reload 可)」を選択。
  - 共有 URL には **http(s) URL、identicon の seed、縮小した data URL** を載せる。長さの上限を超えるアバターは除外し、その結果を呼び出し元へ返す。
- **言語バー**: 「言語を追加」でポップアップ (検索・A↔Z 並べ替え・色付き一覧) から選ぶ。
  各行は色 (hex 上書き可) と % を編集。合計 100% 未満の残りは「Others」色で埋める。
- **統計**: Contributors / Used by / Issues / Discussions / Stars / Forks。
  Pull requests を含む 7 項目をチェックで表示/非表示にする（hiddenStats で管理）。デフォルト表示は Contributors/Issues/Stars/Forks。
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
- `app/api/og/route.tsx` … 共通の `renderImage` でカードを描画する。日本語には使用文字だけの部分集合フォント（Noto Sans JP）を取得して埋め込む。
- Next 16 では `searchParams` は **Promise** (await する)。

## デプロイ

- **Vercel** 想定。`metadataBase` は `NEXT_PUBLIC_SITE_URL` / `VERCEL_URL` から組む (`lib/site.ts`)。
  本番は `NEXT_PUBLIC_SITE_URL` に公開 URL を設定する。

## ドキュメント管理

README と CONTRIBUTING の原稿は `base/*.base.md`。Kiritan の既定言語は日本語で、英語版は `*.en.md` に生成する。原稿を変更したら `pnpm docs:build` と `pnpm docs:verify` を実行する。開発、Vercel デプロイ、CI、リリースの手順は CONTRIBUTING にまとめる。
