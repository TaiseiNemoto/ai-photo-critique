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

1. **Upload Flow**: Edge Function resizes images to 1024px, extracts EXIF data, stores metadata in Vercel KV
2. **AI Analysis**: Node Function calls OpenAI Vision API → GPT-4o for critique generation
3. **Report Display**: Three-card UI shows technique/composition/color feedback + EXIF table
4. **Share System**: Short URLs via Vercel KV with OGP image generation

### Key Components

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **AI Integration**: OpenAI Vision API + GPT-4o with function calling
- **Storage**: Vercel KV (24h TTL for privacy)
- **Deployment**: Vercel with Edge Functions and Node Functions

### File Structure

- `src/app/` - Next.js App Router pages and layouts
- `src/lib/` - Utility functions (EXIF extraction, OpenAI client)
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

- `OPENAI_API_KEY` - OpenAI API key for Vision/GPT-4o
- `KV_*` - Vercel KV credentials for caching and short URLs

## Testing Strategy

- **Unit Tests**: Vitest + React Testing Library for upload/EXIF/state management
- **API Mocking**: MSW for Vision/GPT response simulation
- **E2E Tests**: Playwright for full upload → critique → share flow
- **Target**: 80% test coverage, <3s processing time per image

## Code Standards

- Follow existing TypeScript/ESLint/Prettier configuration
- Use React Server Components and Client Components appropriately
- Leverage shadcn/ui components via v0.dev generation
- Write clear commit messages focusing on "why" not "what"
- OpenAI API communication through `lib/openai.ts` client

### **IMPORTANT: End-of-Work Routine**

**コーディング作業終了時には必ず以下を実行すること:**

1. `npm run lint` - ESLintでコードチェック
2. `npm run format` - Prettierでコードフォーマット
3. エラーがあれば修正してから完了とする

これにより、コードの品質と一貫性を保つ。
