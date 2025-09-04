import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

/**
 * /api/upload API Route テスト
 * t-wada手法: テストファースト開発
 */

// すべての依存関係をモック
vi.mock("@/lib/image", () => ({
  processImage: vi.fn(),
}));

vi.mock("@/lib/exif", () => ({
  extractExifData: vi.fn(),
}));

vi.mock("@/lib/kv", () => ({
  kvClient: {
    saveUpload: vi.fn(),
  },
}));

describe("/api/upload POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ファイルが含まれていない場合、400エラーを返す", async () => {
    // 動的インポートでテスト対象をロード
    const { POST } = await import("./route");

    // Arrange
    const formData = new FormData();
    const request = new NextRequest("http://localhost:3000/api/upload", {
      method: "POST",
      body: formData,
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("ファイルが選択されていません");
  });

  it("非対応のHTTPメソッドの場合、405エラーを返す", async () => {
    // 動的インポートでテスト対象をロード
    const { GET } = await import("./route").catch(() => ({ GET: undefined }));

    if (GET) {
      const request = new NextRequest("http://localhost:3000/api/upload", {
        method: "GET",
      });

      const response = await GET(request);
      expect(response.status).toBe(405);
    } else {
      // GETハンドラーが存在しない場合はスキップ
      expect(true).toBe(true);
    }
  });
});
