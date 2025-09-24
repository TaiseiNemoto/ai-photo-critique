# Phase 1-2: EXIF処理の統合

## 課題概要

**課題ID**: P1-2
**優先度**: 🟡 Medium
**対象**: EXIF処理の重複削除

### 問題の詳細

現在、以下の2つの関数で同一のEXIF処理が重複実装されています：

1. **src/lib/upload.ts:uploadImageCore** (L58-75)
2. **src/lib/critique-core.ts:generateCritiqueCore** (L34-51)

```typescript
// 重複している処理パターン
const exifDataResult = extractStringFromFormData(formData, "exifData", {
  optional: true,
});
let exifData: ExifData = {};
if (exifDataResult.success && exifDataResult.data) {
  try {
    exifData = JSON.parse(exifDataResult.data);
    console.log("Using client-side EXIF data");
  } catch (error) {
    console.warn("Invalid EXIF data from client, using empty object:", error);
    exifData = {};
  }
} else {
  console.log("No client EXIF data provided, using empty object");
}
```

### 影響範囲

- **パフォーマンス**: 同一処理の2重実行による非効率
- **保守性**: 同一ロジックの複数箇所メンテナンス
- **DRY原則違反**: コードの重複による品質低下

## 修正方針

Next.jsのベストプラクティスに従い、共通関数化によるDRY原則の遵守を行います。

### 基本方針

1. **共通EXIF処理関数の作成**: `src/lib/exif.ts`に統合EXIF処理を実装
2. **重複削除**: 両ファイルから重複処理を削除
3. **型安全性の維持**: ExifData型の適切な利用
4. **エラーハンドリングの統一**: 一貫したエラー処理

## 具体的な修正内容

### 1. 新規ファイル作成

**ファイル**: `src/lib/exif.ts`

```typescript
import { ExifData } from "@/types/image";
import { extractStringFromFormData } from "@/lib/validation";

/**
 * FormDataからEXIF情報を抽出・パースする統合関数
 * @param formData - FormDataオブジェクト
 * @returns パース済みのEXIFデータ
 */
export function extractExifFromFormData(formData: FormData): ExifData {
  const exifDataResult = extractStringFromFormData(formData, "exifData", {
    optional: true,
  });

  let exifData: ExifData = {};

  if (exifDataResult.success && exifDataResult.data) {
    try {
      exifData = JSON.parse(exifDataResult.data);
      console.log("Using client-side EXIF data");
    } catch (error) {
      console.warn("Invalid EXIF data from client, using empty object:", error);
      exifData = {};
    }
  } else {
    console.log("No client EXIF data provided, using empty object");
  }

  return exifData;
}
```

### 2. 既存ファイル修正

**ファイル**: `src/lib/upload.ts`

- L58-75の重複EXIF処理を削除
- `extractExifFromFormData`関数の呼び出しに置換

**ファイル**: `src/lib/critique-core.ts`

- L34-51の重複EXIF処理を削除
- `extractExifFromFormData`関数の呼び出しに置換

### 3. テストファイル作成

**ファイル**: `src/lib/exif.test.ts`

- 正常系: 有効なEXIFデータのパース
- 異常系: 無効なJSONデータの処理
- 境界値: 空文字列、null、undefined
- エラーハンドリング: JSON.parseエラー処理

## 実装手順（TDD方式）

### Step 1: Red - 失敗するテストの作成

1. `src/lib/exif.test.ts`にテストケースを作成
2. 存在しない`extractExifFromFormData`関数をテスト
3. テスト実行 → 失敗確認

### Step 2: Green - 最小限の実装

1. `src/lib/exif.ts`に基本的な関数実装
2. テスト通過を確認

### Step 3: Refactor - 既存ファイルの修正

1. `src/lib/upload.ts`の重複処理削除・関数呼び出し置換
2. `src/lib/critique-core.ts`の重複処理削除・関数呼び出し置換
3. 全テスト通過確認

### Step 4: 追加テストケース

1. 境界値・異常系テストの追加
2. エラーハンドリングテストの追加

## 期待効果

### パフォーマンス改善

- EXIF処理の重複実行削除による処理時間短縮
- メモリ使用量の最適化

### 型安全性向上

- ExifData型の統一利用
- TypeScriptコンパイル時エラー検出強化

### 保守性向上

- EXIF処理ロジックの単一箇所集約
- 修正時の影響範囲限定

### コード品質向上

- DRY原則遵守
- 関数の単一責任原則実現

## 影響範囲

### 修正ファイル

- ✏️ `src/lib/upload.ts` - 重複EXIF処理削除
- ✏️ `src/lib/critique-core.ts` - 重複EXIF処理削除

### 新規作成ファイル

- ➕ `src/lib/exif.ts` - 統合EXIF処理関数
- ➕ `src/lib/exif.test.ts` - 包括的テスト

### テスト影響範囲

- 既存テストの動作確認
- 新規テストによる品質保証

## 完了定義

### 必須条件

- [ ] `npm run test` 全テスト通過
- [ ] `npm run lint` エラーなし
- [ ] `npm run build` 成功
- [ ] 画像アップロード〜講評生成の動作確認

### 品質確認

- [ ] 新規テストによる境界値・異常系カバー
- [ ] 処理時間の改善確認
- [ ] メモリ使用量の最適化確認
- [ ] 型安全性の維持確認

### ドキュメント更新

- [ ] upload_flow_issues.mdのPhase 1-2チェック済み更新
- [ ] 修正内容の変更ログ記録

## リスク・注意事項

### 低リスク事項

- EXIF処理ロジックの変更なし（移動のみ）
- 既存の型定義・インターフェース維持
- フロントエンドへの影響なし

### 確認事項

- FormDataフィールド名"exifData"の継続利用
- console.logメッセージの統一性
- エラーハンドリング動作の一貫性

## 次のステップ

Phase 1-2完了後、Phase 2「uploadImageWithCritiqueの分離」に進む予定です。
