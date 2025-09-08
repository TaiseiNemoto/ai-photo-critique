# AI Photo Critique - 実装フロー詳細

**作成日**: 2025-09-08  
**目的**: 画像アップロードから講評生成までの処理フローの実装レベル理解  
**対象**: 開発チーム・新規参画メンバー・保守担当者

本ドキュメントは、ユーザーが画像をアップロードしてから AI講評が生成されるまでの現在の処理フローを、実装レベルで詳細に説明します。

> **注意**: 本フローには複数の構造的課題が存在します。詳細は `docs/comprehensive_issues_analysis.md` を参照してください。

## 📋 処理フロー概要

### 🎯 ユーザー操作フロー

```
1. 画像ファイルを選択・ドロップ
   ↓
2. 画像プレビューとEXIF情報を確認
   ↓
3. 「講評を生成」ボタンをクリック
   ↓
4. AI分析の完了まで待機（2-5秒）
   ↓
5. 講評結果ページで内容を確認
   ↓
6. 共有リンクの生成・SNS投稿
```

### ⚙️ システム処理フロー

```
1. クライアントサイド処理
   ├─ ファイル検証（形式・サイズ）
   ├─ EXIF情報の抽出・表示
   └─ 画像プレビュー生成

2. Server Action呼び出し
   ├─ uploadImageWithCritique()
   ├─ FormData作成・送信
   └─ 統合処理の実行

3. サーバーサイド処理
   ├─ 画像最適化・リサイズ
   ├─ KVストレージへの保存
   └─ AI分析（Gemini Vision API）

4. レスポンス処理
   ├─ 結果データの受信
   ├─ Context APIへの保存
   └─ 画面遷移（/report/current）
```

## 🔍 詳細な実装フロー

### Step 1: 画像選択とブラウザ側処理

**関連ファイル**:
- `src/components/upload/UploadZone.tsx`
- `src/lib/exif.ts`

**処理内容**:

1. ユーザーがファイルをドラッグ&ドロップまたはファイル選択
2. **`UploadZone`** コンポーネントでファイル検証
   - ファイル形式チェック（JPEG, PNG, WebP, HEIC）
   - ファイルサイズ制限チェック（20MB以下）
3. **`extractExifData()`** 関数でクライアントサイドEXIF抽出
   - `exifr` ライブラリを使用
   - カメラ情報（メーカー、機種、レンズ等）を抽出
   - 撮影設定（ISO、シャッタースピード、F値等）を抽出
4. 画像プレビューURL生成（`URL.createObjectURL()`）
5. **`handleImageUploaded()`** コールバックで親コンポーネントに通知

### Step 2: アップロード画面での表示

**関連ファイル**:
- `src/app/page.tsx` (`UploadPage` コンポーネント)
- `src/components/upload/ImagePreview.tsx`
- `src/components/upload/ExifDisplay.tsx`

**処理内容**:

1. **`UploadPage`** 状態管理
   - `uploadedImage`: アップロード済み画像データ
   - `critiqueState`: 講評生成状態管理
2. **`ImagePreview`** で画像表示
3. **`ExifDisplay`** で抽出済みEXIF情報をテーブル表示
4. **`GenerateButton`** で講評生成ボタン表示

### Step 3: 講評生成ボタン押下

**関連ファイル**:
- `src/app/page.tsx` (`handleGenerateCritique()` 関数)

**処理内容**:

1. `isProcessing` 状態を `true` に設定
2. ローディングトーストを表示
3. `FormData` オブジェクト作成、画像ファイルを追加
4. **`uploadImageWithCritique()`** Server Action を呼び出し

### Step 4: Server Action による統合処理

**関連ファイル**:
- `src/app/actions.ts`

#### 4-1: `uploadImageWithCritique()` メイン処理

**処理内容**:

1. **`uploadImage()`** を呼び出してアップロード処理
2. アップロード成功時、**`generateCritique()`** を呼び出し
3. 両方の結果を統合して返却

#### 4-2: `uploadImage()` アップロード処理

**処理内容**:

1. `/api/upload` エンドポイントに `POST` リクエスト
2. FormData をそのまま転送
3. API レスポンスを既存形式に変換して返却

#### 4-3: `generateCritique()` 講評生成処理

**処理内容**:

1. `uploadId` を `FormData` に追加
2. `/api/critique` エンドポイントに `POST` リクエスト
3. API レスポンスをそのまま返却

### Step 5: API Route での実際の処理

#### 5-1: `/api/upload` - 画像アップロード処理

**関連ファイル**:
- `src/app/api/upload/route.ts`
- `src/lib/exif.ts`
- `src/lib/image.ts`
- `src/lib/kv.ts`

**処理内容**:

1. **`extractAndValidateFile()`** - FormData からファイル抽出・検証
2. **並列処理** (`Promise.all`) で効率化:
   - **`extractExifData(file)`** - サーバーサイドEXIF抽出
   - **`processImage(file)`** - 画像リサイズ・最適化
3. **`convertToDataUrl()`** - 処理済み画像をBase64 Data URLに変換
4. **`generateUploadId()`** - 一意のアップロードID生成
5. **`kvClient.saveUpload()`** - Upstash Redis に24時間TTLでデータ保存
   - アップロードメタデータ
   - EXIF情報
   - 処理済み画像（Data URL形式）
6. 成功レスポンス返却

#### 5-2: `/api/critique` - AI講評生成処理

**関連ファイル**:
- `src/app/api/critique/route.ts`
- `src/lib/critique.ts`
- `src/lib/gemini.ts`
- `src/lib/kv.ts`

**処理内容**:

1. **`extractAndValidateFile()`** - FormData からファイル抽出・検証
2. **`uploadId`** 検証（前段階でのアップロード完了確認）
3. 画像を `Buffer` 形式に変換
4. **`generatePhotoCritiqueWithRetry()`** - AI分析（リトライ機能付き）

##### 5-2-1: `generatePhotoCritiqueWithRetry()` リトライ処理

- 最大1回のリトライ（合計2回実行）
- 指数バックオフ（1秒→5秒の待機）
- 各試行で **`generatePhotoCritique()`** を呼び出し

##### 5-2-2: `generatePhotoCritique()` 実際のAI分析

- ファイル形式検証（JPEG, PNG, WebP, HEIC）
- ファイルサイズ検証（20MB制限）
- **`geminiClient.analyzeCritique()`** - Google Gemini Vision API 呼び出し
- レスポンス品質検証（文字数チェック：10-200文字）

##### 5-2-3: 成功時の追加処理

- **`kvClient.getUpload(uploadId)`** - アップロードデータからEXIF取得
- **`kvClient.generateId()`** - 共有用ID生成
- **`kvClient.saveCritique()`** - 講評データ保存（24時間TTL）
- **`kvClient.saveShare()`** - 共有データ保存（24時間TTL）
- レスポンスに `shareId` を追加して返却

### Step 6: 結果処理と画面遷移

**関連ファイル**:
- `src/app/page.tsx` (`handleGenerateCritique()` 継続)
- `src/contexts/CritiqueContext.tsx`

**処理内容**:

1. Server Action からの結果を受信
2. **成功時**:
   - `uploadedImage` 状態に講評データを追加
   - `critiqueState` を "success" に更新
   - 成功トーストを表示
   - **Context API** (`setCritiqueData()`) にデータ保存
   - 1.5秒後に `/report/current` に画面遷移（SPA的遷移）
3. **失敗時**:
   - `critiqueState` を "error" に更新
   - エラートーストを表示
   - ユーザーに再試行を促す
4. **必須処理**:
   - `isProcessing` を `false` に戻す
   - ローディングトーストを削除

## 🏗️ アーキテクチャ特徴

### 1. **ハイブリッドアプローチ**

- **Server Actions**: サーバーサイド処理の呼び出し口
- **API Routes**: 実際のビジネスロジック実装
- **Context API**: クライアントサイド状態管理

### 2. **パフォーマンス最適化**

- **並列処理**: EXIF抽出と画像処理を同時実行
- **Edge Functions**: 軽量な前処理（予定）
- **Node Functions**: AI処理などの重い処理

### 3. **エラーハンドリング戦略**

- **多段階検証**: クライアント→Server Action→API Route
- **リトライ機構**: AI処理失敗時の自動再試行
- **段階的エラー表示**: ユーザーフレンドリーなメッセージ

### 4. **データフロー管理**

- **一時保存**: Upstash Redis（24時間TTL）
- **状態管理**: React State + Context API
- **ID管理**: アップロードID → 共有ID の変換

## 📁 主要ファイルとその役割

| ファイル                        | 役割             | 主要な処理                            |
| ------------------------------- | ---------------- | ------------------------------------- |
| `src/app/page.tsx`              | メイン画面制御   | 状態管理・UI制御・画面遷移            |
| `src/app/actions.ts`            | Server Actions   | API呼び出しの統合・エラーハンドリング |
| `src/app/api/upload/route.ts`   | アップロードAPI  | 画像処理・EXIF抽出・KV保存            |
| `src/app/api/critique/route.ts` | 講評生成API      | AI分析・結果保存・共有準備            |
| `src/lib/critique.ts`           | AI分析ライブラリ | Gemini API呼び出し・リトライ制御      |
| `src/lib/exif.ts`               | EXIF処理         | メタデータ抽出・分数変換              |
| `src/lib/image.ts`              | 画像処理         | リサイズ・最適化・形式変換            |
| `src/lib/gemini.ts`             | AI クライアント  | Google Gemini Vision API 統合         |
| `src/lib/kv.ts`                 | データストレージ | Upstash Redis 操作・TTL管理           |

## ⏱️ 処理時間とボトルネック

### 典型的な処理時間

1. **EXIF抽出**: ~100ms（クライアントサイド）+ ~100ms（サーバーサイド）= ~200ms
2. **画像処理**: ~300ms（リサイズ・最適化）
3. **AI分析**: ~2-5秒（Gemini Vision API）
4. **KV保存**: ~50ms × 2回（upload + critique）= ~100ms
5. **ネットワーク転送**: 画像データ × 3回転送

### 主要なボトルネック

- **Gemini API レスポンス時間**: 全体処理時間の80-90%
- **画像データ重複転送**: 同一ファイルの3回転送によるネットワーク負荷
- **EXIF重複処理**: クライアント・サーバー両方での抽出処理
- **大容量画像の処理**: 20MB近いファイルの場合のメモリ負荷

## 📊 データフロー図

```
ユーザー操作
    ↓
UploadZone (ファイル選択)
    ↓
extractExifData() [1回目のEXIF抽出]
    ↓
ImagePreview + ExifDisplay
    ↓
uploadImageWithCritique() [Server Action]
    ↓
┌─────────────────┬─────────────────┐
│  uploadImage()  │                 │
│       ↓         │                 │
│  /api/upload    │                 │
│       ↓         │                 │
│ extractExifData │                 │
│ [2回目のEXIF抽出] │                 │
│       ↓         │                 │
│ processImage()  │                 │
│       ↓         │                 │
│ kvClient.save   │                 │
└─────────────────┘                 │
                  │                 │
                  │ generateCritique() │
                  │        ↓         │
                  │  /api/critique   │
                  │        ↓         │
                  │ extractAndValidate│
                  │ [3回目のファイル処理]│
                  │        ↓         │
                  │ Gemini API       │
                  │        ↓         │
                  │ kvClient.save    │
                  └─────────────────┘
                           ↓
Context API (setCritiqueData)
    ↓
画面遷移 (/report/current)
```

---

**作成日**: 2025-09-08  
**目的**: 現在の実装フローの詳細把握・新規メンバーのオンボーディング  
**注意**: 本フローには構造的課題があります。改善提案は `docs/comprehensive_issues_analysis.md` を参照してください。