# マジックナンバー定数化修正計画

## 課題概要

**課題ID**: page-tsx-analysis.md 重要度中 課題5
**問題**: `src/hooks/useUploadFlow.ts`でマジックナンバー `duration: 2000` がハードコードされている
**影響範囲**: トースト表示時間の一貫性、保守性の低下

## 修正方針

Next.jsベストプラクティスに従い、定数を一元管理する共通ファイルを作成し、マジックナンバーを完全除去する。

## 具体的な修正内容

### 1. 共通定数ファイル作成

**ファイル**: `src/lib/constants.ts`

- `useCritiqueGeneration.ts`の既存TIMING定数を移動
- MESSAGE定数も合わせて移動し、一元管理

### 2. useCritiqueGeneration.ts の修正

**ファイル**: `src/hooks/useCritiqueGeneration.ts`

- 内部定義のTIMING・MESSAGES定数を削除
- `@/lib/constants`からimportに変更

### 3. useUploadFlow.ts の修正

**ファイル**: `src/hooks/useUploadFlow.ts`

- 28行目: `duration: 2000` → `duration: TIMING.TOAST_INFO_DURATION`
- 50行目: `duration: 2000` → `duration: TIMING.TOAST_INFO_DURATION`
- 必要なimport文を追加

## 実装手順（TDD方式）

### Phase 1: Red（失敗するテストを作成）

1. ❌ 定数ファイルの存在テスト作成
2. ❌ useUploadFlow.tsでTIMING定数使用テスト作成

### Phase 2: Green（最小限実装でテスト通過）

1. ✅ `src/lib/constants.ts`作成・定数定義
2. ✅ 両フックファイルでimport・使用

### Phase 3: Refactor（品質改善）

1. ✅ 型安全性の確認
2. ✅ ESLint・Prettier実行
3. ✅ 動作テスト実行

## 期待効果

- **一貫性向上**: 全てのタイムアウト値が一箇所で管理
- **保守性向上**: 値変更時の影響範囲が明確
- **可読性向上**: 意味のある定数名で理解しやすい
- **型安全性**: as const で型推論の向上

## 影響範囲

### 修正ファイル

- `src/hooks/useCritiqueGeneration.ts` (修正)
- `src/hooks/useUploadFlow.ts` (修正)

### 新規作成ファイル

- `src/lib/constants.ts` (新規)

### 削除ファイル

なし

## 完了定義

- [ ] 全てのマジックナンバーが定数化されている
- [ ] `npm run test` 全通過
- [ ] `npm run lint` エラーなし
- [ ] `npm run build` 成功
- [ ] 画像アップロード〜講評生成の動作確認完了

## 実装コード例

```typescript
// src/lib/constants.ts
export const TIMING = {
  TOAST_SUCCESS_DURATION: 1500,
  TOAST_INFO_DURATION: 2000,
  TOAST_ERROR_DURATION: 3000,
  NAVIGATION_DELAY: 1500,
} as const;

export const MESSAGES = {
  CRITIQUE_LOADING: "AI講評を生成中...",
  CRITIQUE_LOADING_DESC: "技術・構図・色彩を分析しています",
  // ...
} as const;
```

---

**作成日**: 2025-09-22
**対象課題**: page-tsx-analysis.md 重要度中
**実施者**: Claude Code
**推定所要時間**: 15分
