import { describe, it, expect } from "vitest";
import {
  extractAndValidateImageFile,
  extractAndValidateFile,
} from "./validation";

// テスト用のモックファイル作成関数
function createMockFile(options: {
  name?: string;
  type?: string;
  size?: number;
  content?: string;
}): File {
  const {
    name = "test.jpg",
    type = "image/jpeg",
    size = 1024,
    content = "mock file content",
  } = options;

  const file = new File([content], name, { type });
  // サイズを手動で設定
  Object.defineProperty(file, "size", {
    value: size,
    writable: false,
  });
  return file;
}

// テスト用のFormData作成関数
function createFormDataWithFile(file: File): FormData {
  const formData = new FormData();
  formData.append("image", file);
  return formData;
}

describe("extractAndValidateImageFile", () => {
  describe("正常系", () => {
    it("有効なJPEGファイルを正しく処理する", () => {
      const file = createMockFile({
        name: "test.jpg",
        type: "image/jpeg",
        size: 1024,
      });
      const formData = createFormDataWithFile(file);

      const result = extractAndValidateImageFile(formData);

      expect(result.success).toBe(true);
      expect(result.file).toBe(file);
      expect(result.error).toBeUndefined();
    });

    it("有効なPNGファイルを正しく処理する", () => {
      const file = createMockFile({
        name: "test.png",
        type: "image/png",
        size: 2048,
      });
      const formData = createFormDataWithFile(file);

      const result = extractAndValidateImageFile(formData);

      expect(result.success).toBe(true);
      expect(result.file).toBe(file);
      expect(result.error).toBeUndefined();
    });

    it("有効なWebPファイルを正しく処理する", () => {
      const file = createMockFile({
        name: "test.webp",
        type: "image/webp",
        size: 512,
      });
      const formData = createFormDataWithFile(file);

      const result = extractAndValidateImageFile(formData);

      expect(result.success).toBe(true);
      expect(result.file).toBe(file);
      expect(result.error).toBeUndefined();
    });
  });

  describe("境界値テスト", () => {
    it("最大ファイルサイズ（10MB）ちょうどのファイルを処理できる", () => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const file = createMockFile({
        name: "large.jpg",
        type: "image/jpeg",
        size: maxSize,
      });
      const formData = createFormDataWithFile(file);

      const result = extractAndValidateImageFile(formData);

      expect(result.success).toBe(true);
      expect(result.file).toBe(file);
    });

    it("最小ファイルサイズ（1バイト）のファイルを処理できる", () => {
      const file = createMockFile({
        name: "tiny.jpg",
        type: "image/jpeg",
        size: 1,
      });
      const formData = createFormDataWithFile(file);

      const result = extractAndValidateImageFile(formData);

      expect(result.success).toBe(true);
      expect(result.file).toBe(file);
    });
  });

  describe("異常系", () => {
    it("ファイルが存在しない場合はエラーを返す", () => {
      const formData = new FormData();

      const result = extractAndValidateImageFile(formData);

      expect(result.success).toBe(false);
      expect(result.file).toBeUndefined();
      expect(result.error).toBe("画像ファイルが見つかりません");
    });

    it("ファイルサイズが制限を超える場合はエラーを返す", () => {
      const oversizeFile = createMockFile({
        name: "huge.jpg",
        type: "image/jpeg",
        size: 10 * 1024 * 1024 + 1, // 10MB + 1バイト
      });
      const formData = createFormDataWithFile(oversizeFile);

      const result = extractAndValidateImageFile(formData);

      expect(result.success).toBe(false);
      expect(result.file).toBeUndefined();
      expect(result.error).toBe("ファイルサイズが大きすぎます（最大10MB）");
    });

    it("サポートされていないファイル形式の場合はエラーを返す", () => {
      const unsupportedFile = createMockFile({
        name: "test.gif",
        type: "image/gif",
        size: 1024,
      });
      const formData = createFormDataWithFile(unsupportedFile);

      const result = extractAndValidateImageFile(formData);

      expect(result.success).toBe(false);
      expect(result.file).toBeUndefined();
      expect(result.error).toBe("サポートされていないファイル形式です");
    });

    it("textファイルの場合はエラーを返す", () => {
      const textFile = createMockFile({
        name: "test.txt",
        type: "text/plain",
        size: 1024,
      });
      const formData = createFormDataWithFile(textFile);

      const result = extractAndValidateImageFile(formData);

      expect(result.success).toBe(false);
      expect(result.file).toBeUndefined();
      expect(result.error).toBe("サポートされていないファイル形式です");
    });
  });
});

describe("extractAndValidateFile (後方互換性)", () => {
  describe("正常系", () => {
    it("有効なファイルの場合はFileオブジェクトを返す", () => {
      const file = createMockFile({
        name: "test.jpg",
        type: "image/jpeg",
        size: 1024,
      });
      const formData = createFormDataWithFile(file);

      const result = extractAndValidateFile(formData);

      expect(result).toBe(file);
    });
  });

  describe("異常系", () => {
    it("ファイルが存在しない場合はnullを返す", () => {
      const formData = new FormData();

      const result = extractAndValidateFile(formData);

      expect(result).toBeNull();
    });

    it("ファイルサイズが制限を超える場合は例外を投げる", () => {
      const oversizeFile = createMockFile({
        name: "huge.jpg",
        type: "image/jpeg",
        size: 10 * 1024 * 1024 + 1,
      });
      const formData = createFormDataWithFile(oversizeFile);

      expect(() => {
        extractAndValidateFile(formData);
      }).toThrow("ファイルサイズが大きすぎます（最大10MB）");
    });

    it("サポートされていないファイル形式の場合は例外を投げる", () => {
      const unsupportedFile = createMockFile({
        name: "test.gif",
        type: "image/gif",
        size: 1024,
      });
      const formData = createFormDataWithFile(unsupportedFile);

      expect(() => {
        extractAndValidateFile(formData);
      }).toThrow("サポートされていないファイル形式です");
    });
  });
});
