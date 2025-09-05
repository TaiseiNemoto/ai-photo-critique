# ディレクトリ構造

本ドキュメントは、AI Photo Critiqueプロジェクトのディレクトリ構造と各フォルダ・ファイルの役割について説明します。

## 概要

```
ai-photo-critique/
├── docs/                    # プロジェクトドキュメント
├── public/                  # 静的アセット
├── scripts/                 # ビルド・テスト用スクリプト
├── src/                     # メインのソースコード
├── tests/                   # E2Eテスト
├── .vscode/                 # VS Code設定
├── .serena/                 # Serenaツール設定（AI支援）
└── 設定ファイル群             # Next.js、TypeScript、ESLintなど
```

## メインディレクトリ詳細

### `/src` - メインソースコード

プロジェクトの核となるソースコードが格納されています。

#### `/src/app` - Next.js App Router

```
src/app/
├── page.tsx                 # ホーム画面（画像アップロード）
├── layout.tsx               # 全体レイアウト
├── globals.css              # グローバルCSS
├── actions.ts (.test.ts)    # Server Actions（サーバーサイド処理）
├── api/                     # API Routes
│   ├── upload/              # 画像アップロード処理
│   ├── critique/            # AI分析処理
│   ├── data/[id]/           # データ取得API
│   ├── share/               # 共有URL生成
│   └── ogp/                 # OGP画像生成
├── report/[id]/             # 分析レポート画面
└── s/[id]/                  # 共有ページ
```

**重要な設計原則**:

- **コロケーション配置**: 各ファイルの隣にテストファイル（`.test.ts`）を配置
- **Server Actions**: `actions.ts`でサーバーサイド処理を集約
- **Dynamic Routes**: `[id]`でパラメータを受け取る動的ルーティング

#### `/src/components` - UIコンポーネント

```
src/components/
├── ui/                      # shadcn/ui基盤コンポーネント
│   ├── button.tsx           # ボタンコンポーネント
│   ├── card.tsx             # カードコンポーネント
│   └── badge.tsx            # バッジコンポーネント
├── common/                  # 共通UIコンポーネント
│   ├── AppHeader.tsx        # アプリヘッダー
│   └── FeatureCards.tsx     # 機能紹介カード
├── upload/                  # アップロード画面用
│   ├── UploadZone.tsx       # ドラッグ&ドロップ領域
│   ├── ImagePreview.tsx     # 画像プレビュー
│   ├── ExifDisplay.tsx      # EXIF情報表示
│   └── GenerateButton.tsx   # 分析実行ボタン
├── report/                  # 分析レポート画面用
│   ├── CritiqueCard.tsx     # 分析結果カード
│   ├── ExifDetails.tsx      # EXIF詳細テーブル
│   ├── ImagePreview.tsx     # 画像表示
│   ├── ReportHeader.tsx     # レポートヘッダー
│   └── ReportActions.tsx    # アクションボタン群
└── share/                   # 共有ページ用
    ├── ShareBadge.tsx       # 共有バッジ
    ├── ShareHeader.tsx      # 共有ページヘッダー
    ├── ShareCritiqueCards.tsx # 分析結果（共有版）
    ├── ShareExifDetails.tsx # EXIF詳細（共有版）
    ├── ShareCallToAction.tsx # CTA（行動喚起）
    └── ShareFooter.tsx      # フッター
```

**コンポーネント設計方針**:

- **ドメイン別構成**: 画面・機能別にフォルダを分離
- **shadcn/ui活用**: `components/ui/`の基盤コンポーネントを活用
- **再利用性**: `common/`で共通コンポーネントを管理

#### `/src/lib` - ビジネスロジック・ユーティリティ

```
src/lib/
├── critique.ts (.test.ts)   # AI分析結果処理
├── exif.ts (.test.ts)       # EXIF情報抽出
├── image.ts (.test.ts)      # 画像処理（リサイズなど）
├── gemini.ts (.test.ts)     # Google Gemini API クライアント
├── kv.ts (.test.ts)         # Upstash Redis クライアント
└── utils.ts                 # 汎用ユーティリティ
```

**重要なライブラリ**:

- `gemini.ts`: Google Gemini Vision APIとの通信処理
- `kv.ts`: Upstash Redis（データストレージ）とのやり取り
- `exif.ts`: 画像のメタデータ抽出処理

#### その他のsrcディレクトリ

```
src/
├── contexts/                # React Context（状態管理）
│   └── CritiqueContext.tsx  # 分析状態管理
├── types/                   # TypeScript型定義
│   └── upload.ts            # アップロード関連型
├── mocks/                   # API モック（テスト用）
│   ├── handlers.ts          # MSWハンドラー
│   ├── server.ts            # Node.js用モックサーバー
│   └── browser.ts           # ブラウザ用モックサーバー
└── test-setup.ts            # Vitestテスト環境設定
```

### `/docs` - プロジェクトドキュメント

```
docs/
├── development/             # 開発者向けドキュメント
│   ├── coding_guidelines.md # コーディングガイドライン（t-wada流）
│   └── directory_structure.md # このファイル
├── screens/                 # 画面仕様書
│   ├── 01_upload.md         # アップロード画面仕様
│   ├── 02_report.md         # レポート画面仕様
│   └── 03_share.md          # 共有画面仕様
├── summaries/               # 作業サマリー（日次）
│   ├── work_summary_YYYYMMDD.md # 各日の作業記録
│   └── ...                  # 多数の履歴ファイル
├── proposal.md              # プロジェクト企画書
├── requirements.md          # 要件定義
├── screen_structure.md      # 画面構成概要
└── development_status.md    # 開発状況
```

**注意**: `summaries/`フォルダに多数のファイルが蓄積されています。定期的な整理を推奨します。

### `/tests` - E2Eテスト

```
tests/
├── e2e/                     # Playwright E2Eテスト
│   ├── example.spec.ts      # サンプルテスト
│   ├── full-flow.spec.ts    # 全体フローテスト
│   └── share.spec.ts        # 共有機能テスト
└── fixtures/                # テスト用ファイル
    └── test-image.jpg       # テスト用画像
```

### `/public` - 静的アセット

```
public/
├── file.svg                 # アイコン画像
├── globe.svg
├── next.svg
├── vercel.svg
└── window.svg
```

### 設定ファイル群

```
./
├── package.json             # npm依存関係
├── tsconfig.json            # TypeScript設定
├── next.config.ts           # Next.js設定
├── vitest.config.ts         # Vitestテスト設定
├── playwright.config.ts     # Playwright E2E設定
├── eslint.config.mjs        # ESLint設定
├── postcss.config.mjs       # PostCSS設定
├── .prettierrc.json         # Prettier設定
├── components.json          # shadcn/ui設定
├── CLAUDE.md                # Claude Code AI支援設定
├── GEMINI.md                # Gemini API使用ガイド
└── .env.example             # 環境変数テンプレート
```

## 重要な設計パターン

### 1. コロケーション配置（Colocation）

**原則**: 実装コードと関連するテストファイルを同じディレクトリに配置

```
src/lib/
├── exif.ts                  # 実装
└── exif.test.ts             # テスト（同じ場所）

src/components/upload/
├── UploadZone.tsx           # 実装
└── UploadZone.test.tsx      # テスト（同じ場所）
```

**メリット**:

- 関連ファイルを簡単に見つけられる
- リファクタリング時の漏れを防止
- コードの保守性向上

### 2. ドメイン駆動設計

**原則**: 機能・画面別にコンポーネントを組織化

```
components/
├── upload/     # アップロード画面に関連するコンポーネント群
├── report/     # レポート画面に関連するコンポーネント群
└── share/      # 共有画面に関連するコンポーネント群
```

### 3. レイヤードアーキテクチャ

```
src/app/          # プレゼンテーション層（UI）
├── components/   # UIコンポーネント
├── lib/          # ビジネスロジック層
└── types/        # ドメイン層（型定義）
```

## ファイル命名規則

### コンポーネント

- **React コンポーネント**: PascalCase（例: `UploadZone.tsx`）
- **テストファイル**: 対応するファイル名 + `.test.ts/tsx`

### ライブラリ・ユーティリティ

- **実装ファイル**: camelCase（例: `exif.ts`, `gemini.ts`）
- **型定義**: camelCase（例: `upload.ts`）

### 定数・設定

- **設定ファイル**: kebab-case（例: `next.config.ts`）
- **ドキュメント**: snake_case（例: `work_summary_20250904.md`）

## 新機能開発時のガイドライン

### 1. コンポーネント追加

新しいUIコンポーネントを作成する際は：

1. 適切なドメインフォルダ（`upload/`, `report/`, `share/`, `common/`）を選択
2. PascalCaseでファイル名を命名
3. 同じ場所にテストファイル（`.test.tsx`）を作成
4. 必要に応じて shadcn/ui コンポーネントを活用

### 2. ビジネスロジック追加

新しいロジックを追加する際は：

1. `src/lib/` に実装ファイルを作成
2. **テストファースト**：実装前にテストファイルを作成
3. 適切な型定義を `src/types/` に追加
4. 必要に応じてモックを `src/mocks/` に追加

### 3. API Routes追加

新しいAPI エンドポイントを追加する際は：

1. `src/app/api/` 配下に適切なフォルダを作成
2. `route.ts` と `route.test.ts` を併設
3. Server Actions が適用できる場合は `actions.ts` に統合を検討

## 参考資料

- [Next.js App Router公式ドキュメント](https://nextjs.org/docs/app)
- [shadcn/ui コンポーネントライブラリ](https://ui.shadcn.com/)
- [コーディングガイドライン（t-wada流）](./coding_guidelines.md)
- [Vitest テストフレームワーク](https://vitest.dev/)
- [Playwright E2E テスト](https://playwright.dev/)

---

**最終更新**: 2025-09-05  
**更新者**: Claude Code AI Assistant  
**対象読者**: 新規参画メンバー、既存開発者
