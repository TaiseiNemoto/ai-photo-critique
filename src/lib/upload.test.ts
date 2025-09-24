import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadImageCore } from "./upload";
import * as imageModule from "./image";
// import { kvClient } from "./kv"; // 重複保存解消のため削除

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
    // 注意: saveUploadは重複保存解消のため削除
    // vi.mocked(kvClient.saveUpload).mockResolvedValue(undefined);
    vi.mocked(imageModule.processImage).mockResolvedValue({
      processedFile: createMockFile("processed.jpg", "image/jpeg"),
      originalSize: { width: 4000, height: 3000 },
      processedSize: { width: 1024, height: 768 },
    });
  });

  // EXIF処理の詳細テストは src/lib/exif.test.ts に移動済み
  // Server Action統合テストは src/app/actions.test.ts で実行

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

    it("画像処理が正常に実行される（KV保存は削除済み）", async () => {
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

      // 重要: saveUploadは重複保存解消のため削除済み
      // expect(kvClient.saveUpload).toHaveBeenCalled(); // 削除
      expect(result.data?.id).toBeDefined();
      expect(result.data?.processedImage).toBeDefined();
    });
  });
});
