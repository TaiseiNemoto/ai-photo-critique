# 画像アップロードとEXIF抽出機能実装計画

## 概要

現在のAI Photo Critiqueアプリケーションは、UIコンポーネントは完成しているものの、画像アップロードとEXIF抽出の実際の処理が未実装（モックデータのみ）となっています。本ドキュメントでは、この機能を実装するための詳細な手順を記載します。

## 実装目標

- 実際の画像ファイルのアップロード処理
- EXIF情報の自動抽出と表示
- 画像の自動リサイズ・圧縮（1024px上限）
- エラーハンドリングとユーザビリティの向上

## 技術スタック

### 採用予定ライブラリ

| ライブラリ | 用途 | サイズ | 理由 |
|-----------|------|--------|------|
| `exifr` | EXIF抽出 | 7KB | 軽量、高速、TypeScript対応 |
| `browser-image-compression` | 画像圧縮 | 45KB | ブラウザサイド処理、シンプルAPI |

### 処理フロー

```mermaid
graph TD
    A[ユーザーが画像ドロップ] --> B[クライアントサイドバリデーション]
    B --> C[Server Action呼び出し]
    C --> D[EXIF抽出]
    C --> E[画像リサイズ・圧縮]
    D --> F[処理結果をクライアントに返却]
    E --> F
    F --> G[プレビュー表示]
    F --> H[EXIF情報表示]
```

## 実装計画（全75分想定）

### Phase 1: 準備・調査（10分）

#### Step 1: EXIF抽出ライブラリの調査と選定
- **対象ライブラリ**: `exif-js`, `piexifjs`, `exifr`
- **評価基準**: TypeScript対応、パフォーマンス、メンテナンス状況
- **推奨**: `exifr`（最も軽量で高速、TS完全対応）

#### Step 2: 画像処理ライブラリの調査と選定
- **候補**: `browser-image-compression`, Canvas API直接使用
- **推奨**: `browser-image-compression`（シンプルなAPI、実装コスト低）

#### Step 3: 必要なパッケージのインストール
```bash
npm install exifr browser-image-compression
npm install -D @types/exifr
```

### Phase 2: ライブラリ関数実装（20分）

#### Step 4: EXIF抽出関数の実装
- **ファイル**: `src/lib/exif.ts`
- **関数**: `extractExifData(file: File): Promise<ExifData>`
- **取得情報**: カメラ名、レンズ名、F値、シャッター速度、ISO感度、焦点距離

```typescript
// 実装予定の型定義
interface ExifData {
  make?: string;        // カメラメーカー
  model?: string;       // カメラ機種
  lensModel?: string;   // レンズ名
  fNumber?: string;     // F値
  exposureTime?: string; // シャッター速度
  iso?: string;         // ISO感度
  focalLength?: string; // 焦点距離
}
```

#### Step 5: 画像リサイズ・圧縮機能の実装
- **ファイル**: `src/lib/image.ts`
- **関数**: `processImage(file: File): Promise<ProcessedImage>`
- **仕様**: 最大1024px、品質80%、JPEG形式で出力

### Phase 3: Server Action実装（15分）

#### Step 6: 画像アップロード処理のServer Action実装
- **ファイル**: `src/app/actions.ts`
- **機能**: 
  - FormDataから画像ファイルを受け取り
  - EXIF抽出とリサイズを並列実行
  - 一時的にbase64形式で返却（後でVercel KV対応）

```typescript
// 実装予定のServer Action
export async function uploadImage(formData: FormData): Promise<UploadResult> {
  // 並列処理でパフォーマンス向上
  const [exifData, processedImage] = await Promise.all([
    extractExifData(file),
    processImage(file)
  ]);
  
  return {
    success: true,
    data: { exifData, processedImage }
  };
}
```

### Phase 4: フロントエンド統合（20分）

#### Step 7: UploadZoneコンポーネントの修正
- **ファイル**: `src/components/upload/UploadZone.tsx`
- **変更点**:
  - react-dropzoneの処理を実際のServer Action呼び出しに変更
  - ローディング状態の表示
  - エラー処理の追加

#### Step 8: ExifDisplayコンポーネントの修正
- **ファイル**: `src/components/upload/ExifDisplay.tsx`
- **変更点**:
  - 実際のEXIFデータを表示
  - モックデータの削除
  - データが取得できない場合の代替表示

#### Step 9: メインページの修正
- **ファイル**: `src/app/page.tsx`
- **変更点**:
  - `setTimeout`を使ったモック処理を削除
  - Server Actionとの実際の統合
  - 適切なエラーハンドリング

### Phase 5: エラー処理・テスト（10分）

#### Step 10: エラーハンドリングの実装
- **バリデーション**:
  - 対応ファイル形式: JPEG, PNG, TIFF, RAW
  - ファイルサイズ制限: 10MB
  - EXIF抽出失敗時の代替処理

#### Step 11: テスト実行と動作確認
- **テストケース**:
  - 各種カメラ・スマートフォンで撮影した画像
  - EXIF情報あり・なしの両パターン
  - 大容量ファイルの処理
  - レスポンス時間の測定（目標: 3秒以内）

## 実装後の成果物

### 新規作成ファイル
- `src/lib/exif.ts` - EXIF抽出ライブラリ
- `src/lib/image.ts` - 画像処理ライブラリ
- `src/app/actions.ts` - Server Actions

### 修正ファイル
- `src/components/upload/UploadZone.tsx`
- `src/components/upload/ExifDisplay.tsx`
- `src/app/page.tsx`
- `src/types/upload.ts` (型定義の拡張)

## パフォーマンス目標

- **画像処理時間**: 3秒以内（2MB JPEG画像想定）
- **EXIF抽出時間**: 500ms以内
- **ファイルサイズ削減**: 元画像の30-50%（品質を保持）

## 今後の拡張予定

1. **Vercel KV統合**: 画像の永続化とメタデータ保存
2. **RAW形式対応**: より詳細なEXIF情報の取得
3. **バッチ処理**: 複数画像の同時アップロード
4. **プログレス表示**: リアルタイムの処理状況表示

---

**作成日**: 2025-07-29  
**想定実装時間**: 75分  
**優先度**: 高（アプリ完成に必須）