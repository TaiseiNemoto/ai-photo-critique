# 課題C2修正計画 - Server Actions → API Routes アンチパターン解消

**課題ID**: C2  
**優先度**: 🔴 Critical ⭐⭐⭐⭐⭐  
**作成日**: 2025-09-09  
**ステータス**: 修正計画承認済み

## 🔍 課題概要

### 問題の詳細

Next.js 2025非推奨パターンの使用による構造的欠陥が発生しています。

**現状のアンチパターン:**

```typescript
// actions.ts - Server ActionからAPI Routeをfetch呼び出し
export async function uploadImage(formData: FormData) {
  const response = await fetch(`${baseUrl}/api/upload`, {
    method: "POST",
    body: formData,
  });
}
```

**影響:**

- **アーキテクチャ**: 不要な3層構成（Client → Server Action → API Route）
- **パフォーマンス**: 不要なHTTPオーバーヘッドとJSONシリアライゼーション
- **保守性**: エラートレーシングの困難、デバッグの複雑化
- **型安全性**: JSON変換による型情報の喪失

**関連ファイル:**

- `src/app/actions.ts:31-37, 91-97`
- `src/app/api/upload/route.ts`
- `src/app/api/critique/route.ts`

## 🎯 修正方針

### Next.js 2025推奨パターンへの変更

**推奨**: Server Actionsはデータソースに直接アクセスすべき

1. **API Routeのロジックをライブラリ関数として分離**
2. **Server ActionsでAPI Routeを削除してライブラリ関数を直接呼び出し**
3. **不要なHTTPオーバーヘッドとJSONシリアライゼーションを排除**

## 📋 修正内容

### 1. 新規ライブラリファイル作成

#### `src/lib/upload.ts` (新規作成)

```typescript
import { extractExifData } from "@/lib/exif";
import { processImage } from "@/lib/image";
import { kvClient } from "@/lib/kv";
import type { ExifData, ProcessedImageData } from "@/types/upload";

export interface UploadResult {
  success: boolean;
  data?: {
    id: string;
    exifData: ExifData;
    processedImage: ProcessedImageData;
  };
  error?: string;
}

export async function uploadImageCore(
  formData: FormData,
): Promise<UploadResult> {
  // API Routeのロジックをそのまま移植
  // - ファイル抽出・検証
  // - EXIF抽出・画像処理の並列実行
  // - KVストレージ保存
}
```

#### `src/lib/critique-core.ts` (新規作成)

```typescript
import { generatePhotoCritiqueWithRetry } from "@/lib/critique";
import { kvClient } from "@/lib/kv";
import type { CritiqueResult } from "@/types/upload";

export async function generateCritiqueCore(
  formData: FormData,
): Promise<CritiqueResult> {
  // API Routeのロジックをそのまま移植
  // - ファイル抽出・検証
  // - AI講評生成
  // - KVストレージ保存（共有データ含む）
}
```

### 2. Server Actions修正

#### `src/app/actions.ts` の修正

```typescript
import { uploadImageCore } from "@/lib/upload";
import { generateCritiqueCore } from "@/lib/critique-core";

export async function uploadImage(formData: FormData): Promise<UploadResult> {
  // API Route呼び出しを削除、直接ライブラリ関数呼び出し
  return await uploadImageCore(formData);
}

export async function generateCritique(
  formData: FormData,
): Promise<CritiqueResult> {
  // API Route呼び出しを削除、直接ライブラリ関数呼び出し
  return await generateCritiqueCore(formData);
}
```

### 3. API Route削除

以下のファイルを削除:

- `src/app/api/upload/route.ts`
- `src/app/api/critique/route.ts`

将来的に公開APIが必要になった場合は、ライブラリ関数を呼び出す薄いラッパーとして再作成。

## 🔧 実装手順（TDD方式）

### Phase 1: テスト実行・現状確認

```bash
npm run test
npm run lint
npm run build
```

### Phase 2: ライブラリ関数分離

1. **RED**: 新しいライブラリ関数用のテスト作成（失敗確認）
2. **GREEN**: `src/lib/upload.ts` 作成・実装
3. **GREEN**: `src/lib/critique-core.ts` 作成・実装
4. **REFACTOR**: テスト通過後のコード品質改善

### Phase 3: Server Actions修正

1. **RED**: 修正後のServer Actions用テスト作成
2. **GREEN**: `src/app/actions.ts` 修正実装
3. **REFACTOR**: エラーハンドリング改善

### Phase 4: API Route削除・クリーンアップ

1. API Routeファイル削除
2. 未使用インポートの削除
3. 関連テストの修正

### Phase 5: 総合テスト

```bash
npm run test      # 全テスト通過確認
npm run lint      # ESLintエラーなし確認
npm run build     # ビルド成功確認
```

## 📊 期待効果

### パフォーマンス改善

- **HTTPオーバーヘッド削除**: fetch通信の排除
- **JSONシリアライゼーション削減**: 直接オブジェクト受け渡し
- **処理時間短縮**: 中間レイヤー排除による高速化

### 開発体験改善

- **型安全性向上**: TypeScriptの型チェック有効化
- **エラートレーシング改善**: 直接的なスタックトレース
- **デバッグ簡素化**: 中間レイヤーの排除

### アーキテクチャ改善

- **Next.js 2025推奨パターン準拠**
- **関心の分離**: ライブラリ関数による処理分離
- **コード重複排除**: 共通ロジックの一元化

## 📝 影響範囲

### 修正対象ファイル

- ✏️ `src/app/actions.ts` - Server Actions修正
- ➕ `src/lib/upload.ts` - 新規作成
- ➕ `src/lib/critique-core.ts` - 新規作成
- ➕ `tests/lib/upload.test.ts` - 新規作成
- ➕ `tests/lib/critique-core.test.ts` - 新規作成

### 削除対象ファイル

- ❌ `src/app/api/upload/route.ts`
- ❌ `src/app/api/critique/route.ts`

### テスト修正

- ✏️ `tests/app/actions.test.ts` - Server Actionsテスト修正
- ❌ `tests/app/api/upload/route.test.ts` - 削除
- ❌ `tests/app/api/critique/route.test.ts` - 削除

## 🚨 リスク管理

### 実装前の準備

- [ ] 現状のテスト全通過確認
- [ ] Git commitで現状をバックアップ
- [ ] 段階的実装（1つずつ確認）

### 各段階での確認項目

- [ ] 該当するテストが全て通過
- [ ] `npm run lint` でエラーなし
- [ ] `npm run build` 成功
- [ ] 画像アップロード〜講評生成の動作確認

### 問題発生時の対処

- ロールバック手順を事前準備
- 段階的リリース（1つずつデプロイ・検証）
- テストが失敗した場合は原因究明後に再実装

## 🎯 完了定義

1. ✅ 全テストが通過
2. ✅ `npm run lint` エラーなし
3. ✅ `npm run build` 成功
4. ✅ 画像アップロード→講評生成の動作確認
5. ✅ パフォーマンス改善の確認
6. ✅ コードレビュー完了
7. ✅ ドキュメント更新完了

---

**承認状況**: ✅ 承認済み（API Route削除方針）  
**実装担当**: Claude Code  
**レビュー予定**: 実装完了後  
**次ステップ**: TDD方式での実装開始
