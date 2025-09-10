import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadImageCore } from "./upload";
import * as imageModule from "./image";
import { kvClient } from "./kv";

// 依存モジュールのモック化（サーバーサイドEXIF処理は削除済み）
vi.mock("./image");
vi.mock("./kv");

// Fileモック作成ヘルパー
function createMockFile(
  name: string,
  type: string,
  content: string = "mock file content",
): File {
  const file = new File([content], name, { type });
  file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(content.length));
  return file;
}

describe("uploadImageCore", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // デフォルトモック設定（サーバーサイドEXIF処理は削除済み）
    vi.mocked(kvClient.saveUpload).mockResolvedValue(undefined);
    vi.mocked(imageModule.processImage).mockResolvedValue({
      processedFile: createMockFile("processed.jpg", "image/jpeg"),
      originalSize: { width: 4000, height: 3000 },
      processedSize: { width: 1024, height: 768 },
    });
  });

  describe("EXIF重複処理の排除", () => {
    it("クライアントサイドEXIFデータがある場合、サーバーサイド抽出をスキップする", async () => {
      // Arrange
      const mockFile = createMockFile("test.jpg", "image/jpeg");
      const mockExifData = { camera: "Test Camera", iso: 100 };

      const formData = new FormData();
      formData.append("image", mockFile);
      formData.append("exifData", JSON.stringify(mockExifData));

      // Act
      const result = await uploadImageCore(formData);

      // Debug: 結果を確認
      console.log("Test result:", result);
      if (!result.success) {
        console.log("Error:", result.error);
      }

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.exifData).toEqual(mockExifData);

      // 重要: サーバーサイドEXIF抽出は完全削除済み
    });

    it("EXIFデータが欠損している場合、空オブジェクトを使用する", async () => {
      // Arrange
      const mockFile = createMockFile("test.jpg", "image/jpeg");
      const formData = new FormData();
      formData.append("image", mockFile);
      // exifDataなし

      // Act
      const result = await uploadImageCore(formData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.exifData).toEqual({}); // 空オブジェクト許容

      // サーバーサイドEXIF抽出は完全削除済み
    });

    it("無効なEXIF JSONの場合、空オブジェクトを使用する", async () => {
      // Arrange
      const mockFile = createMockFile("test.jpg", "image/jpeg");
      const formData = new FormData();
      formData.append("image", mockFile);
      formData.append("exifData", "invalid-json");

      // Act
      const result = await uploadImageCore(formData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.exifData).toEqual({}); // フォールバック: 空オブジェクト

      // サーバーサイドEXIF抽出は完全削除済み
    });
  });

  describe("既存機能の確認", () => {
    it("ファイルが選択されていない場合、エラーを返す", async () => {
      // Arrange
      const formData = new FormData();
      // ファイルなし

      // Act
      const result = await uploadImageCore(formData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("ファイルが選択されていません");
    });

    it("画像処理とKV保存が正常に実行される", async () => {
      // Arrange
      const mockFile = createMockFile("test.jpg", "image/jpeg");
      const mockExifData = { camera: "Test Camera" };

      const formData = new FormData();
      formData.append("image", mockFile);
      formData.append("exifData", JSON.stringify(mockExifData));

      // Act
      const result = await uploadImageCore(formData);

      // Assert
      expect(result.success).toBe(true);
      expect(imageModule.processImage).toHaveBeenCalledWith(mockFile);
      expect(kvClient.saveUpload).toHaveBeenCalled();
    });
  });
});
