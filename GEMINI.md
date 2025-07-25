# GEMINI.md

## プロジェクト概要

このプロジェクト「AI Photo Critique」は、ユーザーがアップロードした写真に対し、AIが即座に講評を返すWebアプリケーションです。写真は「技術」「構図」「色彩」の3つの軸で分析され、日本語で簡潔なフィードバックが提供されます。目的は、アマチュアからハイアマチュアまでの写真愛好家が、自身の撮影スキルを迅速に向上させる手助けをすることです。

## 主要技術

- **フロントエンド:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **バックエンド:** Next.js Server Actions, Vercel KV (キャッシュおよび短縮URL用)
- **AI:** OpenAI Vision API, GPT-4o (講評生成用)
- **デプロイ:** Vercel
- **テスト:** Vitest, React Testing Library, MSW, Playwright

## プロジェクト構造

アプリケーションは Next.js の App Router をベースに構築されています。

- `app/`: 主要なアプリケーションルート
  - `app/page.tsx`: メインのアップロード画面
  - `app/report/[id]/page.tsx`: 講評レポート画面
  - `app/s/[id]/page.tsx`: 公開用のシェア画面
- `app/api/`: Server Actions および Vercel Functions が処理するAPIルート
  - `critique/route.ts`: (Node.js Function) OpenAI APIを呼び出し、AIによる講評を生成
  - `ogp/route.ts`: (Edge Function) シェア用のOGP画像を生成
  - `upload/route.ts`: (Edge Function) 画像のリサイズ、EXIF抽出、Vercel KVへのメタデータ保存
- `components/`: 再利用可能なReactコンポーネント (shadcn/uiベース)
- `lib/`: ユーティリティ関数 (EXIF抽出、OpenAI APIクライアントなど)
- `tests/`: 単体テストおよびE2Eテスト

## 主要コマンド

- **`npm run dev`**: 開発サーバーを起動します。
- **`npm run build`**: プロダクション用にアプリケーションをビルドします。
- **`npm run start`**: プロダクションサーバーを起動します。
- **`npm run test`**: Vitestで単体テストを実行します。
- **`npm run test:e2e`**: PlaywrightでE2Eテストを実行します。
- **`npm run lint`**: ESLintとPrettierでコードの静的解析を実行します。

## 開発ワークフロー

UI開発には **v0.dev** を積極的に活用します。

1.  **機能開発:** 機能ごとに新しいブランチを作成します。
2.  **UI生成 (v0.dev):** v0.devにプロンプトを入力し、目的のUI（TSXコード）を生成します。
3.  **コード適用:** 生成されたTSXコードを、`src/app/` 以下の適切なページコンポーネントに貼り付けます。
4.  **コンポーネント導入:** v0.devが提示する `npx shadcn-ui@latest add ...` コマンドを実行し、UIに必要なコンポーネントをプロジェクトに追加します。
5.  **バックエンドロジック:** Server ActionsやAPIルートハンドラを用いてバックエンドロジックを実装します。
6.  **テスト:** 単体テストおよびE2Eテストを記述します。
7.  **プルリクエストとデプロイ:** CI/CDのプロセスは従来通りです。

## AIへの指示

- **コードスタイル:** 既存のコードスタイル（TypeScript, ESLint, Prettierベース）に従ってください。
- **UI開発フロー:**
  - **v0.devを第一選択とする:** 新規UIコンポーネントの実装や画面レイアウトの作成時は、まずv0.devで生成することを検討してください。
  - **コンポーネントの導入:** v0.devが生成した `npx shadcn-ui@latest add ...` コマンドを使用して、必要なコンポーネントを導入してください。手動でのコンポーネント準備は原則不要です。
- **状態管理:** React Server Components および Client Components のフックを使用してください。当面、複雑なグローバル状態管理ライブラリの導入は避けてください。
- **API連携:** OpenAI APIとの通信には、`lib/openai.ts` に定義されたクライアントを使用してください。テストではMSWを用いてAPI応答をモックしてください。
- **コミット:** 変更の「なぜ」を説明する、明確で簡潔なコミットメッセージを記述してください。
