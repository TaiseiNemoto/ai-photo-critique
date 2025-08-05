# AI講評生成機能実装計画

## 概要

AI Photo Critiqueアプリケーションの核心機能であるAI講評生成システムの実装計画書です。既存の画像アップロード機能（Phase 4完了）を基盤として、Google Gemini Vision APIによる写真講評システムを構築します。

## 実装目標

- Google Gemini Vision APIを統合したAI講評システム
- 技術・構図・色彩の3軸評価による体系的フィードバック
- 日本語での建設的な講評提供
- 5秒以内のレスポンス時間実現（Geminiの高速処理活用）

## 現在の状況分析

### ✅ 既存実装状況（2025-08-04時点）

| 項目 | 状況 | 詳細 |
|------|------|------|
| 画像アップロード機能 | ✅ 完全実装 | EXIF抽出、リサイズ、37テスト成功 |
| UI コンポーネント | ✅ 実装済み | 講評表示用コンポーネント完備 |
| Gemini設定 | ✅ 準備済み | 環境変数設定準備完了 |
| テスト環境 | ✅ 完備 | MSWによるモック体制 |

### ❌ 未実装箇所

- `lib/gemini.ts` クライアント未作成
- Gemini依存関係未インストール（`@google/generative-ai`パッケージ）
- AI講評生成のServer Action未実装
- 講評データ型定義未整備
- フロントエンドとの統合未完了

## 技術スタック

### 新規採用ライブラリ

| ライブラリ | 用途 | 理由 |
|------------|------|------|
| `@google/generative-ai` | Gemini API クライアント | 公式ライブラリ、TypeScript完全対応、軽量 |

### API仕様

- **Gemini 1.5 Pro**: 画像解析＋講評テキスト生成（マルチモーダル）
- **Vision機能**: JPEG, PNG, WebP, HEIC対応
- **JSON出力**: 構造化された講評データ取得
- **Google AI Studio**: 無料枠内での開発・テスト

## 実装計画（総時間: 90分想定）

### Phase 1: 準備・セットアップ（15分）

#### Step 1: Gemini依存関係のインストール（5分）

```bash
npm install @google/generative-ai
```

**チェックリスト:**
- [ ] パッケージインストール完了
- [ ] package.jsonへの追加確認
- [ ] TypeScript型定義利用可能確認（内蔵済み）

#### Step 2: 型定義の拡張（5分）

**対象ファイル:** `src/types/upload.ts`

```typescript
// 追加予定の型定義
interface CritiqueData {
  technique: string;    // 技術面の講評（50-100文字）
  composition: string;  // 構図面の講評（50-100文字）
  color: string;       // 色彩面の講評（50-100文字）
  overall?: string;    // 総合評価（オプション）
}

interface CritiqueResult {
  success: boolean;
  data?: CritiqueData;
  error?: string;
  processingTime?: number; // デバッグ用
}

// 既存のUploadedImageを拡張
interface UploadedImage {
  file: File;
  preview: string;
  exif?: ExifData;
  critique?: CritiqueData; // 新規追加
}
```

#### Step 3: 環境変数の確認（5分）

**チェック項目:**
- [ ] `.env.local`ファイル存在確認
- [ ] `GOOGLE_AI_API_KEY`設定確認
- [ ] Google AI Studio API キーの有効性テスト

### Phase 2: Geminiクライアント実装（20分）

#### Step 4: Geminiクライアントの作成（10分）

**新規ファイル:** `src/lib/gemini.ts`

```typescript
// 実装予定の基本構造
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

// Gemini 1.5 Pro with Vision
const model = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-pro',
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 1024,
    responseMimeType: "application/json"
  }
});

export { model };

// エラーハンドリング関数
export class GeminiError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'GeminiError';
  }
}
```

**実装要件:**
- 環境変数からAPIキー取得
- Gemini 1.5 Pro モデル設定
- JSON出力設定
- エラーハンドリングクラス定義
- レート制限対応（Google AI Studio無料枠：15RPM）

#### Step 5: プロンプト設計・実装（10分）

**プロンプト仕様:**

```typescript
const CRITIQUE_PROMPT = `
あなたは経験豊富な写真講師です。提供された写真について、アマチュア写真家のスキル向上を目的とした建設的な講評を日本語で提供してください。

評価軸：
1. 技術面：露出、ピント、ISO設定、シャッタースピードなどの技術的要素
2. 構図面：被写体配置、バランス、視線誘導、トリミングなどの構図要素  
3. 色彩面：色温度、彩度、コントラスト、色バランスなどの色彩要素

各軸につき2-3行（50-100文字程度）の具体的で建設的なアドバイスを提供してください。
批判的ではなく、改善点と良い点の両方を含めた指導的なトーンでお願いします。

必ずJSON形式で以下の構造で回答してください：
{
  "technique": "技術面の講評",
  "composition": "構図面の講評", 
  "color": "色彩面の講評"
}
`;
```

### Phase 3: AI講評生成機能実装（25分）

#### Step 6: 講評生成関数の実装（15分）

**新規ファイル:** `src/lib/critique.ts`

```typescript
// 実装予定の関数構造
export async function generateCritique(
  imageBuffer: Buffer,
  mimeType: string
): Promise<CritiqueResult> {
  // 1. 画像をbase64エンコード
  // 2. Gemini Vision APIに画像とプロンプトを送信
  // 3. JSON形式での講評生成
  // 4. レスポンス解析とバリデーション
  // 5. エラーハンドリング
}
```

**実装詳細:**
- 画像フォーマット対応: JPEG, PNG, WebP, HEIC
- 最大画像サイズ: 20MB（既存制限と同一）
- リトライ機能: 1回まで
- タイムアウト: 20秒（Geminiの高速処理）

#### Step 7: Server Actionの拡張（10分）

**対象ファイル:** `src/app/actions.ts`

```typescript
// 追加予定のServer Action
export async function generateCritique(formData: FormData): Promise<CritiqueResult> {
  try {
    // 1. ファイル取得・バリデーション
    // 2. 画像処理（リサイズ済みを使用）
    // 3. AI講評生成呼び出し
    // 4. 結果返却
  } catch (error) {
    // エラーハンドリング
  }
}

// 既存のuploadImageとの統合も検討
export async function uploadImageWithCritique(formData: FormData): Promise<{
  upload: UploadResult;
  critique: CritiqueResult;
}> {
  // 並列処理で効率化
}
```

### Phase 4: フロントエンド統合（20分）

#### Step 8: メインページの講評機能統合（10分）

**対象ファイル:** `src/app/page.tsx`

**実装内容:**
- 講評生成状態の管理（idle/loading/success/error）
- 「講評を生成」ボタンの実装
- ローディングスピナー表示
- エラーメッセージ表示
- 講評結果の状態管理

```typescript
// 追加予定の状態管理
const [critiqueState, setCritiqueState] = useState<{
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: CritiqueData;
  error?: string;
}>({ status: 'idle' });
```

#### Step 9: 講評表示コンポーネントの接続（10分）

**対象ファイル:** `src/components/report/CritiqueCard.tsx`

**実装内容:**
- モックデータの削除
- 実際のAI講評データ表示
- 3軸評価の適切なレイアウト
- ローディング状態の表示
- エラー状態の表示

### Phase 5: テスト・最適化（10分）

#### Step 10: テスト実装（5分）

**新規ファイル:** `src/lib/critique.test.ts`

```typescript
// 実装予定のテストケース
describe('generateCritique', () => {
  it('正常な画像に対して講評を生成する');
  it('不正な画像形式でエラーを返す');
  it('API エラー時に適切にハンドリングする');
  it('タイムアウト時にエラーを返す');
  it('レート制限時のエラーハンドリング');
});
```

**MSWモック設定:**
- Gemini API のレスポンスモック
- エラーケースのシミュレーション
- レスポンス時間のテスト
- レート制限のシミュレーション

#### Step 11: 動作確認・調整（5分）

**確認項目:**
- [ ] 実際のGemini API呼び出し成功
- [ ] 講評品質の確認
- [ ] レスポンス時間測定（目標: 5秒以内）
- [ ] エラーケースの動作確認
- [ ] レート制限の動作確認（15RPM）
- [ ] UI/UXの最終調整

## パフォーマンス・品質目標

### 📊 パフォーマンス指標

| 項目 | 目標値 | 測定方法 |
|------|--------|----------|
| API応答時間 | 5秒以内 | Server Action実行時間（Gemini高速化） |
| 講評文字数 | 各軸50-100文字 | テキスト長測定 |
| エラー率 | 5%以下 | リトライ含む成功率 |
| 同時処理数 | 15リクエスト/分 | Google AI Studio無料枠制限 |

### 🎯 品質基準

**講評品質:**
- 建設的で具体的なフィードバック
- 技術的正確性の確保
- 日本語の自然性
- アマチュア向けの理解しやすさ

**エラーハンドリング:**
- ユーザーフレンドリーなエラーメッセージ
- 適切なリトライ機能
- Google AI Studioレート制限への対応（15RPM）
- ネットワークエラーの処理

## 実装後の成果物

### 📁 新規作成ファイル

```
src/
├── lib/
│   ├── gemini.ts          # Geminiクライアント
│   ├── critique.ts        # 講評生成機能  
│   └── critique.test.ts   # テストファイル
```

### 📝 修正対象ファイル

```
src/
├── types/upload.ts        # 型定義拡張（CritiqueData等）
├── app/actions.ts         # Server Action追加
├── app/page.tsx          # 講評機能統合
└── components/report/
    └── CritiqueCard.tsx  # 実データ対応
```

### 📦 依存関係追加

```json
{
  "dependencies": {
    "@google/generative-ai": "^0.x.x"
  }
}
```

## セキュリティ・コスト考慮

### 🔒 セキュリティ

- API キーの環境変数管理
- 画像データの一時的な処理（永続化なし）
- リクエストレート制限の実装
- 入力値バリデーションの強化

### 💰 コスト管理

**Google AI Studio無料枠:**
- 月間制限: 15リクエスト/分、100万トークン/日
- 画像処理: 無料（制限内）
- 月間想定: 1000リクエスト = 完全無料（制限内）

**制限超過時の料金（Vertex AI移行時）:**
- Gemini 1.5 Pro: $1.25/1M input tokens
- 画像処理: $0.000265/image (1024px)

**最適化施策:**
- 無料枠内での運用継続
- レート制限の適切な管理
- 将来的なVertex AI移行計画

## 今後の拡張計画

### 🚀 短期拡張（次フェーズ）

1. **Vercel KV統合**: 講評結果のキャッシュ
2. **バッチ処理**: 複数画像の同時処理
3. **講評履歴**: ユーザーの過去講評管理

### 🌟 中長期拡張

1. **カスタマイズ機能**: ユーザー好みの講評スタイル
2. **学習機能**: ユーザーフィードバックによる改善
3. **多言語対応**: 英語・韓国語等の講評生成

## まとめ

本実装計画により、AI Photo Critiqueアプリケーションの核心機能であるAI講評生成システムが完成します。既存の画像アップロード基盤を活用し、90分の実装時間でプロダクションレディな機能を提供します。

**実装優先度: 最高**  
**推定工数: 90分**  
**依存関係: 画像アップロード機能（完了済み）**

---

**作成日**: 2025-08-05  
**更新日**: 2025-08-05  
**作成者**: Claude Code  
**関連Issue**: AI講評生成機能実装