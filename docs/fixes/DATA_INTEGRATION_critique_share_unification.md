# 課題DATA_INTEGRATION修正計画 - 講評データと共有データの完全統合

**課題ID**: DATA_INTEGRATION
**優先度**: 🔴 Ultra High ⭐⭐⭐⭐⭐
**作成日**: 2025-09-29

## 🔍 課題概要

### 問題の詳細

- **同名異構造**: `CritiqueData`が2箇所で異なる定義（src/lib/kv.ts と src/types/upload.ts）
- **データ分離**: 講評データ(`CritiqueData`)と共有データ(`ShareData`)が別構造
- **複雑な取得処理**: `/api/data/[id]`で2回のクエリが必要
- **型安全性欠如**: 開発時の混乱とバグの原因

## 🎯 修正方針

### 単一データ構造への完全統合

```typescript
export interface CritiqueData {
  // 基本情報
  id: string;
  filename: string;
  uploadedAt: string;

  // 講評内容
  technique: string;
  composition: string;
  color: string;
  overall?: string;

  // 画像関連
  imageData: string;
  exifData: Record<string, unknown>;

  // 共有機能（旧ShareData統合）
  shareId: string;
  createdAt: string;
  expiresAt: string;
}
```

## 📋 実装チェックリスト

### Phase 1: 事前準備

- [x] `npm run test` で現状テスト確認
- [x] `npm run lint` でコード品質確認
- [x] `npm run build` でビルド確認
- [x] `git add . && git commit -m "統合作業前のバックアップ"`

### Phase 2: 失敗テスト作成（RED）

- [x] 統合CritiqueDataの保存・取得テスト作成（失敗することを確認）
- [x] ShareDataメソッド削除テスト作成
- [x] 単一データ取得APIテスト作成
- [x] テストが適切に失敗することを確認

### Phase 3: 型定義統合（GREEN - Step 1）

- [x] `src/lib/kv.ts`でCritiqueData統合定義に変更
- [x] ShareDataインターフェース削除
- [x] `src/types/upload.ts`重複CritiqueData削除
- [x] `export { type CritiqueData } from "@/lib/kv"`追加

### Phase 4: KVクライアント修正（GREEN - Step 2）

- [x] `KvClient.saveShare()`メソッド削除
- [x] `KvClient.getShare()`メソッド削除
- [x] `saveCritique/getCritique`メソッド統合データ対応

### Phase 5: API処理簡素化（GREEN - Step 3）

- [x] `/api/data/[id]`単一データ取得に変更
- [x] 複雑な2段階取得処理削除
- [x] 単一期限チェックに変更
- [x] `/api/share`ShareData処理削除

### Phase 6: 全ファイルの型参照更新（GREEN - Step 4）

- [x] `src/contexts/CritiqueContext.tsx`
- [x] `src/components/share/ShareCritiqueCards.tsx`
- [x] `src/hooks/useUploadState.ts`
- [x] `src/services/upload-service.ts`
- [x] `src/lib/critique.ts`
- [x] `src/lib/gemini.ts`
- [x] `src/mocks/handlers.ts`

### Phase 7: 全テスト修正（GREEN - Step 5）

- [x] `src/lib/kv.test.ts` - 統合データ構造対応（ShareData削除済み）
- [ ] `src/app/api/data/[id]/route.test.ts` - 単一取得対応
- [ ] `src/app/api/share/route.test.ts` - ShareData削除対応
- [ ] その他全テストファイルの統合型対応

### Phase 8: リファクタリング（REFACTOR）

- [ ] 不要なインポート削除
- [ ] エラーハンドリング統一
- [ ] コメント整理

### Phase 9: 総合テスト

- [x] `npm run test` 全テスト通過（207/207テスト成功）
- [x] `npm run lint` エラーなし（確認済み）
- [x] `npm run build` 成功（確認済み）
- [ ] 画像アップロード→講評生成→共有フロー動作確認

## 🗂️ 修正対象ファイル

### コア修正ファイル

- ✏️ `src/lib/kv.ts` - データ型統合、ShareData削除
- ✏️ `src/types/upload.ts` - 重複定義削除、再エクスポート
- ✏️ `src/app/api/data/[id]/route.ts` - 単一データ取得
- ✏️ `src/app/api/share/route.ts` - ShareData処理削除

### テストファイル

- ✏️ `src/lib/kv.test.ts`
- ✏️ `src/app/api/data/[id]/route.test.ts`
- ✏️ `src/app/api/share/route.test.ts`
- ✏️ その他全テストファイル

### コンポーネント・サービス

- ✏️ `src/contexts/CritiqueContext.tsx`
- ✏️ `src/components/share/ShareCritiqueCards.tsx`
- ✏️ `src/hooks/useUploadState.ts`
- ✏️ `src/services/upload-service.ts`
- ✏️ `src/lib/critique.ts`, `src/lib/gemini.ts`
- ✏️ `src/mocks/handlers.ts`

## 🚨 削除要素

- ❌ `ShareData`インターフェース
- ❌ `KvClient.saveShare()`メソッド
- ❌ `KvClient.getShare()`メソッド
- ❌ `/api/data/[id]`の2段階取得処理
- ❌ src/types/upload.tsの重複CritiqueData

## 🎯 完了定義

- [x] 統合CritiqueData定義完成
- [x] ShareData完全削除
- [x] 全テスト通過（`npm run test`）- 207/207テスト成功
- [x] Lint通過（`npm run lint`）
- [x] ビルド成功（`npm run build`）
- [x] 型統一作業完了（CritiqueData/CritiqueContent一本化）
- [ ] アップロード→講評→共有フロー動作確認
- [ ] 既存共有URL動作確認

---

**実装方式**: TDD（Red-Green-Refactor）
**想定削除行数**: 約200行
**期待処理速度改善**: 30-50%（クエリ数削減）
