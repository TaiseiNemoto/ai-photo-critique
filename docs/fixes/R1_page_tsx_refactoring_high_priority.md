# 課題R1修正計画 - page.tsx リファクタリング（優先度高）

**課題ID**: R1
**優先度**: 🔴 High ⭐⭐⭐⭐
**作成日**: 2025-09-19
**ステータス**: 修正計画作成済み

## 🔍 課題概要

### 問題の詳細

`src/app/page.tsx` (178行) の構造的欠陥による保守性・テスト容易性の著しい低下が発生しています。

**現状の問題:**

```typescript
// page.tsx - 単一責任原則違反の巨大コンポーネント
export default function UploadPage() {
  // 178行
  // 複数の責務が混在:
  // 1. 状態管理 (uploadedImage, isProcessing, critiqueState)
  // 2. アップロード処理 (handleImageUploaded)
  // 3. 講評生成処理 (handleGenerateCritique)
  // 4. エラーハンドリング (toast.error × 複数箇所)
  // 5. リセット処理 (resetUpload)
  // 6. UI レンダリング

  // グローバル汚染
  (window as Window & { __uploadFormData?: FormData }).__uploadFormData =
    image.formData;
}
```

**影響:**

- **保守性**: 178行の巨大コンポーネントで修正影響範囲が不明確
- **テスト容易性**: 複数責務混在により単体テスト困難
- **再利用性**: 密結合により他画面での再利用不可
- **型安全性**: グローバルwindowオブジェクト汚染による型安全性違反

**関連ファイル:**

- `src/app/page.tsx:18-178` (メインコンポーネント)

## 🎯 修正方針

### 単一責任原則とカスタムフック分離

**推奨**: 責務別にカスタムフックとサービス層に分離

1. **状態管理ロジックをカスタムフックに分離**
2. **ビジネスロジックをサービス層に分離**
3. **グローバル状態汚染を適切な状態管理に変更**
4. **178行コンポーネントを30行以下に縮小**

## 📋 修正内容

### 1. カスタムフック作成

#### `src/hooks/useUploadState.ts` (新規作成)

```typescript
import { useState, useRef } from "react";
import type { UploadedImage, CritiqueData } from "@/types/upload";

export type UploadState = {
  uploadedImage: UploadedImage | null;
  isProcessing: boolean;
  critique: {
    status: "idle" | "loading" | "success" | "error";
    data?: CritiqueData;
    error?: string;
  };
};

export function useUploadState() {
  const [state, setState] = useState<UploadState>({
    uploadedImage: null,
    isProcessing: false,
    critique: { status: "idle" },
  });

  // グローバル汚染を削除し、useRefで管理
  const formDataRef = useRef<FormData | null>(null);

  const setUploadedImage = (image: UploadedImage | null) => {
    setState((prev) => ({ ...prev, uploadedImage: image }));
  };

  const setProcessing = (processing: boolean) => {
    setState((prev) => ({ ...prev, isProcessing: processing }));
  };

  const setCritiqueState = (critique: UploadState["critique"]) => {
    setState((prev) => ({ ...prev, critique }));
  };

  const resetState = () => {
    if (state.uploadedImage) {
      URL.revokeObjectURL(state.uploadedImage.preview);
    }
    setState({
      uploadedImage: null,
      isProcessing: false,
      critique: { status: "idle" },
    });
    formDataRef.current = null;
  };

  return {
    state,
    formDataRef,
    setUploadedImage,
    setProcessing,
    setCritiqueState,
    resetState,
  };
}
```

#### `src/hooks/useCritiqueGeneration.ts` (新規作成)

```typescript
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCritique } from "@/contexts/CritiqueContext";
import { uploadImageWithCritique } from "@/app/actions";
import type { UploadedImage } from "@/types/upload";

// 定数化
const TIMING = {
  TOAST_SUCCESS_DURATION: 1500,
  TOAST_INFO_DURATION: 2000,
  TOAST_ERROR_DURATION: 3000,
  NAVIGATION_DELAY: 1500,
} as const;

const MESSAGES = {
  CRITIQUE_LOADING: "AI講評を生成中...",
  CRITIQUE_LOADING_DESC: "技術・構図・色彩を分析しています",
  CRITIQUE_SUCCESS: "講評が完了しました",
  CRITIQUE_SUCCESS_DESC: "結果ページに移動します",
  CRITIQUE_ERROR: "講評生成に失敗しました",
  CRITIQUE_NETWORK_ERROR: "ネットワークエラーが発生しました",
  CRITIQUE_NETWORK_DESC: "ネットワーク接続を確認してください",
} as const;

export function useCritiqueGeneration() {
  const router = useRouter();
  const { setCritiqueData } = useCritique();

  const generateCritique = async (
    uploadedImage: UploadedImage,
    formDataRef: React.RefObject<FormData | null>,
    onProcessingChange: (processing: boolean) => void,
    onCritiqueStateChange: (state: any) => void,
  ) => {
    onProcessingChange(true);
    onCritiqueStateChange({ status: "loading" });

    const loadingToastId = toast.loading(MESSAGES.CRITIQUE_LOADING, {
      description: MESSAGES.CRITIQUE_LOADING_DESC,
    });

    try {
      const formData =
        formDataRef.current || createFallbackFormData(uploadedImage);
      const result = await uploadImageWithCritique(formData);

      toast.dismiss(loadingToastId);

      if (result.critique.success && result.critique.data) {
        onCritiqueStateChange({
          status: "success",
          data: result.critique.data,
        });

        toast.success(MESSAGES.CRITIQUE_SUCCESS, {
          description: MESSAGES.CRITIQUE_SUCCESS_DESC,
          duration: TIMING.TOAST_SUCCESS_DURATION,
        });

        setTimeout(() => {
          setCritiqueData({
            image: uploadedImage,
            critique: result.critique.data!,
          });
          router.push("/report/current");
        }, TIMING.NAVIGATION_DELAY);
      } else {
        handleCritiqueError(result.critique.error, onCritiqueStateChange);
      }
    } catch (error) {
      console.error("Critique generation error:", error);
      toast.dismiss(loadingToastId);
      handleNetworkError(onCritiqueStateChange);
    } finally {
      onProcessingChange(false);
    }
  };

  return { generateCritique };
}

function createFallbackFormData(uploadedImage: UploadedImage): FormData {
  const formData = new FormData();
  formData.append("image", uploadedImage.file);
  if (uploadedImage.exif) {
    formData.append("exifData", JSON.stringify(uploadedImage.exif));
  }
  return formData;
}

function handleCritiqueError(
  error: string | undefined,
  onCritiqueStateChange: (state: any) => void,
) {
  onCritiqueStateChange({
    status: "error",
    error: error || MESSAGES.CRITIQUE_ERROR,
  });

  toast.error(MESSAGES.CRITIQUE_ERROR, {
    description: error || "再度お試しください",
    duration: TIMING.TOAST_ERROR_DURATION,
  });
}

function handleNetworkError(onCritiqueStateChange: (state: any) => void) {
  onCritiqueStateChange({
    status: "error",
    error: MESSAGES.CRITIQUE_NETWORK_ERROR,
  });

  toast.error("エラーが発生しました", {
    description: MESSAGES.CRITIQUE_NETWORK_DESC,
    duration: TIMING.TOAST_ERROR_DURATION,
  });
}
```

#### `src/hooks/useUploadFlow.ts` (新規作成)

```typescript
import { toast } from "sonner";
import { useUploadState } from "./useUploadState";
import { useCritiqueGeneration } from "./useCritiqueGeneration";
import type { UploadedImageWithFormData } from "@/types/upload";

export function useUploadFlow() {
  const {
    state,
    formDataRef,
    setUploadedImage,
    setProcessing,
    setCritiqueState,
    resetState,
  } = useUploadState();

  const { generateCritique } = useCritiqueGeneration();

  const handleImageUploaded = (image: UploadedImageWithFormData) => {
    const uploadedImage = {
      file: image.file,
      preview: image.preview,
      exif: image.exif,
    };

    setUploadedImage(uploadedImage);
    setCritiqueState({ status: "idle" });

    toast.success("画像をアップロードしました", {
      description: "EXIF情報を解析中...",
      duration: 2000,
    });

    formDataRef.current = image.formData;
  };

  const handleGenerateCritique = async () => {
    if (!state.uploadedImage) return;

    await generateCritique(
      state.uploadedImage,
      formDataRef,
      setProcessing,
      setCritiqueState,
    );
  };

  const resetUpload = () => {
    resetState();
    toast("画像をリセットしました", {
      description: "新しい画像を選択してください",
      duration: 2000,
    });
  };

  return {
    state,
    handleImageUploaded,
    handleGenerateCritique,
    resetUpload,
  };
}
```

### 2. page.tsx 修正

#### `src/app/page.tsx` の大幅簡素化

```typescript
"use client";

import { useUploadFlow } from "@/hooks/useUploadFlow";
import AppHeader from "@/components/common/AppHeader";
import UploadZone from "@/components/upload/UploadZone";
import ImagePreview from "@/components/upload/ImagePreview";
import GenerateButton from "@/components/upload/GenerateButton";

export default function UploadPage() {
  const {
    state,
    handleImageUploaded,
    handleGenerateCritique,
    resetUpload,
  } = useUploadFlow();

  return (
    <div className="mobile-viewport bg-gray-50 scroll-smooth">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-4xl">
        <main
          className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-gray-200 shadow-xl gpu-accelerated tap-highlight-none"
          role="main"
        >
          <AppHeader />

          {!state.uploadedImage ? (
            <UploadZone onImageUploaded={handleImageUploaded} />
          ) : (
            <div className="space-y-6">
              <ImagePreview
                uploadedImage={state.uploadedImage}
                onReset={resetUpload}
              />
              <GenerateButton
                isProcessing={state.isProcessing}
                onGenerate={handleGenerateCritique}
                disabled={!state.uploadedImage}
                critiqueStatus={state.critique.status}
                critiqueError={state.critique.error}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
```

## 🔧 実装手順（TDD方式）

### Phase 1: テスト実行・現状確認

```bash
npm run test
npm run lint
npm run build
```

### Phase 2: カスタムフック作成

1. **RED**: `useUploadState.test.ts` 作成（失敗確認）
2. **GREEN**: `src/hooks/useUploadState.ts` 実装
3. **RED**: `useCritiqueGeneration.test.ts` 作成（失敗確認）
4. **GREEN**: `src/hooks/useCritiqueGeneration.ts` 実装
5. **RED**: `useUploadFlow.test.ts` 作成（失敗確認）
6. **GREEN**: `src/hooks/useUploadFlow.ts` 実装
7. **REFACTOR**: コード品質改善

### Phase 3: page.tsx 修正

1. **RED**: 修正後のpage.tsx用テスト作成
2. **GREEN**: `src/app/page.tsx` 修正実装（178行→30行以下）
3. **REFACTOR**: インポート整理、コメント調整

### Phase 4: 総合テスト

```bash
npm run test      # 全テスト通過確認
npm run lint      # ESLintエラーなし確認
npm run build     # ビルド成功確認
# 手動動作確認: 画像アップロード〜講評生成
```

## 📊 期待効果

### コード品質改善

- **行数削減**: 178行 → 30行以下（83%削減）
- **責務分離**: 1つのコンポーネント → 3つのフック + 1つのコンポーネント
- **型安全性向上**: グローバル汚染削除、適切な型定義

### 開発体験改善

- **テスト容易性**: フック単位での単体テスト可能
- **保守性**: 責務別の修正で影響範囲明確化
- **再利用性**: フックの他画面流用可能

### 運用品質改善

- **デバッグ簡素化**: 責務分離による問題箇所特定容易
- **機能拡張**: フック分離による機能追加容易
- **コードレビュー**: 小さな単位でのレビュー可能

## 📝 影響範囲

### 新規作成ファイル

- ➕ `src/hooks/useUploadState.ts`
- ➕ `src/hooks/useCritiqueGeneration.ts`
- ➕ `src/hooks/useUploadFlow.ts`
- ➕ `tests/hooks/useUploadState.test.ts`
- ➕ `tests/hooks/useCritiqueGeneration.test.ts`
- ➕ `tests/hooks/useUploadFlow.test.ts`

### 修正対象ファイル

- ✏️ `src/app/page.tsx` - 178行→30行以下に大幅簡素化

### テスト修正

- ✏️ `tests/app/page.test.ts` - 修正後のコンポーネント用テスト更新

## 🚨 リスク管理

### 実装前の準備

- [ ] 現状のテスト全通過確認
- [ ] Git commitで現状をバックアップ
- [ ] 段階的実装（フック1つずつ確認）

### 各段階での確認項目

- [ ] 該当するフックのテストが全て通過
- [ ] `npm run lint` でエラーなし
- [ ] `npm run build` 成功
- [ ] 既存機能の動作確認

### 問題発生時の対処

- フック単位でのロールバック可能
- 段階的リリース（フック1つずつデプロイ・検証）
- テストが失敗した場合は原因究明後に再実装

## 🎯 完了定義

1. ✅ 全テストが通過
2. ✅ `npm run lint` エラーなし
3. ✅ `npm run build` 成功
4. ✅ 画像アップロード→講評生成の動作確認
5. ✅ page.tsx行数が30行以下
6. ✅ グローバルwindowオブジェクト汚染削除確認
7. ✅ コードレビュー完了

---

**承認状況**: 🔄 承認待ち
**実装担当**: Claude Code
**レビュー予定**: 実装完了後
**次ステップ**: ユーザー承認後、TDD方式での実装開始
