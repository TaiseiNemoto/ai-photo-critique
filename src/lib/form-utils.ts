/**
 * FormDataからの型安全な値抽出ユーティリティ
 */

import type { Result, AppError } from "@/types/error";
import { ErrorCode, ERROR_MESSAGES, ERROR_STATUS_CODES } from "./error-codes";

// 既存互換性のためのレガシー型（段階的に削除予定）
export type FormDataResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// 新しい統一Result型のエイリアス
export type FormResult<T> = Result<T>;

/**
 * AppErrorオブジェクトを作成するヘルパー関数
 */
function createAppError(code: ErrorCode, details?: string): AppError {
  return {
    code,
    message: ERROR_MESSAGES[code],
    details,
    statusCode: ERROR_STATUS_CODES[code],
    timestamp: new Date().toISOString(),
    stack: process.env.NODE_ENV === "development" ? new Error().stack : undefined,
  };
}

/**
 * FormDataからファイルを型安全に抽出する
 */
export function extractFileFromFormData(
  formData: FormData,
  fieldName: string,
): FormDataResult<File> {
  const value = formData.get(fieldName);

  if (value === null) {
    return {
      success: false,
      error: `必須フィールド '${fieldName}' が見つかりません`,
    };
  }

  if (!(value instanceof File)) {
    return {
      success: false,
      error: `フィールド '${fieldName}' はファイルである必要があります`,
    };
  }

  if (value.size === 0) {
    return {
      success: false,
      error: "ファイルが空です",
    };
  }

  return {
    success: true,
    data: value,
  };
}

/**
 * FormDataからファイルを型安全に抽出する（新しいAppError対応版）
 */
export function extractFileFromFormDataV2(
  formData: FormData,
  fieldName: string,
): FormResult<File> {
  const value = formData.get(fieldName);

  if (value === null) {
    return {
      success: false,
      error: createAppError(ErrorCode.FILE_NOT_SELECTED),
    };
  }

  if (!(value instanceof File)) {
    return {
      success: false,
      error: createAppError(ErrorCode.INVALID_FILE_TYPE, `フィールド '${fieldName}' はファイルである必要があります`),
    };
  }

  if (value.size === 0) {
    return {
      success: false,
      error: createAppError(ErrorCode.FILE_EMPTY),
    };
  }

  return {
    success: true,
    data: value,
  };
}

/**
 * FormDataから文字列を型安全に抽出する
 */
export function extractStringFromFormData(
  formData: FormData,
  fieldName: string,
  options?: { optional?: boolean },
): FormDataResult<string> {
  const value = formData.get(fieldName);

  if (value === null) {
    if (options?.optional) {
      return {
        success: true,
        data: "",
      };
    }
    return {
      success: false,
      error: `必須フィールド '${fieldName}' が見つかりません`,
    };
  }

  if (typeof value !== "string") {
    return {
      success: false,
      error: `フィールド '${fieldName}' は文字列である必要があります`,
    };
  }

  return {
    success: true,
    data: value,
  };
}

/**
 * FormDataから文字列を型安全に抽出する（新しいAppError対応版）
 */
export function extractStringFromFormDataV2(
  formData: FormData,
  fieldName: string,
  options?: { optional?: boolean },
): FormResult<string> {
  const value = formData.get(fieldName);

  if (value === null) {
    if (options?.optional) {
      return {
        success: true,
        data: "",
      };
    }
    return {
      success: false,
      error: createAppError(ErrorCode.INVALID_FORM_DATA, `必須フィールド '${fieldName}' が見つかりません`),
    };
  }

  if (typeof value !== "string") {
    return {
      success: false,
      error: createAppError(ErrorCode.INVALID_FORM_DATA, `フィールド '${fieldName}' は文字列である必要があります`),
    };
  }

  return {
    success: true,
    data: value,
  };
}
