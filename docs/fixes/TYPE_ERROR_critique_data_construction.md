# 型エラー修正計画: CritiqueData構築の実装

## 📋 概要

**問題**: `upload-service.ts:151` で型エラーが発生

- `CritiqueContent & { shareId?: string }` を `CritiqueData` に渡そうとしている
- 不足プロパティ: `id`, `filename`, `uploadedAt`, `imageData`, `exifData`, `createdAt`, `expiresAt`

**修正方針**: フロントエンドで完全な `CritiqueData` オブジェクトを構築（方針A）

**影響範囲**:

- 実装: `src/services/upload-service.ts` のみ
- テスト: `src/services/upload-service.test.ts`

---

## ✅ 修正チェックリスト

### Phase 1: 型定義の確認

- [x] `CritiqueData` 型の定義を確認 (`src/lib/kv.ts`)
- [x] `CritiqueContent` 型の定義を確認 (`src/types/upload.ts`)
- [x] 不足プロパティのリストアップ完了
- [x] テストファイルの存在確認

### Phase 2: データマッピングの設計

- [x] フロントエンドで利用可能なデータソースを特定
  - [x] `state.uploadedImage.file.name` → `filename`
  - [x] `state.uploadedImage.preview` → `imageData` (Data URL)
  - [x] `state.uploadedImage.exif` → `exifData`
  - [x] `result.critique.data.shareId` → `id`, `shareId`
  - [x] 現在時刻 → `uploadedAt`, `createdAt`
  - [x] 現在時刻 + 24h → `expiresAt`

### Phase 3: 実装

- [x] `upload-service.ts` の `generateCritique` 関数を修正
  - [x] `result.critique.success` チェック内で `CritiqueData` を構築
  - [x] 各プロパティを適切にマッピング
  - [x] `setCritiqueState` に完全な `CritiqueData` を渡す
  - [x] `setCritiqueData` に同じデータを再利用（重複解消）

### Phase 4: テストの修正

- [x] `upload-service.test.ts` のモックデータを修正
  - [x] `mockCritiqueData` の型を `CritiqueData` のまま維持
  - [x] 不足していたプロパティを追加
    - [x] `filename: string`
    - [x] `uploadedAt: string`
    - [x] `imageData: string`
    - [x] `exifData: Record<string, unknown>`
    - [x] `shareId: string`
    - [x] `createdAt: string`
    - [x] `expiresAt: string`
  - [x] `mockResult.critique.data` を `CritiqueContent & { shareId }` 形式に変更
  - [x] テスト内のアサーションを調整

### Phase 5: 検証

- [x] TypeScript型チェックが通ること (`npm run build`)
- [x] ビルドエラーが解消されること
- [x] ユニットテストが通ること (`npm run test`)
- [x] Lintエラーがないこと (`npm run lint`)
- [x] コードフォーマット済み (`npm run format`)

---

## 🔧 実装詳細

### 修正対象ファイル

#### 1. `src/services/upload-service.ts`

**修正箇所**: `generateCritique` 関数内 (行 148-165)

**修正前:**

```typescript
if (result.critique.success && result.critique.data) {
  setCritiqueState({
    status: "success",
    data: result.critique.data, // ← 型エラー
  });

  toast.success(MESSAGES.CRITIQUE_SUCCESS, {
    description: MESSAGES.CRITIQUE_SUCCESS_DESC,
    duration: TIMING.TOAST_SUCCESS_DURATION,
  });

  setTimeout(() => {
    setCritiqueData({
      image: state.uploadedImage!,
      critique: result.critique.data!,
    });
    router.push("/report/current");
  }, TIMING.NAVIGATION_DELAY);
}
```

**修正後:**

```typescript
if (result.critique.success && result.critique.data) {
  // 完全なCritiqueDataオブジェクトを構築
  const now = new Date();
  const fullCritiqueData: CritiqueData = {
    id: result.critique.data.shareId!,
    filename: state.uploadedImage!.file.name,
    uploadedAt: now.toISOString(),
    technique: result.critique.data.technique,
    composition: result.critique.data.composition,
    color: result.critique.data.color,
    overall: result.critique.data.overall,
    imageData: state.uploadedImage!.preview,
    exifData: state.uploadedImage!.exif || {},
    shareId: result.critique.data.shareId!,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
  };

  setCritiqueState({
    status: "success",
    data: fullCritiqueData,
  });

  toast.success(MESSAGES.CRITIQUE_SUCCESS, {
    description: MESSAGES.CRITIQUE_SUCCESS_DESC,
    duration: TIMING.TOAST_SUCCESS_DURATION,
  });

  setTimeout(() => {
    setCritiqueData({
      image: state.uploadedImage!,
      critique: fullCritiqueData, // 構築済みデータを再利用
    });
    router.push("/report/current");
  }, TIMING.NAVIGATION_DELAY);
}
```

---

#### 2. `src/services/upload-service.test.ts`

**修正箇所1**: モックデータの型定義 (行 105-112)

**修正前:**

```typescript
const mockCritiqueData: CritiqueData = {
  technique: { title: "技術", content: "良好", score: 8 },
  composition: { title: "構図", content: "バランス良い", score: 9 },
  color: { title: "色彩", content: "鮮やか", score: 7 },
  overall: { content: "総評", improvement: "改善点" },
  processingTime: 2500,
  id: "test-id",
};
```

**修正後:**

```typescript
// CritiqueContent形式（APIレスポンス形式）
const mockCritiqueContent = {
  technique: "技術面の講評内容",
  composition: "構図面の講評内容",
  color: "色彩面の講評内容",
  overall: "総合評価の内容",
  shareId: "test-share-id",
};

// 完全なCritiqueData（フロントエンドで構築される形式）
const expectedFullCritiqueData: CritiqueData = {
  id: "test-share-id",
  filename: "test.jpg",
  uploadedAt: expect.any(String),
  technique: "技術面の講評内容",
  composition: "構図面の講評内容",
  color: "色彩面の講評内容",
  overall: "総合評価の内容",
  imageData: "data:image/jpeg;base64,test",
  exifData: { camera: "Test Camera" },
  shareId: "test-share-id",
  createdAt: expect.any(String),
  expiresAt: expect.any(String),
};
```

**修正箇所2**: モックレスポンスの修正 (行 114-117)

**修正前:**

```typescript
const mockResult = {
  upload: { success: true, data: { id: "test-id" } },
  critique: { success: true, data: mockCritiqueData },
};
```

**修正後:**

```typescript
const mockResult = {
  upload: { success: true, data: { id: "test-id" } },
  critique: { success: true, data: mockCritiqueContent }, // CritiqueContent形式
};
```

**修正箇所3**: アサーションの修正 (行 137)

**修正前:**

```typescript
expect(result.current.state.critique.data).toEqual(mockCritiqueData);
```

**修正後:**

```typescript
expect(result.current.state.critique.data).toMatchObject({
  id: "test-share-id",
  filename: "test.jpg",
  technique: "技術面の講評内容",
  composition: "構図面の講評内容",
  color: "色彩面の講評内容",
  overall: "総合評価の内容",
  imageData: "data:image/jpeg;base64,test",
  exifData: { camera: "Test Camera" },
  shareId: "test-share-id",
});
// タイムスタンプの存在確認
expect(result.current.state.critique.data?.uploadedAt).toBeDefined();
expect(result.current.state.critique.data?.createdAt).toBeDefined();
expect(result.current.state.critique.data?.expiresAt).toBeDefined();
```

---

## 🎯 データマッピング仕様

| `CritiqueData` プロパティ | データソース                        | 備考                                |
| ------------------------- | ----------------------------------- | ----------------------------------- |
| `id`                      | `result.critique.data.shareId!`     | 共有ID（必須）                      |
| `filename`                | `state.uploadedImage!.file.name`    | 元ファイル名                        |
| `uploadedAt`              | `new Date().toISOString()`          | アップロード時刻                    |
| `technique`               | `result.critique.data.technique`    | 技術面講評                          |
| `composition`             | `result.critique.data.composition`  | 構図面講評                          |
| `color`                   | `result.critique.data.color`        | 色彩面講評                          |
| `overall`                 | `result.critique.data.overall`      | 総合評価                            |
| `imageData`               | `state.uploadedImage!.preview`      | Data URL形式（blob:プレフィックス） |
| `exifData`                | `state.uploadedImage!.exif \|\| {}` | EXIF情報（オプショナル）            |
| `shareId`                 | `result.critique.data.shareId!`     | 共有ID（idと同値）                  |
| `createdAt`               | `new Date().toISOString()`          | 作成時刻                            |
| `expiresAt`               | `new Date(now + 24h).toISOString()` | 有効期限（24時間後）                |

---

## ⚠️ 注意事項

### 必須チェック項目

1. **`shareId` の存在確認**: `result.critique.data.shareId` が必ず存在すること
   - サーバー側で生成済み（`critique-core.ts:55-74`）
   - TypeScriptでは `!` アサーションを使用

2. **`state.uploadedImage` の存在確認**: 既に関数冒頭で確認済み
   - `if (!state.uploadedImage) return;` (行132)

3. **`exifData` の型互換性**:
   - `ExifData | undefined` → `Record<string, unknown>`
   - `|| {}` でフォールバック

4. **Data URL形式について**:
   - `state.uploadedImage.preview` は `URL.createObjectURL()` で生成
   - `blob:http://localhost:3000/...` 形式
   - サーバー側では Base64 Data URL だが、フロントエンドでは Blob URL
   - 両形式とも `imageData` として保存可能

### タイムスタンプの統一

- `uploadedAt`, `createdAt`, `expiresAt` は同一の `now` 基準
- サーバー側の保存データ（`critique-core.ts:61-62`）と形式を揃える

### 型の整合性

- `CritiqueData` の `technique`, `composition`, `color` は `string` 型
- `overall` は `string | undefined` 型（オプショナル）
- 古いテストでは `{ title, content, score }` 形式だったが、実際の型定義は `string`

---

## 🧪 検証シナリオ

### 単体検証

```bash
# TypeScript型チェック
npm run build

# ユニットテスト
npm run test src/services/upload-service.test.ts

# Lintチェック
npm run lint

# フォーマット
npm run format
```

### 統合検証（手動）

1. 画像をアップロード
2. 講評生成ボタンをクリック
3. `/report/current` に遷移することを確認
4. 講評内容が正しく表示されることを確認
5. 共有ボタンが動作することを確認
6. ブラウザコンソールにエラーがないことを確認

---

## 📚 関連ドキュメント

- [データ統合仕様書](./DATA_INTEGRATION_critique_share_unification.md)
- [型定義: CritiqueData](../../src/lib/kv.ts:1-14)
- [型定義: CritiqueContent](../../src/types/upload.ts:7-10)
- [型定義: CritiqueResult](../../src/types/upload.ts:22-29)

---

## 📝 変更履歴

- 2025-09-30 13:30: 初版作成（修正計画策定）
- 2025-09-30 13:45: テスト修正計画を追加
- 2025-09-30 14:15: 実装完了、全チェックリスト完了マーク
