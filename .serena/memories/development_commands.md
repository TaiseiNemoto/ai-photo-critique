# 開発コマンド

## 基本コマンド
```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm run start
```

## コード品質
```bash
# ESLintチェック
npm run lint

# ESLint自動修正
npm run lint:fix

# Prettierフォーマット
npm run format
```

## テスト
```bash
# 単体テスト (Vitest)
npm run test

# E2Eテスト (Playwright)
npm run test:e2e

# カバレッジ付きテスト
npm run test -- --coverage

# 特定ファイルのテスト
npm run test src/lib/exif.test.ts
```

## WindowsシステムでのGitコマンド
```bash
# ファイル削除 (rmはインタラクティブモードが有効なため)
rm -f <filename>

# その他の基本コマンド
ls      # ファイル一覧
cd      # ディレクトリ移動
git     # Gitコマンド
grep    # テキスト検索（ripgrepのrgが推奨）
find    # ファイル検索
```

## 環境設定
```bash
# 環境変数設定
cp .env.example .env.local

# 必要な環境変数:
# - OPENAI_API_KEY (OpenAI Vision/GPT-4o用)
# - KV_* (Vercel KV認証情報)
```