# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Communication Language

**IMPORTANT**: Always communicate with the user in Japanese (日本語). This is a Japanese project and the user prefers Japanese communication.

## Project Overview

AI Photo Critique is a web application that provides instant AI-powered feedback on uploaded photos. The system analyzes photos across three dimensions: technique, composition, and color, delivering concise Japanese feedback within seconds. Target users are amateur to high-amateur photographers seeking to improve their skills.

## Development Commands

- `npm run dev` - Start development server (Next.js)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint linting
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run test` - Run unit tests with Vitest
- `npm run test:e2e` - Run E2E tests with Playwright

## Architecture

The application is built on Next.js 15 with App Router and uses Server Actions for backend logic. The system processes images through multiple stages:

1. **Upload Flow**: Edge Function resizes images to 1024px, extracts EXIF data, stores metadata in Upstash Redis
2. **AI Analysis**: Node Function calls Google Gemini Vision API for critique generation
3. **Report Display**: Three-card UI shows technique/composition/color feedback + EXIF table
4. **Share System**: Short URLs via Upstash Redis with OGP image generation

### Key Components

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **AI Integration**: Google Gemini Vision API + Gemini 1.5 Pro
- **Storage**: Upstash Redis (24h TTL for privacy)
- **Deployment**: Vercel with Edge Functions and Node Functions

### File Structure

- `src/app/` - Next.js App Router pages and layouts
- `src/lib/` - Utility functions (EXIF extraction, Gemini client)
- `components/` - Reusable React components (shadcn/ui based)
- `tests/` - Unit tests (Vitest) and E2E tests (Playwright)

## Development Workflow

This project actively uses **v0.dev** for UI development:

1. Generate UI components via v0.dev prompts
2. Apply generated TSX code to appropriate page components in `src/app/`
3. Install required shadcn/ui components using provided `npx shadcn-ui@latest add ...` commands
4. Implement backend logic using Server Actions
5. Write unit and E2E tests

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

- `GOOGLE_AI_API_KEY` - Google AI Studio API key for Gemini Vision
- `UPSTASH_REDIS_REST_URL` - Upstash Redis REST API URL（次回セッションで設定予定）
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis REST API token（次回セッションで設定予定）

**注意**: 現在はUpstash環境変数未設定でも開発可能（インメモリフォールバック）

## Testing Strategy

- **Unit Tests**: Vitest + React Testing Library for upload/EXIF/state management
- **API Mocking**: MSW for Gemini Vision response simulation
- **E2E Tests**: Playwright for full upload → critique → share flow
- **Target**: 80% test coverage, <3s processing time per image

## Code Standards

- Follow existing TypeScript/ESLint/Prettier configuration
- Use React Server Components and Client Components appropriately
- Leverage shadcn/ui components via v0.dev generation
- Write clear commit messages focusing on "why" not "what"
- Gemini API communication through `lib/gemini.ts` client
- Upstash Redis operations through `lib/kv.ts` client

### **MANDATORY: t-wada Development Methodology**

**すべてのロジック実装時には、必ず以下のルールを守ること:**

1. **テストファースト**: 実装前に必ずテストを書く
2. **Red-Green-Refactorサイクル**: 失敗→成功→改善の順序を厳守
3. **小さなステップ**: 大きな機能を小さな単位に分割して実装
4. **境界値・異常系テスト**: 正常系だけでなく境界値や異常系も必ずテスト
5. **適切なモック使用**: 外部依存をモック化してテストの独立性を保つ

**詳細は必ず `docs/development/coding_guidelines.md` を参照すること。**

**実装前チェックリスト:**

- [ ] テストケースを設計したか？
- [ ] 失敗するテストを先に書いたか？
- [ ] 最小限の実装でテストを通したか？
- [ ] リファクタリングを行ったか？
- [ ] 境界値・異常系のテストを追加したか？

### **IMPORTANT: End-of-Work Routine**

**コーディング作業終了時には必ず以下を実行すること:**

1. `npm run lint` - ESLintでコードチェック
2. `npm run format` - Prettierでコードフォーマット
3. エラーがあれば修正してから完了とする

これにより、コードの品質と一貫性を保つ。
