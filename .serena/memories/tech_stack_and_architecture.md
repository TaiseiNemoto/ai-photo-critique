# 技術スタック・アーキテクチャ

## フロントエンド
- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS + shadcn/ui
- **状態管理**: React Hooks
- **UIコンポーネント**: shadcn/ui ベース

## バックエンド・インフラ
- **プラットフォーム**: Vercel
- **サーバー機能**: Next.js Server Actions
- **Edge Functions**: 画像リサイズ、EXIF処理
- **Node Functions**: OpenAI API呼び出し
- **ストレージ**: Vercel KV (24時間TTL)

## AI・画像処理
- **AI API**: OpenAI Vision API + GPT-4o (function calling)
- **画像処理**: Sharp (リサイズ)
- **EXIF抽出**: exifr

## 開発・テスト
- **テストフレームワーク**: Vitest (単体) + Playwright (E2E)
- **リンター**: ESLint (Next.js設定)
- **フォーマッター**: Prettier
- **モック**: MSW (APIレスポンス)

## ファイル構成
```
src/
  app/ - Next.js App Router (pages & layouts)
  lib/ - ユーティリティ関数 (EXIF抽出、OpenAIクライアント)
  components/ - React コンポーネント (shadcn/ui ベース)
  types/ - TypeScript型定義
tests/ - 単体・E2Eテスト
docs/ - プロジェクト文書
```