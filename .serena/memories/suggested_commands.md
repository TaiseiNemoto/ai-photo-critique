# 推奨コマンド一覧

## 日常開発で使用頻度の高いコマンド

### 開発環境
```bash
# 開発サーバー起動 (最重要)
npm run dev

# プロダクションビルド確認
npm run build
```

### コード品質管理 (作業完了時必須)
```bash
# リンターチェック (必須)
npm run lint

# 自動フォーマット (必須)  
npm run format

# 単体テスト実行 (必須)
npm run test
```

### テスト
```bash
# カバレッジ付きテスト
npm run test -- --coverage

# 特定ファイルテスト
npm run test src/lib/exif.test.ts

# E2Eテスト (CI前)
npm run test:e2e
```

### ファイル操作 (Windows環境)
```bash
# ファイル削除 (rmはインタラクティブ設定済み)
rm -f <filename>

# ディレクトリ作成
mkdir <dirname>

# ファイル検索 (推奨: ripgrep)
rg "search_term" src/
```

### shadcn/ui コンポーネント追加
```bash
# v0.dev生成後にコンポーネント追加
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
```

### Git操作
```bash
# 基本のGitワークフロー
git add .
git commit -m "type: 変更内容の説明"
git push origin main
```

## 重要度別分類
**🔴 必須 (タスク完了時)**: `npm run lint`, `npm run format`, `npm run test`
**🟡 推奨 (開発中)**: `npm run dev`, `npm run test -- --coverage`  
**🔵 任意 (リリース前)**: `npm run build`, `npm run test:e2e`