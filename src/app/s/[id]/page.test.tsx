import { describe, it, expect, beforeEach, vi } from "vitest";
import { render } from "@testing-library/react";
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
      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResponse,
      );

      // Act
      const result = await SharePage(mockSharePageProps);

      // Assert
      const { container } = render(result);
      expect(container).toBeTruthy();
    });
  });

  describe("generateMetadata", () => {
    describe("正常系テスト", () => {
      it("正常なデータがある場合、適切なメタデータが生成される", async () => {
        // Arrange
        const mockResponse = {
          ok: true,
          json: vi.fn().mockResolvedValue({
            success: true,
            data: mockCritiqueData,
          }),
        };
        (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
          mockResponse,
        );

        // Act
        const metadata = await generateMetadata(mockSharePageProps);

        // Assert
        expect(metadata.title).toBe(
          "Canon EOS R5で撮影した写真のAI講評結果 - Photo-Critique",
        );
        expect(metadata.description).toBeTruthy();
      });
    });
  });
});
