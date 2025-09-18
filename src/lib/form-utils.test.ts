import { describe, it, expect } from "vitest";
import {
  extractFileFromFormData,
  extractStringFromFormData,
  extractFileFromFormDataV2,
  extractStringFromFormDataV2,
} from "./form-utils";
import { ErrorCode } from "./error-codes";

describe("form-utils", () => {
  describe("extractFileFromFormData", () => {
    it("should extract valid File object", () => {
      const formData = new FormData();
      const file = new File(["test content"], "test.jpg", {
        type: "image/jpeg",
      });
      formData.append("image", file);

      const result = extractFileFromFormData(formData, "image");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeInstanceOf(File);
        expect(result.data.name).toBe("test.jpg");
      }
    });

    it("should return error when field is missing", () => {
      const formData = new FormData();

      const result = extractFileFromFormData(formData, "image");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("必須フィールド 'image' が見つかりません");
      }
    });

    it("should return error when field is not a File", () => {
      const formData = new FormData();
      formData.append("image", "not a file");

      const result = extractFileFromFormData(formData, "image");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(
          "フィールド 'image' はファイルである必要があります",
        );
      }
    });

    it("should return error when file is empty", () => {
      const formData = new FormData();
      const emptyFile = new File([], "empty.jpg", { type: "image/jpeg" });
      formData.append("image", emptyFile);

      const result = extractFileFromFormData(formData, "image");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("ファイルが空です");
      }
    });
  });

  describe("extractStringFromFormData", () => {
    it("should extract valid string", () => {
      const formData = new FormData();
      formData.append("exifData", '{"camera": "Canon"}');

      const result = extractStringFromFormData(formData, "exifData");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('{"camera": "Canon"}');
      }
    });

    it("should return success with empty string when field is missing and optional", () => {
      const formData = new FormData();

      const result = extractStringFromFormData(formData, "exifData", {
        optional: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("");
      }
    });

    it("should return error when required field is missing", () => {
      const formData = new FormData();

      const result = extractStringFromFormData(formData, "exifData");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("必須フィールド 'exifData' が見つかりません");
      }
    });

    it("should return error when field is not a string", () => {
      const formData = new FormData();
      const file = new File(["test"], "test.txt");
      formData.append("exifData", file);

      const result = extractStringFromFormData(formData, "exifData");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(
          "フィールド 'exifData' は文字列である必要があります",
        );
      }
    });
  });

  describe("extractFileFromFormDataV2 (新しいAppError対応版)", () => {
    it("should extract valid File object", () => {
      const formData = new FormData();
      const file = new File(["test content"], "test.jpg", {
        type: "image/jpeg",
      });
      formData.append("image", file);

      const result = extractFileFromFormDataV2(formData, "image");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeInstanceOf(File);
        expect(result.data.name).toBe("test.jpg");
      }
    });

    it("should return AppError when field is missing", () => {
      const formData = new FormData();

      const result = extractFileFromFormDataV2(formData, "image");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ErrorCode.FILE_NOT_SELECTED);
        expect(result.error.message).toBe("ファイルが選択されていません");
      }
    });

    it("should return AppError when field is not a File", () => {
      const formData = new FormData();
      formData.append("image", "not a file");

      const result = extractFileFromFormDataV2(formData, "image");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ErrorCode.INVALID_FILE_TYPE);
        expect(result.error.details).toContain("フィールド 'image' はファイルである必要があります");
      }
    });

    it("should return AppError when file is empty", () => {
      const formData = new FormData();
      const emptyFile = new File([], "empty.jpg", { type: "image/jpeg" });
      formData.append("image", emptyFile);

      const result = extractFileFromFormDataV2(formData, "image");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ErrorCode.FILE_EMPTY);
        expect(result.error.message).toBe("ファイルが空です");
      }
    });
  });

  describe("extractStringFromFormDataV2 (新しいAppError対応版)", () => {
    it("should extract valid string value", () => {
      const formData = new FormData();
      formData.append("text", "test value");

      const result = extractStringFromFormDataV2(formData, "text");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("test value");
      }
    });

    it("should return AppError when required field is missing", () => {
      const formData = new FormData();

      const result = extractStringFromFormDataV2(formData, "text");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ErrorCode.INVALID_FORM_DATA);
        expect(result.error.details).toContain("必須フィールド 'text' が見つかりません");
      }
    });

    it("should return empty string when optional field is missing", () => {
      const formData = new FormData();

      const result = extractStringFromFormDataV2(formData, "text", { optional: true });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("");
      }
    });

    it("should return AppError when field is not a string", () => {
      const formData = new FormData();
      const file = new File(["content"], "test.txt");
      formData.append("text", file);

      const result = extractStringFromFormDataV2(formData, "text");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ErrorCode.INVALID_FORM_DATA);
        expect(result.error.details).toContain("フィールド 'text' は文字列である必要があります");
      }
    });
  });
});
