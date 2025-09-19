# page.tsx リファクタリング課題分析

## 概要

`src/app/page.tsx` (178行) のリファクタリング課題を分析し、優先度別に整理したドキュメントです。
現在のコンポーネントは単一責任原則に違反し、複数の責務が混在している状態です。

## 現在の問題構造

```typescript
UploadPage (178行)
├── 状態管理 (uploadedImage, isProcessing, critiqueState)
├── アップロード処理 (handleImageUploaded)
├── 講評生成処理 (handleGenerateCritique)
├── エラーハンドリング (toast.error × 複数箇所)
├── リセット処理 (resetUpload)
└── UI レンダリング
```

## 🔴 重要度：高（緊急対応必要）

### 1. 単一責任原則違反 (SRP Violation)
**現状**: 178行の巨大コンポーネントに複数責務が混在

**問題点**:
- アップロード、プレビュー、講評生成、状態管理、エラーハンドリングが1つのコンポーネント内
- テスト困難
- 保守性低下
- 再利用性なし

**解決策**:
```typescript
// 分割後の構造案
src/
├── app/page.tsx (メインコンポーネント、20-30行)
├── hooks/
│   ├── useUpload.ts (アップロード状態管理)
│   ├── useCritique.ts (講評生成ロジック)
│   └── useUploadFlow.ts (全体フロー統合)
└── services/
    └── critiqueService.ts (ビジネスロジック)
```

### 2. グローバルwindowオブジェクト汚染
**現状**:
```typescript
(window as Window & { __uploadFormData?: FormData }).__uploadFormData = image.formData;
```

**問題点**:
- 型安全性違反
- テスト困難
- メモリリーク潜在リスク
- SSR非対応

**解決策**:
```typescript
// useRef または適切な状態管理を使用
const formDataRef = useRef<FormData | null>(null);
// または Context API / Zustand での状態管理
```

### 3. 状態管理の複雑化
**現状**: 3つの独立した状態が密結合
```typescript
const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
const [isProcessing, setIsProcessing] = useState(false);
const [critiqueState, setCritiqueState] = useState<{...}>({ status: "idle" });
```

**問題点**:
- 状態同期の複雑性
- バグの温床
- 状態更新の一貫性保証困難

**解決策**:
```typescript
// useReducer または カスタムフック使用
type UploadState = {
  uploadedImage: UploadedImage | null;
  isProcessing: boolean;
  critique: {
    status: "idle" | "loading" | "success" | "error";
    data?: CritiqueData;
    error?: string;
  };
};
```

## 🟡 重要度：中（計画的対応）

### 4. ビジネスロジック混在
**現状**: 54-139行の講評生成ロジックがUIコンポーネント内に直書き

**問題点**:
- 単体テスト困難
- 再利用不可
- 責務分離違反

**解決策**:
```typescript
// services/critiqueService.ts
export class CritiqueService {
  async generateCritique(formData: FormData): Promise<CritiqueResult> {
    // 講評生成ロジック
  }
}
```

### 5. マジックナンバー使用
**現状**:
```typescript
setTimeout(() => { ... }, 1500);  // ハードコード
duration: 2000,                   // ハードコード
duration: 3000,                   // ハードコード
```

**解決策**:
```typescript
// constants/timing.ts
export const TIMING = {
  TOAST_SUCCESS_DURATION: 1500,
  TOAST_INFO_DURATION: 2000,
  TOAST_ERROR_DURATION: 3000,
  NAVIGATION_DELAY: 1500,
} as const;
```

### 6. エラーハンドリングの重複
**現状**: 類似のtoast.error処理が複数箇所に散在

**解決策**:
```typescript
// hooks/useErrorHandler.ts
export const useErrorHandler = () => {
  const handleCritiqueError = (error: unknown) => {
    // 共通エラーハンドリング
  };
  return { handleCritiqueError };
};
```

## 🟢 重要度：低（余裕があるときに対応）

### 7. インライン型定義
**現状**:
```typescript
const [critiqueState, setCritiqueState] = useState<{
  status: "idle" | "loading" | "success" | "error";
  data?: CritiqueData;
  error?: string;
}>({ status: "idle" });
```

**解決策**:
```typescript
// types/critique.ts
export type CritiqueState = {
  status: "idle" | "loading" | "success" | "error";
  data?: CritiqueData;
  error?: string;
};
```

### 8. 国際化未対応
**現状**: ハードコードされた日本語メッセージ

**解決策**:
```typescript
// constants/messages.ts
export const MESSAGES = {
  UPLOAD_SUCCESS: "画像をアップロードしました",
  CRITIQUE_LOADING: "AI講評を生成中...",
  // ...
} as const;
```

## リファクタリング実行計画

### Phase 1: 構造改善 (重要度：高)
1. **カスタムフック分離** → `useUpload`, `useCritique`
2. **グローバル状態削除** → `useRef` または適切な状態管理
3. **状態統合** → `useReducer` または統合カスタムフック

### Phase 2: ロジック分離 (重要度：中)
4. **サービス層作成** → `services/critiqueService.ts`
5. **定数化** → `constants/` ディレクトリ
6. **エラーハンドリング統一** → `hooks/useErrorHandler.ts`

### Phase 3: 品質改善 (重要度：低)
7. **型定義外部化** → `types/` ディレクトリ
8. **国際化対応** → `i18n` または定数化

## テスト戦略

各Phase完了後にテストを実装:

```typescript
// 例: useUpload.test.ts
describe('useUpload', () => {
  it('should handle image upload correctly', () => {
    // テストケース
  });
});
```

## 成功指標

- **行数**: 178行 → 30行以下
- **責務**: 1つのコンポーネント → 5-6個の小さな単位
- **テストカバレッジ**: 0% → 80%以上
- **再利用性**: 0個 → 3-4個のフック/サービス

---

**作成日**: 2025-09-19
**対象ファイル**: `src/app/page.tsx`
**分析者**: Claude Code
**次回更新**: リファクタリング実行後