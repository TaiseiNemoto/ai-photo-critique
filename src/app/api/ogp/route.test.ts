import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// KVクライアントのモック
vi.mock("@/lib/kv", () => ({
  kvClient: {
    getCritique: vi.fn(),
  },
}));

describe("/api/ogp", () => {
  let mockGetCritique: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    // 動的インポートでモックされたクライアントを取得
    const { kvClient } = await import("@/lib/kv");
    mockGetCritique = vi.mocked(kvClient.getCritique);
  });

  describe("正常系", () => {
    it("有効なIDでOGP画像を生成できる", async () => {
      const { GET } = await import("./route");
      const request = new NextRequest(
        "http://localhost:3000/api/ogp?id=test-id",
        {
          method: "GET",
        },
      );

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("image/svg+xml");
      expect(response.headers.get("cache-control")).toBe(
        "public, max-age=3600",
      );

      const svg = await response.text();
      expect(svg).toContain("写真講評レポート");
      expect(svg).toContain("AI Photo Critique");
    });

    it("講評データがある場合、その内容を含むOGP画像を生成する", async () => {
      mockGetCritique.mockResolvedValue({
        id: "test-id",
        filename: "test.jpg",
        technique: "素晴らしい構図です",
        composition: "バランスが良いです",
        color: "色彩が美しいです",
        exifData: {},
        uploadedAt: new Date().toISOString(),
      });

      const { GET } = await import("./route");
      const request = new NextRequest(
        "http://localhost:3000/api/ogp?id=test-id",
        {
          method: "GET",
        },
      );

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("image/svg+xml");
      expect(mockGetCritique).toHaveBeenCalledWith("test-id");

      const svg = await response.text();
      expect(svg).toContain("test.jpg");
      expect(svg).toContain("AI Photo Critique");
    });

    it("詳細講評表示モードで講評内容を可視化する", async () => {
      mockGetCritique.mockResolvedValue({
        id: "test-id",
        filename: "portrait.jpg",
        technique: "シャープネスが素晴らしく、被写体の表情が生き生きとしている",
        composition: "三分割法が効果的に使われ、バランスの取れた構図",
        color: "暖色系の色調が温かみを演出し、肌色が自然",
        exifData: {},
        uploadedAt: new Date().toISOString(),
      });

      const { GET } = await import("./route");
      const request = new NextRequest(
        "http://localhost:3000/api/ogp?id=test-id&detail=true",
        {
          method: "GET",
        },
      );

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("image/svg+xml");
      expect(mockGetCritique).toHaveBeenCalledWith("test-id");

      const svg = await response.text();
      expect(svg).toContain("portrait.jpg");
      expect(svg).toContain("📊 技術");
      expect(svg).toContain("🎯 構図");
      expect(svg).toContain("🎨 色彩");
      expect(svg).toContain("シャープネスが素晴らしく");
    });

    it("長いテキストが適切に切り捨てられる", async () => {
      const veryLongText =
        "この講評は非常に長いテキストで、通常のOGP画像の制限を超える長さになっています。テキストが長すぎる場合は適切に切り捨てられて三点リーダーが追加されることを確認します。";

      mockGetCritique.mockResolvedValue({
        id: "test-id",
        filename: "very-long-filename-that-exceeds-normal-length.jpg",
        technique: veryLongText,
        composition: veryLongText,
        color: veryLongText,
        exifData: {},
        uploadedAt: new Date().toISOString(),
      });

      const { GET } = await import("./route");
      const request = new NextRequest(
        "http://localhost:3000/api/ogp?id=test-id&detail=true",
        {
          method: "GET",
        },
      );

      const response = await GET(request);

      expect(response.status).toBe(200);
      const svg = await response.text();
      expect(svg).toContain("...");
      expect(svg).not.toContain(veryLongText); // 完全なテキストは含まれない
    });

    it("日本語フォント指定が適用される", async () => {
      const { GET } = await import("./route");
      const request = new NextRequest(
        "http://localhost:3000/api/ogp?id=test-id",
        {
          method: "GET",
        },
      );

      const response = await GET(request);

      expect(response.status).toBe(200);
      const svg = await response.text();
      expect(svg).toContain("Hiragino Sans");
      expect(svg).toContain('font-weight="bold"');
      expect(svg).toContain("AI Photo Critique");
    });

    it("デフォルトOGP画像を生成できる（IDなし）", async () => {
      const { GET } = await import("./route");
      const request = new NextRequest("http://localhost:3000/api/ogp", {
        method: "GET",
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("image/svg+xml");

      const svg = await response.text();
      expect(svg).toContain("AI による写真講評サービス");
      expect(svg).toContain("AI Photo Critique");
    });
  });

  describe("異常系", () => {
    it("存在しないIDの場合はデフォルト画像を生成する", async () => {
      mockGetCritique.mockResolvedValue(null);

      const { GET } = await import("./route");
      const request = new NextRequest(
        "http://localhost:3000/api/ogp?id=non-existent",
        {
          method: "GET",
        },
      );

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("image/svg+xml");
      expect(mockGetCritique).toHaveBeenCalledWith("non-existent");
    });

    it("無効なIDフォーマットの場合はデフォルト画像を生成する", async () => {
      const { GET } = await import("./route");
      const request = new NextRequest("http://localhost:3000/api/ogp?id=", {
        method: "GET",
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("image/svg+xml");
      expect(mockGetCritique).not.toHaveBeenCalled();
    });

    it("KVアクセスエラーの場合はデフォルト画像を生成する", async () => {
      mockGetCritique.mockRejectedValue(new Error("KV access error"));

      const { GET } = await import("./route");
      const request = new NextRequest(
        "http://localhost:3000/api/ogp?id=test-id",
        {
          method: "GET",
        },
      );

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("image/svg+xml");
    });
  });
});
