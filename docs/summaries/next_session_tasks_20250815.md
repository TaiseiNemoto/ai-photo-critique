# 次回セッション タスクリスト - 2025-08-15

## 🚀 優先タスク：Upstash Redis接続設定完了

### Step 1: Upstash Redisインスタンス作成 (15分)

#### 1.1 Vercel Marketplace経由での設定

```bash
# Vercel Dashboard での操作
1. https://vercel.com/dashboard → Projects
2. ai-photo-critique プロジェクト選択
3. Marketplace タブ → Upstash Redis
4. "Add Integration" → データベース作成
5. 環境変数の自動設定確認
```

#### 1.2 代替案：直接Upstash設定

```bash
# https://upstash.com/ での操作
1. アカウント作成/ログイン
2. Redis Database 作成
3. Region: ap-northeast-1 (東京)
4. 環境変数をコピー
```

### Step 2: 環境変数設定とテスト (10分)

#### 2.1 環境変数の設定

```bash
# .env.local に追加
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

#### 2.2 接続テスト実行

```bash
cd /path/to/ai-photo-critique
npm run test src/lib/kv.test.ts
```

### Step 3: パッケージ変更 (5分)

#### 3.1 依存関係の変更

```bash
# @vercel/kv を @upstash/redis に変更
npm uninstall @vercel/kv
npm install @upstash/redis
```

#### 3.2 コード修正

```typescript
// src/lib/kv.ts の修正
// import { kv } from '@vercel/kv';
import { Redis } from "@upstash/redis";
```

### Step 4: 動作確認 (10分)

#### 4.1 実際のデータ操作テスト

```bash
# 開発サーバー起動
npm run dev

# テストデータでの動作確認
# - 批評データの保存/取得
# - 画像データの保存/取得
# - TTL動作確認
```

## 📋 完了チェックリスト

- [ ] Upstash Redisインスタンス作成完了
- [ ] 環境変数が正しく設定されている
- [ ] `@upstash/redis` パッケージ導入完了
- [ ] KVクライアントがUpstash APIを使用
- [ ] 接続テストが成功している
- [ ] 実際のデータ保存/取得が動作している
- [ ] TTL（24時間削除）が正常に動作している

## 🔄 その後の作業（Step2準備）

### API Routes実装準備

```bash
# 次の優先タスク
1. /api/upload Edge Function実装
2. /api/critique Node Function実装
3. Server Actions修正（API Route呼び出し）
```

## 📁 関連ファイル

### 修正が必要なファイル

- `src/lib/kv.ts` - パッケージ変更
- `package.json` - 依存関係更新
- `.env.local` - 環境変数追加

### 確認が必要なファイル

- `src/lib/kv.test.ts` - テスト動作確認
- `docs/implementation/implementation_checklist.md` - 進捗更新

## ⚠️ 注意事項

1. **料金確認**: Upstash無料枠は10,000リクエスト/日
2. **セキュリティ**: 環境変数をGitにコミットしない
3. **バックアップ**: 設定前に現在の.env.localをバックアップ
4. **テスト**: 本番環境への影響を避けるため段階的テスト

## 📞 トラブルシューティング

### よくある問題

1. **接続エラー**: 環境変数のコピペミス確認
2. **認証エラー**: Upstashトークンの権限確認
3. **ネットワークエラー**: プロキシ/ファイアウォール設定確認

---

**作成日**: 2025-08-15  
**想定所要時間**: 40分  
**前提条件**: KVクライアント実装済み（完了済み）
