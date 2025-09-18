# H4: エラーハンドリング統一性の改善計画

## 📋 課題概要

**課題ID**: H4
**優先度**: High (⭐⭐⭐)
**カテゴリ**: エラーハンドリング・型安全性

### 問題の詳細

現在のシステムでは、以下の3つの異なるエラーハンドリングパターンが混在している：

1. **Server Actions**: `FormDataResult<T>` 型（`src/lib/form-utils.ts`）
2. **API Routes**: HTTPステータス + JSONレスポンス型
3. **Components**: try-catchブロック + toast表示

この不統一により、以下の問題が発生している：

- **UX**: 不適切なエラーメッセージ表示
- **デバッグ**: エラー原因の特定困難
- **保守性**: エラー処理ロジックの分散

### 影響範囲

- 全ファイル横断的問題
- 特に `src/app/actions.ts`, `src/app/page.tsx`, `src/lib/*.ts`, `src/app/api/*/route.ts`

## 🎯 修正方針

### 1. 統一されたエラー型の導入

Next.js 15のベストプラクティスに基づき、以下の型体系を採用：

```typescript
// 基本のResult型（既存のFormDataResult<T>を拡張）
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: AppError };

// 階層化されたエラー型
export interface AppError {
  code: string; // エラーコード（一意識別用）
  message: string; // ユーザー向けメッセージ（日本語）
  details?: string; // 開発者向け詳細（英語可）
  statusCode?: number; // HTTPステータス（API Route用）
  timestamp: string; // エラー発生時刻
  stack?: string; // スタックトレース（開発環境のみ）
}
```

### 2. エラーカテゴリ体系の確立

```typescript
export enum ErrorCode {
  // バリデーションエラー (4xx系)
  FILE_NOT_SELECTED = "FILE_NOT_SELECTED",
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  UNSUPPORTED_FORMAT = "UNSUPPORTED_FORMAT",
  INVALID_FORM_DATA = "INVALID_FORM_DATA",

  // システムエラー (5xx系)
  UPLOAD_FAILED = "UPLOAD_FAILED",
  AI_SERVICE_ERROR = "AI_SERVICE_ERROR",
  STORAGE_ERROR = "STORAGE_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",

  // 外部サービスエラー
  GEMINI_API_ERROR = "GEMINI_API_ERROR",
  REDIS_CONNECTION_ERROR = "REDIS_CONNECTION_ERROR",
}
```

### 3. 中央集約化されたエラーハンドリング

```typescript
// src/lib/error-handling.ts
export class ErrorHandler {
  static createError(code: ErrorCode, details?: string): AppError;
  static handleServerActionError(error: unknown): Result<never>;
  static handleAPIRouteError(error: unknown): NextResponse;
  static logError(error: AppError): void;
}
```

## 📝 具体的な修正内容

### Phase 1: 基盤整備

1. **新規ファイル作成**:
   - `src/lib/error-handling.ts` - 統一エラーハンドリング
   - `src/lib/error-codes.ts` - エラーコード定義
   - `src/types/error.ts` - エラー型定義

2. **既存ファイル拡張**:
   - `src/lib/form-utils.ts` - Result型をAppError対応に拡張

### Phase 2: Server Actions統一

3. **修正対象ファイル**:
   - `src/app/actions.ts` - 統一エラーハンドリング適用
   - `src/lib/upload.ts` - AppError型に移行
   - `src/lib/critique-core.ts` - AppError型に移行

### Phase 3: API Routes統一

4. **修正対象ファイル**:
   - `src/app/api/data/[id]/route.ts` - 統一エラーレスポンス
   - `src/app/api/share/route.ts` - 統一エラーレスポンス
   - `src/app/api/ogp/route.ts` - 統一エラーレスポンス

### Phase 4: UI Layer統一

5. **修正対象ファイル**:
   - `src/app/page.tsx` - 統一エラー表示
   - `src/components/upload/UploadZone.tsx` - エラーコード対応
   - `src/components/report/ReportActions.tsx` - エラーコード対応

## 🧪 実装手順（TDD方式）

### Step 1: エラー型・ハンドラーのテスト作成

```typescript
// tests/lib/error-handling.test.ts
describe("ErrorHandler", () => {
  it("should create standardized error objects", () => {
    const error = ErrorHandler.createError(ErrorCode.FILE_NOT_SELECTED);
    expect(error.code).toBe("FILE_NOT_SELECTED");
    expect(error.message).toBe("ファイルが選択されていません");
    expect(error.timestamp).toBeDefined();
  });

  it("should handle Server Action errors with proper Result type", () => {
    const result = ErrorHandler.handleServerActionError(new Error("test"));
    expect(result.success).toBe(false);
    expect(result.error.code).toBeDefined();
  });
});
```

### Step 2: 最小実装でテスト通過

```typescript
// src/lib/error-handling.ts
export class ErrorHandler {
  static createError(code: ErrorCode, details?: string): AppError {
    return {
      code,
      message: ERROR_MESSAGES[code],
      details,
      timestamp: new Date().toISOString(),
      stack:
        process.env.NODE_ENV === "development" ? new Error().stack : undefined,
    };
  }
}
```

### Step 3: 段階的な各レイヤー適用

1. **Red**: 失敗するテストを作成
2. **Green**: 最小限の実装でテスト通過
3. **Refactor**: コード品質向上

各ファイルごとに上記サイクルを繰り返し実施。

## 📊 期待効果

### UX改善

- **統一されたエラーメッセージ**: ユーザーが理解しやすい一貫した表示
- **適切なエラー誘導**: エラーコードに基づく具体的な解決案提示
- **エラー状態の可視化**: 処理状況とエラー原因の明確化

### 開発体験向上

- **デバッグ効率**: 統一されたログ形式でエラー追跡が容易
- **型安全性**: AppError型によるコンパイル時エラー検知
- **保守性**: 中央集約化されたエラー処理ロジック

### パフォーマンス

- **エラー処理時間**: 統一されたハンドラーによる処理最適化
- **メモリ使用量**: 重複したエラー処理コードの削減

## 🎯 影響範囲

### 修正ファイル（19ファイル）

#### 新規作成（3ファイル）

- `src/lib/error-handling.ts` - 統一エラーハンドラー
- `src/lib/error-codes.ts` - エラーコード定義
- `src/types/error.ts` - エラー型定義

#### 修正（16ファイル）

- `src/app/actions.ts` - Server Actions統一
- `src/lib/form-utils.ts` - Result型拡張
- `src/lib/upload.ts` - エラー型統一
- `src/lib/critique-core.ts` - エラー型統一
- `src/lib/critique.ts` - エラー型統一
- `src/lib/gemini.ts` - エラー型統一
- `src/lib/image.ts` - エラー型統一
- `src/app/api/data/[id]/route.ts` - APIエラー統一
- `src/app/api/share/route.ts` - APIエラー統一
- `src/app/api/ogp/route.ts` - APIエラー統一
- `src/app/page.tsx` - UIエラー表示統一
- `src/components/upload/UploadZone.tsx` - UIエラー統一
- `src/components/report/ReportActions.tsx` - UIエラー統一
- `src/types/upload.ts` - 型定義更新

#### テストファイル（2ファイル）

- `src/lib/error-handling.test.ts` - 新規テスト
- 既存テストファイルの更新

### 削除ファイル

- なし（既存機能の互換性を保持）

## ✅ 完了定義

### 機能要件

- [ ] 全レイヤーで統一されたエラー型（AppError）を使用
- [ ] エラーコードによる分類・識別が可能
- [ ] 日本語による一貫したユーザー向けメッセージ
- [ ] 開発者向け詳細情報の提供（開発環境のみ）

### 技術要件

- [ ] `npm run test` で全テストが通過
- [ ] `npm run lint` でエラーなし
- [ ] `npm run build` で正常にビルド完了
- [ ] TypeScriptの型チェックでエラーなし

### 動作要件

- [ ] 画像アップロード〜講評生成の全フローでエラーハンドリングが統一
- [ ] 各種エラーケース（ファイル未選択、形式不正、ネットワークエラー等）で適切なメッセージ表示
- [ ] エラー発生時もアプリケーションが適切に動作継続

### パフォーマンス要件

- [ ] エラー処理による処理時間の劣化なし
- [ ] メモリ使用量の改善（重複したエラー処理コードの削減）

## 🚨 注意事項

### 互換性の維持

- 既存のエラーハンドリングを段階的に移行
- 一時的に複数のエラー型が混在する期間あり
- API契約（外部インターフェース）は変更しない

### 段階的移行

1. **Phase 1**: 新しいエラー基盤の構築
2. **Phase 2**: Server Actionsの移行
3. **Phase 3**: API Routesの移行
4. **Phase 4**: UI Layerの移行
5. **Phase 5**: 旧コードのクリーンアップ

### リスク軽減

- 各Phase完了時に動作確認を実施
- 問題発生時は前Phaseにロールバック可能
- 本番環境での段階的デプロイ推奨

---

**作成日**: 2025-09-18
**修正担当**: AI Development Team
**レビュアー**: Project Lead
**完了予定**: 2025-09-25
