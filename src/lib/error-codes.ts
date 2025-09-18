/**
 * アプリケーション全体で使用するエラーコード定義
 */

export enum ErrorCode {
  // バリデーションエラー (4xx系)
  FILE_NOT_SELECTED = "FILE_NOT_SELECTED",
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  UNSUPPORTED_FORMAT = "UNSUPPORTED_FORMAT",
  INVALID_FORM_DATA = "INVALID_FORM_DATA",
  FILE_EMPTY = "FILE_EMPTY",
  INVALID_FILE_TYPE = "INVALID_FILE_TYPE",
  INVALID_REQUEST = "INVALID_REQUEST",

  // システムエラー (5xx系)
  UPLOAD_FAILED = "UPLOAD_FAILED",
  AI_SERVICE_ERROR = "AI_SERVICE_ERROR",
  STORAGE_ERROR = "STORAGE_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  PROCESSING_ERROR = "PROCESSING_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",

  // 外部サービスエラー
  GEMINI_API_ERROR = "GEMINI_API_ERROR",
  GEMINI_QUOTA_EXCEEDED = "GEMINI_QUOTA_EXCEEDED",
  GEMINI_UNAUTHORIZED = "GEMINI_UNAUTHORIZED",
  GEMINI_TIMEOUT = "GEMINI_TIMEOUT",
  REDIS_CONNECTION_ERROR = "REDIS_CONNECTION_ERROR",

  // データアクセスエラー
  DATA_NOT_FOUND = "DATA_NOT_FOUND",
  DATA_EXPIRED = "DATA_EXPIRED",
  INVALID_ID = "INVALID_ID",
}

// エラーコードに対応するユーザー向けメッセージ
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // バリデーションエラー
  [ErrorCode.FILE_NOT_SELECTED]: "ファイルが選択されていません",
  [ErrorCode.FILE_TOO_LARGE]: "ファイルサイズが制限を超えています",
  [ErrorCode.UNSUPPORTED_FORMAT]: "サポートされていないファイル形式です",
  [ErrorCode.INVALID_FORM_DATA]: "送信されたデータが無効です",
  [ErrorCode.FILE_EMPTY]: "ファイルが空です",
  [ErrorCode.INVALID_FILE_TYPE]: "無効なファイル形式です",
  [ErrorCode.INVALID_REQUEST]: "リクエストの形式が正しくありません",

  // システムエラー
  [ErrorCode.UPLOAD_FAILED]: "アップロードに失敗しました",
  [ErrorCode.AI_SERVICE_ERROR]: "AI講評サービスでエラーが発生しました",
  [ErrorCode.STORAGE_ERROR]: "ストレージアクセスでエラーが発生しました",
  [ErrorCode.NETWORK_ERROR]: "ネットワーク接続でエラーが発生しました",
  [ErrorCode.PROCESSING_ERROR]: "処理中にエラーが発生しました",
  [ErrorCode.UNKNOWN_ERROR]: "予期しないエラーが発生しました",

  // 外部サービスエラー
  [ErrorCode.GEMINI_API_ERROR]: "AI分析サービスでエラーが発生しました",
  [ErrorCode.GEMINI_QUOTA_EXCEEDED]:
    "AI分析の利用制限に達しました。しばらく待ってから再度お試しください",
  [ErrorCode.GEMINI_UNAUTHORIZED]: "AI分析サービスの認証に失敗しました",
  [ErrorCode.GEMINI_TIMEOUT]:
    "AI分析がタイムアウトしました。再度お試しください",
  [ErrorCode.REDIS_CONNECTION_ERROR]: "データベース接続でエラーが発生しました",

  // データアクセスエラー
  [ErrorCode.DATA_NOT_FOUND]: "データが見つかりません",
  [ErrorCode.DATA_EXPIRED]: "このデータは期限切れです",
  [ErrorCode.INVALID_ID]: "有効なIDが必要です",
};

// HTTPステータスコードのマッピング
export const ERROR_STATUS_CODES: Record<ErrorCode, number> = {
  // 4xx - クライアントエラー
  [ErrorCode.FILE_NOT_SELECTED]: 400,
  [ErrorCode.FILE_TOO_LARGE]: 413,
  [ErrorCode.UNSUPPORTED_FORMAT]: 415,
  [ErrorCode.INVALID_FORM_DATA]: 400,
  [ErrorCode.FILE_EMPTY]: 400,
  [ErrorCode.INVALID_FILE_TYPE]: 415,
  [ErrorCode.INVALID_REQUEST]: 400,
  [ErrorCode.DATA_NOT_FOUND]: 404,
  [ErrorCode.DATA_EXPIRED]: 410,
  [ErrorCode.INVALID_ID]: 400,
  [ErrorCode.GEMINI_UNAUTHORIZED]: 401,

  // 5xx - サーバーエラー
  [ErrorCode.UPLOAD_FAILED]: 500,
  [ErrorCode.AI_SERVICE_ERROR]: 500,
  [ErrorCode.STORAGE_ERROR]: 500,
  [ErrorCode.NETWORK_ERROR]: 500,
  [ErrorCode.PROCESSING_ERROR]: 500,
  [ErrorCode.UNKNOWN_ERROR]: 500,
  [ErrorCode.GEMINI_API_ERROR]: 500,
  [ErrorCode.GEMINI_QUOTA_EXCEEDED]: 429,
  [ErrorCode.GEMINI_TIMEOUT]: 504,
  [ErrorCode.REDIS_CONNECTION_ERROR]: 500,
};
