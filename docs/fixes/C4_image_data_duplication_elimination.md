# 課題C4修正計画 - 画像データ重複保存の解消

**課題ID**: C4  
**優先度**: 🔴 Critical ⭐⭐⭐⭐  
**作成日**: 2025-09-11  
**ステータス**: 修正計画承認済み

## 🔍 課題概要

### 問題の詳細

同一画像データとEXIF情報がKVストレージに2回保存される設計欠陥が発生しています。

**現状の重複保存:**

```typescript
// 1回目: upload.ts:127 - upload:${uploadId} に画像データ(Base64) + EXIF保存
await kvClient.saveUpload(uploadId, {
  id: uploadId,
  filename: file.name,
  exifData,
  processedImage: { dataUrl, ... },  // ← 画像データ
  uploadedAt: new Date().toISOString(),
});

// 2回目: critique-core.ts:67 - critique:${shareId} にファイル名 + EXIF保存
await kvClient.saveCritique({
  id: shareId,
  filename: file.name,              // ← 重複
  technique: result.data.technique,
  composition: result.data.composition,
  color: result.data.color,
  exifData: exifData,               // ← 重複
  uploadedAt: new Date().toISOString(),
});
```

**影響:**

- **ストレージコスト**: 使用量の2倍増（コスト直結）
- **データ整合性**: 2箇所のデータ同期リスク
- **パフォーマンス**: 共有ページで複数回KVアクセス必要
- **保守性**: データフローの複雑化

**関連ファイル:**

- `src/lib/upload.ts:127` - saveUpload()呼び出し
- `src/lib/critique-core.ts:67` - saveCritique()呼び出し
- `src/lib/kv.ts:1-9` - CritiqueDataインターフェース
- `src/app/api/share/route.ts` - 画像データ取得処理

## 🎯 修正方針

### Option A: CritiqueDataに画像データ統合（採用）

**戦略**: `critique:${shareId}`キーに画像データも含めて全情報を統合し、`upload:${uploadId}`キーを削除する。

**理由:**

1. **Single Source of Truth**: 共有ページで必要なデータが1回のKVアクセスで取得可能
2. **ストレージ効率**: 使用量を50%削減
3. **データ整合性**: 同期問題の根本解決
4. **将来拡張性**: 共有機能中心のデータ設計

### 却下された代替案

**Option B: uploadId参照構造** - 講評データで画像データを参照する設計
→ 却下理由: 共有ページで2回KVアクセスが必要、パフォーマンス劣化

## 📋 修正内容

### 1. KVインターフェース修正

#### `src/lib/kv.ts` の修正

```typescript
// CritiqueDataインターフェースに画像データ追加
export interface CritiqueData {
  id: string;
  filename: string;
  technique: string;
  composition: string;
  color: string;
  exifData: Record<string, unknown>;
  imageData: string;              // ← 新規追加（Base64 data URL）
  uploadedAt: string;
}

// saveUpload, getUpload関数は削除（不要）
```

### 2. アップロード処理修正

#### `src/lib/upload.ts` の修正

```typescript
export async function uploadImageCore(
  formData: FormData,
): Promise<UploadResult> {
  // ... 既存の処理 ...

  // KVストレージ保存を削除
  // await kvClient.saveUpload(uploadId, uploadData); // ← 削除

  // レスポンスに画像データを含める（講評時に使用）
  return {
    success: true,
    data: {
      id: uploadId,
      exifData,
      processedImage: {
        dataUrl,  // ← この値を後で講評データに保存
        originalSize: processedImageResult.originalSize,
        processedSize: processedImageResult.processedSize,
      },
    },
  };
}
```

### 3. 講評処理修正

#### `src/lib/critique-core.ts` の修正

```typescript
export async function generateCritiqueCore(
  formData: FormData,
): Promise<CritiqueResult> {
  // ... 既存のAI講評処理 ...

  if (result.success && result.data) {
    // アップロードIDから画像データを取得
    const uploadId = formData.get("uploadId") as string;
    let exifData = {};
    let imageData = "";

    if (uploadId) {
      // アップロード時のレスポンスから画像データとEXIFを取得
      // ※ この時点では直前のuploadImage()の結果を利用
      const uploadData = await kvClient.getUpload(uploadId);
      exifData = uploadData?.exifData || {};
      imageData = uploadData?.processedImage?.dataUrl || "";
    }

    // 共有用IDを生成
    const shareId = kvClient.generateId();

    // 講評データに画像データも含めて保存
    await kvClient.saveCritique({
      id: shareId,
      filename: file.name,
      technique: result.data.technique,
      composition: result.data.composition,
      color: result.data.color,
      exifData: exifData as Record<string, unknown>,
      imageData: imageData,           // ← 新規追加
      uploadedAt: new Date().toISOString(),
    });

    // ... 既存の共有データ保存処理 ...
  }
}
```

### 4. 共有ページ処理修正

#### `src/app/api/share/route.ts` の修正

```typescript
// 画像データ取得をgetCritique()のみに変更
const critiqueData = await kvClient.getCritique(critiqueId);

if (!critiqueData) {
  return NextResponse.json({ error: "講評データが見つかりません" }, { status: 404 });
}

// critiqueData.imageData に画像データが含まれているため、
// 別途画像データを取得する処理は不要
return NextResponse.json({
  critique: critiqueData,
  image: critiqueData.imageData,  // ← 統合されたデータから取得
});
```

### 5. KVクライアント関数削除

#### `src/lib/kv.ts` から削除

```typescript
// 以下の関数を削除（不要となる）
// - saveUpload()
// - getUpload()
// - saveImage()  ← 単独の画像保存も不要
// - getImage()   ← 単独の画像取得も不要
```

## 🔧 実装手順（TDD方式）

### Phase 1: テスト実行・現状確認

```bash
npm run test
npm run lint
npm run build
```

### Phase 2: KVインターフェース修正

1. **RED**: CritiqueData修正後のテスト作成（失敗確認）
2. **GREEN**: `src/lib/kv.ts` CritiqueDataインターフェース修正
3. **GREEN**: 関連するテスト修正
4. **REFACTOR**: 型定義の最適化

### Phase 3: アップロード処理修正

1. **RED**: saveUpload削除後のテスト作成
2. **GREEN**: `src/lib/upload.ts` のsaveUpload呼び出し削除
3. **GREEN**: uploadImageCoreのレスポンス形式確認
4. **REFACTOR**: 不要なコードの削除

### Phase 4: 講評処理修正

1. **RED**: 画像データ統合後のテスト作成
2. **GREEN**: `src/lib/critique-core.ts` 画像データ保存追加
3. **GREEN**: saveCritiqueに画像データ含める実装
4. **REFACTOR**: データフローの最適化

### Phase 5: 共有ページ修正

1. **RED**: 統合データ使用後のテスト作成
2. **GREEN**: `src/app/api/share/route.ts` 修正
3. **GREEN**: 画像データ取得ロジック簡素化
4. **REFACTOR**: エラーハンドリング改善

### Phase 6: 不要関数削除・総合テスト

```bash
npm run test      # 全テスト通過確認
npm run lint      # ESLintエラーなし確認
npm run build     # ビルド成功確認
```

## 📊 期待効果

### ストレージ効率化

- **使用量削減**: 50%削減（重複データ排除）
- **コスト削減**: Upstashストレージ費用の大幅削減
- **TTL管理**: 統一されたデータ有効期限管理

### パフォーマンス改善

- **KVアクセス削減**: 共有ページで2回→1回
- **データ転送量削減**: 重複取得の排除
- **レスポンス速度向上**: シンプルなデータフロー

### データ整合性向上

- **Single Source of Truth**: 講評データに全情報を統合
- **同期問題排除**: 複数箇所での更新リスク解消
- **保守性向上**: シンプルなデータ管理

### 開発体験改善

- **コード簡素化**: データ取得ロジックの一元化
- **デバッグ容易**: 単一データソースでの問題特定
- **将来拡張性**: 共有機能中心の設計

## 📝 影響範囲

### 修正対象ファイル

- ✏️ `src/lib/kv.ts` - CritiqueDataインターフェース修正、不要関数削除
- ✏️ `src/lib/upload.ts` - saveUpload呼び出し削除
- ✏️ `src/lib/critique-core.ts` - 画像データ保存追加
- ✏️ `src/app/api/share/route.ts` - 画像データ取得ロジック簡素化

### テスト修正

- ✏️ `src/lib/kv.test.ts` - CritiqueData関連テスト修正
- ✏️ `src/lib/upload.test.ts` - saveUpload削除に伴うテスト修正
- ✏️ `src/lib/critique-core.test.ts` - 画像データ保存テスト追加

### 型定義への影響

- ✏️ `src/types/upload.ts` - CritiqueData型の更新反映（必要に応じて）

## 🚨 リスク管理

### 実装前の準備

- [ ] 現状のテスト全通過確認
- [ ] Git commitで現状をバックアップ
- [ ] 段階的実装（Phase順序厳守）

### 各段階での確認項目

- [ ] 該当するテストが全て通過
- [ ] `npm run lint` でエラーなし
- [ ] `npm run build` 成功
- [ ] 画像アップロード〜講評生成〜共有の動作確認

### データ移行の考慮

- [ ] 既存のupload:*キーは自然なTTL期限で削除される（24時間）
- [ ] 移行期間中の互換性は不要（開発環境のため）
- [ ] 本番環境の場合は段階的移行が必要

### 問題発生時の対処

- ロールバック手順を事前準備
- 段階的リリース（Phase単位でデプロイ・検証）
- KVデータの整合性確認スクリプト準備

## 🎯 完了定義

1. ✅ 全テストが通過
2. ✅ `npm run lint` エラーなし
3. ✅ `npm run build` 成功
4. ✅ 画像アップロード→講評生成→共有の全フロー動作確認
5. ✅ ストレージ使用量50%削減の確認
6. ✅ 共有ページの表示速度改善確認
7. ✅ KVストレージのデータ構造確認
8. ✅ コードレビュー完了
9. ✅ ドキュメント更新完了

---

**承認状況**: ✅ 承認済み（Option A: CritiqueData統合方針）  
**実装担当**: Claude Code  
**レビュー予定**: 実装完了後  
**次ステップ**: TDD方式での実装開始