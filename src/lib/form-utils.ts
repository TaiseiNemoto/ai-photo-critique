/**
 * FormDataからの型安全な値抽出ユーティリティ
 */

// 成功・失敗を表すResult型
export type FormDataResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * FormDataからファイルを型安全に抽出する
 */
export function extractFileFromFormData(
  formData: FormData,
  fieldName: string
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
 * FormDataから文字列を型安全に抽出する
 */
export function extractStringFromFormData(
  formData: FormData,
  fieldName: string,
  options?: { optional?: boolean }
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