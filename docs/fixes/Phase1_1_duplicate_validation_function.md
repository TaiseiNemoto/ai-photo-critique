# Phase1-1修正計画 - extractAndValidateFile重複関数統合

**課題ID**: Phase1-1
**優先度**: 🟡 Medium ⭐⭐⭐
**作成日**: 2025-09-22
**ステータス**: 修正計画作成中

## 🔍 課題概要

### 問題の詳細

DRY原則に違反する重複関数が存在し、保守性を低下させています。

**現状の重複パターン:**

```typescript
// src/lib/upload.ts - 完全版（ファイルサイズ・型チェック含む）
function extractAndValidateFile(formData: FormData): File | null {
  // ファイル抽出
  // ファイルサイズ制限（10MB）
  // ファイル形式チェック（JPEG/PNG/WebP）
}

// src/lib/critique-core.ts - 簡易版（基本チェックのみ）
function extractAndValidateFile(formData: FormData): File | null {
  // ファイル抽出のみ
  // サイズ・形式チェックなし
}
```

**影響:**

- **保守性**: 同じ名前の関数が2つ存在、修正時の混乱
- **一貫性**: バリデーション基準の不統一
- **コード重複**: DRY原則違反
- **バグリスク**: 片方のみ修正される可能性

**関連ファイル:**

- `src/lib/upload.ts:25-47`
- `src/lib/critique-core.ts:11-19`

## 🎯 修正方針

### 共通関数の統合とバリデーション強化

**推奨**: 単一の包括的なバリデーション関数を作成

1. **共通関数を`src/lib/validation.ts`に統合**
2. **完全なバリデーション機能を実装**
3. **両ファイルからの重複関数削除**
4. **一貫したエラーハンドリングの実装**

## 📋 修正内容

### 1. 新規ライブラリファイル作成

#### `src/lib/validation.ts` (新規作成)

```typescript
import { extractFileFromFormData } from "@/lib/form-utils";

export interface FileValidationResult {
  success: boolean;
  file?: File;
  error?: string;
}

/**
 * FormDataから画像ファイルを抽出・検証
 * ファイルサイズ・形式・存在性をチェック
 */
export function extractAndValidateImageFile(
  formData: FormData,
): FileValidationResult {
  const fileResult = extractFileFromFormData(formData, "image");

  if (!fileResult.success) {
    return {
      success: false,
      error: "画像ファイルが見つかりません",
    };
  }

  const file = fileResult.data;

  // ファイルサイズ制限（10MB）
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: "ファイルサイズが大きすぎます（最大10MB）",
    };
  }

  // ファイル形式チェック
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: "サポートされていないファイル形式です",
    };
  }

  return {
    success: true,
    file: file,
  };
}

/**
 * 後方互換性のための関数（既存コード用）
 * @deprecated extractAndValidateImageFileを使用してください
 */
export function extractAndValidateFile(formData: FormData): File | null {
  const result = extractAndValidateImageFile(formData);
  if (!result.success) {
    if (
      result.error?.includes("大きすぎます") ||
      result.error?.includes("サポートされていない")
    ) {
      throw new Error(result.error);
    }
    return null;
  }
  return result.file!;
}
```

### 2. 既存ファイル修正

#### `src/lib/upload.ts` の修正

```typescript
import { extractAndValidateFile } from "@/lib/validation";

export async function uploadImageCore(formData: FormData): Promise<UploadResult> {
  try {
    // 重複関数を削除し、共通関数を使用
    const file = extractAndValidateFile(formData);
    // 以下既存処理...
  }
}
```

#### `src/lib/critique-core.ts` の修正

```typescript
import { extractAndValidateFile } from "@/lib/validation";

export async function generateCritiqueCore(formData: FormData): Promise<CritiqueResult> {
  try {
    // 重複関数を削除し、共通関数を使用
    const file = extractAndValidateFile(formData);
    // 以下既存処理...
  }
}
```

### 3. 重複関数削除

以下の関数を削除:

- `src/lib/upload.ts:extractAndValidateFile`
- `src/lib/critique-core.ts:extractAndValidateFile`

## 🔧 実装手順（TDD方式）

### Phase 1: テスト実行・現状確認

```bash
npm run test
npm run lint
npm run build
```

### Phase 2: 共通バリデーション関数作成

1. **RED**: 新しいバリデーション関数用のテスト作成（失敗確認）
2. **GREEN**: `src/lib/validation.ts` 作成・実装
3. **REFACTOR**: テスト通過後のコード品質改善

### Phase 3: 既存ファイル修正

1. **RED**: 修正後のupload.ts, critique-core.ts用テスト作成
2. **GREEN**: インポート追加・重複関数削除
3. **REFACTOR**: エラーハンドリング統一

### Phase 4: 総合テスト

```bash
npm run test      # 全テスト通過確認
npm run lint      # ESLintエラーなし確認
npm run build     # ビルド成功確認
```

## 📊 期待効果

### コード品質改善

- **DRY原則遵守**: 重複コードの排除
- **一貫性向上**: 統一されたバリデーション基準
- **保守性向上**: 修正箇所の一元化

### 開発体験改善

- **型安全性向上**: より明確な戻り値型
- **エラーハンドリング統一**: 一貫したエラーメッセージ
- **可読性向上**: 関数名の明確化

### 将来拡張性

- **新しいバリデーション追加が容易**
- **他の機能での再利用可能**
- **テストカバレッジの向上**

## 📝 影響範囲

### 修正対象ファイル

- ➕ `src/lib/validation.ts` - 新規作成
- ✏️ `src/lib/upload.ts` - インポート追加・重複関数削除
- ✏️ `src/lib/critique-core.ts` - インポート追加・重複関数削除
- ➕ `src/lib/validation.test.ts` - 新規作成

### テスト修正

- ✏️ `src/lib/upload.test.ts` - 間接的な動作確認
- ✏️ `src/lib/critique.test.ts` - 間接的な動作確認

## 🚨 リスク管理

### 実装前の準備

- [ ] 現状のテスト全通過確認
- [ ] Git commitで現状をバックアップ
- [ ] 段階的実装（1つずつ確認）

### 各段階での確認項目

- [ ] 該当するテストが全て通過
- [ ] `npm run lint` でエラーなし
- [ ] `npm run build` 成功
- [ ] ファイルアップロード機能の動作確認

### 問題発生時の対処

- ロールバック手順を事前準備
- 段階的実装（1ファイルずつ修正・検証）
- テストが失敗した場合は原因究明後に再実装

## 🎯 完了定義

1. ✅ 全テストが通過
2. ✅ `npm run lint` エラーなし
3. ✅ `npm run build` 成功
4. ✅ ファイルアップロード機能の動作確認
5. ✅ 重複関数の完全削除確認
6. ✅ 統一されたバリデーション機能の確認

---

**承認状況**: 🔄 承認待ち
**実装担当**: Claude Code
**レビュー予定**: 実装完了後
**次ステップ**: TDD方式での実装開始
