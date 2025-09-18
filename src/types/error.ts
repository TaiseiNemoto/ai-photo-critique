/**
 * 統一されたエラーハンドリング型定義
 */

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

// APIレスポンス用のエラー型
export interface APIErrorResponse {
  success: false;
  error: string; // ユーザー向けメッセージ
  code?: string; // エラーコード（オプション）
  timestamp?: string; // タイムスタンプ（オプション）
}
