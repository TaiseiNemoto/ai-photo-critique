import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import SharePage, { generateMetadata } from "@/app/s/[id]/page";

// fetchをモック
global.fetch = vi.fn();

// モックデータ
const mockCritiqueData = {
  id: "test-id",
  image: "/test-image.jpg",
  technical: "テクニカル講評内容",
  composition: "構図講評内容",
  color: "色彩講評内容",
  exif: {
    camera: "Canon EOS R5",
    lens: "Canon RF 24-70mm F2.8L IS USM",
    fNumber: "f/2.8",
    exposureTime: "1/250s",
    iso: "200",
    focalLength: "50mm",
  },
};

const mockSharePageProps = {
  params: Promise.resolve({ id: "test-id" }),
};

describe("SharePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.VERCEL_URL = "";
  });

  describe("正常系テスト", () => {
    it("正常なデータがある場合、共有ページが正しく表示される", async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: mockCritiqueData,
        }),
      };
      (fetch as any).mockResolvedValue(mockResponse);

      // Act
      const result = await SharePage(mockSharePageProps);

      // Assert
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/data/test-id",
        { cache: "no-store" },
      );

      // ReactElementのrender結果をテスト
      render(result);

      await waitFor(() => {
        expect(screen.getByAltText("分析対象の写真")).toBeInTheDocument();
      });
    });

    it("VERCEL_URLが設定されている場合、正しいURLを使用する", async () => {
      // Arrange
      process.env.VERCEL_URL = "example-app.vercel.app";
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: mockCritiqueData,
        }),
      };
      (fetch as any).mockResolvedValue(mockResponse);

      // Act
      await SharePage(mockSharePageProps);

      // Assert
      expect(fetch).toHaveBeenCalledWith(
        "https://example-app.vercel.app/api/data/test-id",
        { cache: "no-store" },
      );
    });
  });

  describe("異常系テスト", () => {
    it("データが見つからない場合(404)、適切なエラーページが表示される", async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 404,
      };
      (fetch as any).mockResolvedValue(mockResponse);

      // Act
      const result = await SharePage(mockSharePageProps);
      render(result);

      // Assert
      await waitFor(() => {
        expect(screen.getByText("データが見つかりません")).toBeInTheDocument();
        expect(
          screen.getByText("指定された共有データが見つかりませんでした"),
        ).toBeInTheDocument();
      });
    });

    it("データが期限切れの場合(410)、適切なエラーメッセージが表示される", async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 410,
      };
      (fetch as any).mockResolvedValue(mockResponse);

      // Act
      const result = await SharePage(mockSharePageProps);
      render(result);

      // Assert
      await waitFor(() => {
        expect(screen.getByText("データが見つかりません")).toBeInTheDocument();
        expect(
          screen.getByText("このデータは期限切れです"),
        ).toBeInTheDocument();
      });
    });

    it("fetchでエラーが発生した場合、適切なエラーページが表示される", async () => {
      // Arrange
      (fetch as any).mockRejectedValue(new Error("Network error"));

      // Act
      const result = await SharePage(mockSharePageProps);
      render(result);

      // Assert
      await waitFor(() => {
        expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
        expect(
          screen.getByText(
            "データの取得中にエラーが発生しました。時間をおいて再度お試しください。",
          ),
        ).toBeInTheDocument();
      });
    });

    it("無効なデータ形式の場合、エラーページが表示される", async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: null, // 無効なデータ
        }),
      };
      (fetch as any).mockResolvedValue(mockResponse);

      // Act
      const result = await SharePage(mockSharePageProps);
      render(result);

      // Assert
      await waitFor(() => {
        expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
      });
    });
  });
});

describe("generateMetadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.VERCEL_URL = "";
  });

  describe("正常系テスト", () => {
    it("正常なデータがある場合、動的メタデータが生成される", async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: mockCritiqueData,
        }),
      };
      (fetch as any).mockResolvedValue(mockResponse);

      // Act
      const metadata = await generateMetadata(mockSharePageProps);

      // Assert
      expect(metadata.title).toBe(
        "Canon EOS R5で撮影した写真のAI講評結果 - Photo-Critique",
      );
      expect(metadata.description).toBe(
        "Canon EOS R5、Canon RF 24-70mm F2.8L IS USMで撮影された写真を技術・構図・色彩の3つの観点からAIが分析しました。",
      );
      expect(metadata.openGraph?.images).toEqual([
        {
          url: "/api/ogp?id=test-id",
          width: 1200,
          height: 630,
          alt: "Canon EOS R5で撮影した写真のAI講評結果",
        },
        {
          url: "/api/ogp?id=test-id&detail=true",
          width: 1200,
          height: 630,
          alt: "Canon EOS R5で撮影した写真の詳細AI講評結果",
        },
      ]);
      expect(metadata.twitter?.images).toEqual(["/api/ogp?id=test-id"]);
    });

    it("EXIF情報が部分的な場合、適切にフォールバックされる", async () => {
      // Arrange
      const partialCritiqueData = {
        ...mockCritiqueData,
        exif: {
          camera: "Sony A7R IV",
          // lens情報なし
        },
      };
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: partialCritiqueData,
        }),
      };
      (fetch as any).mockResolvedValue(mockResponse);

      // Act
      const metadata = await generateMetadata(mockSharePageProps);

      // Assert
      expect(metadata.title).toBe(
        "Sony A7R IVで撮影した写真のAI講評結果 - Photo-Critique",
      );
      expect(metadata.description).toBe(
        "Sony A7R IV、レンズで撮影された写真を技術・構図・色彩の3つの観点からAIが分析しました。",
      );
    });
  });

  describe("異常系テスト", () => {
    it("データが取得できない場合、デフォルトメタデータが返される", async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 404,
      };
      (fetch as any).mockResolvedValue(mockResponse);

      // Act
      const metadata = await generateMetadata(mockSharePageProps);

      // Assert
      expect(metadata.title).toBe("AI写真講評結果 - Photo-Critique");
      expect(metadata.description).toBe(
        "技術・構図・色彩の3つの観点からAIが分析した写真講評結果をご覧ください。",
      );
    });

    it("fetchでエラーが発生した場合、デフォルトメタデータが返される", async () => {
      // Arrange
      (fetch as any).mockRejectedValue(new Error("Network error"));

      // Act
      const metadata = await generateMetadata(mockSharePageProps);

      // Assert
      expect(metadata.title).toBe("AI写真講評結果 - Photo-Critique");
      expect(metadata.description).toBe(
        "技術・構図・色彩の3つの観点からAIが分析した写真講評結果をご覧ください。",
      );
    });

    it("無効なデータ形式の場合、デフォルトメタデータが返される", async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: null,
        }),
      };
      (fetch as any).mockResolvedValue(mockResponse);

      // Act
      const metadata = await generateMetadata(mockSharePageProps);

      // Assert
      expect(metadata.title).toBe("AI写真講評結果 - Photo-Critique");
      expect(metadata.description).toBe(
        "技術・構図・色彩の3つの観点からAIが分析した写真講評結果をご覧ください。",
      );
    });
  });
});
