# C1: 画像データの3重転送問題修正計画

**課題ID**: C1  
**優先度**: ⭐⭐⭐⭐⭐ Critical  
**作成日**: 2025-09-10  
**アプローチ**: 統合アップロード（承認済み）

## 📋 課題概要

### 問題の詳細

同一画像ファイルがサーバーに3回転送され、さらに画像選択だけして離脱するユーザーのデータがDBに無駄に蓄積される設計欠陥。

### 現状の転送・保存フロー

```typescript
// 1回目: UploadZone.tsx:40 - プレビュー用転送 + DB保存
const result = await uploadImage(formData); // DB保存発生

// 2回目: page.tsx:54 - 講評生成時の転送
const result = await uploadImageWithCritique(formData);

// 3回目: actions.ts:45 - uploadImageWithCritique内での重複転送 + DB再保存
const uploadResult = await uploadImageCore(formData); // DB保存発生

// 4回目: actions.ts:60,64 - 講評生成で同一画像を再度転送
critiqueFormData.append("image", formData.get("image") as File);
```

### 無駄なDB使用の問題

- **画像選択のみユーザー**: プレビューだけ見て離脱 → DBに無駄なデータ蓄積
- **講評実行ユーザー**: 同一データが2回DB保存される

## 🎯 修正方針

### 統合アップロード戦略

**基本方針**: 画像選択時はクライアントサイドプレビューのみ実行し、DB保存は講評生成時の1回のみとする。

**設計原則**:

1. **遅延実行**: 必要になるまでサーバー処理を実行しない
2. **無駄排除**: 画像選択のみユーザーのDBリソース消費を防止
3. **効率化**: 講評生成時に全処理を1回で完結

## 🔧 具体的な修正内容

### 1. UploadZone.tsx（プレビュー専用化）

**現状**:

```typescript
// フルサーバー処理（EXIF + 画像処理 + DB保存）
const result = await uploadImage(formData);
```

**修正後**:

```typescript
// クライアントサイドプレビューのみ
const processImageFile = async (file: File) => {
  // ローカルプレビュー作成
  const preview = URL.createObjectURL(file);

  // クライアントサイドEXIF抽出（軽量）
  const exifData = await extractExifDataClient(file);

  return { file, preview, exif: exifData };
};
```

### 2. page.tsx（講評生成時の統合処理）

**現状**:

```typescript
// 分離された処理
// 1. アップロード済みの状態
// 2. 講評生成で再度アップロード
const result = await uploadImageWithCritique(formData);
```

**修正後**:

```typescript
// 講評生成時に初回アップロード + 講評を統合実行
const handleGenerateCritique = async () => {
  const formData = new FormData();
  formData.append("image", uploadedImage.file);

  // 初回のDB保存 + 講評生成を同時実行
  const result = await uploadImageWithCritique(formData);
};
```

### 3. actions.ts（重複処理完全排除）

**現状**:

```typescript
export async function uploadImageWithCritique(formData: FormData) {
  const uploadResult = await uploadImageCore(formData); // 重複
  // ...
  const critiqueResult = await generateCritiqueCore(critiqueFormData); // 重複転送
}
```

**修正後**:

```typescript
export async function uploadImageWithCritique(formData: FormData) {
  // 1回のみのアップロード + 講評生成の統合処理
  const uploadResult = await uploadImageCore(formData);

  if (!uploadResult.success) {
    return {
      upload: uploadResult,
      critique: { success: false, error: uploadResult.error },
    };
  }

  // アップロード済みデータを活用して講評生成（画像再転送なし）
  const critiqueResult = await generateCritiqueFromUploadData(
    uploadResult.data,
  );

  return { upload: uploadResult, critique: critiqueResult };
}
```

### 4. 新しいクライアントサイドEXIF処理

**新規作成**: `src/lib/exif-client.ts`

```typescript
// ブラウザでのEXIF抽出（軽量・高速）
export async function extractExifDataClient(file: File): Promise<ExifData> {
  // exif-js等のライブラリを活用したクライアントサイド処理
}
```

## 📝 実装手順

### Phase 1: テスト準備（TDD - Red）

1. **既存テストの確認**

   ```bash
   npm run test -- --testPathPattern="upload|critique"
   ```

2. **新しいテストケース作成**
   - UploadZoneがDB保存を行わないことのテスト
   - 講評生成時のみDB保存が発生することのテスト
   - クライアントサイドEXIF抽出のテスト

### Phase 2: 最小実装（TDD - Green）

1. **UploadZone.tsx修正**
   - サーバー処理呼び出しを削除
   - クライアントサイドプレビュー実装

2. **lib/exif-client.ts新規作成**
   - ブラウザでのEXIF抽出機能

3. **actions.ts修正**
   - `uploadImageWithCritique`の重複排除
   - 統合処理の実装

4. **page.tsx修正**
   - 新しいフローに対応

### Phase 3: リファクタリング（TDD - Refactor）

1. **型定義の整理**
   - クライアントサイド処理対応

2. **エラーハンドリング統一**
   - クライアント・サーバーの適切な分離

3. **パフォーマンス最適化**
   - メモリ使用量の最適化

## 🎯 期待効果

### パフォーマンス改善

- **画像転送量**: 3回 → **1回**（66%削減）
- **DB保存**: 講評実行時のみ → **無駄なDB使用量ゼロ**
- **プレビュー表示**: サーバー処理待機 → **即座表示**

### コスト削減

- **Vercel転送量**: 66%削減
- **Upstash KVストレージ**: 画像選択のみユーザー分の無駄排除

### ユーザビリティ向上

- **プレビュー**: 即座表示で体感速度向上
- **離脱ユーザー**: DBリソース消費なし

## 📊 影響範囲

### 修正ファイル

- `src/components/upload/UploadZone.tsx` - クライアントサイド処理化
- `src/app/page.tsx` - 統合フロー対応
- `src/app/actions.ts` - 重複排除・統合処理
- `src/types/upload.ts` - 型定義更新（必要に応じて）

### 新規作成ファイル

- `src/lib/exif-client.ts` - クライアントサイドEXIF処理

### 削除ファイル

- 該当なし

### 依存関係追加

- `exif-js` または類似のクライアントサイドEXIFライブラリ

## ✅ 完了定義

### 必須条件

- [ ] `npm run test` 全通過
- [ ] `npm run lint` エラーなし
- [ ] `npm run build` 成功
- [ ] 画像選択→プレビュー表示が即座に動作
- [ ] 講評生成時のみDB保存が1回発生することの確認
- [ ] 画像転送が講評生成時の1回のみであることの確認

### 検証項目

- [ ] 画像選択のみではDB保存が発生しない
- [ ] プレビュー表示が瞬時に完了する
- [ ] 講評生成がスムーズに動作する
- [ ] EXIF情報が正しく表示される
- [ ] エラーハンドリングが適切に動作する

## 🚨 リスク管理

### 潜在的リスク

1. **クライアントサイド制限**: ブラウザでのEXIF抽出の制限
2. **ファイルサイズ**: 大容量ファイルのクライアント処理
3. **ブラウザ互換性**: 古いブラウザでの動作

### 対策

1. **フォールバック**: クライアント処理失敗時のサーバー処理
2. **プログレッシブ**: 段階的機能提供
3. **テスト**: 各種ブラウザでの動作確認

## 📈 検証方法

### 性能測定

```typescript
// プレビュー表示時間
console.time("preview-display");
// クライアント処理
console.timeEnd("preview-display");

// DB保存回数の確認
// 画像選択時: 0回
// 講評生成時: 1回のみ
```

### 自動テスト

```typescript
// DB保存回数のモック検証
test("画像選択時はDB保存されない", () => {
  // UploadZone操作
  expect(uploadImageCore).not.toHaveBeenCalled();
});

test("講評生成時のみDB保存される", () => {
  // 講評生成実行
  expect(uploadImageCore).toHaveBeenCalledTimes(1);
});
```

---

**完了予定**: 2025-09-10  
**レビュアー**: 開発チーム  
**関連課題**: H1（UploadZone責務違反）、C3（EXIF重複処理）
