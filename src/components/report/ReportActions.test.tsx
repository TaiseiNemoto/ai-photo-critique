import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { expect, test, describe, vi, beforeEach } from "vitest";
import { ReportActions } from "@/components/report/ReportActions";

// Next.jsのLinkコンポーネントをモック
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} data-testid="mock-link">
      {children}
    </a>
  ),
}));

// Sonner toastをモック
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// CritiqueContextをモック
vi.mock("@/contexts/CritiqueContext", () => ({
  useCritique: vi.fn(() => ({
    currentCritique: {
      image: {
        preview: "data:image/jpeg;base64,test",
        original: "data:image/jpeg;base64,test",
        processedSize: { width: 800, height: 600 },
        originalSize: { width: 1600, height: 1200 },
        size: 1024000,
        exif: { camera: "Test Camera" },
      },
      critique: {
        technique: "テスト技術評価",
        composition: "テスト構図評価",
        color: "テスト色彩評価",
      },
      timestamp: Date.now(),
    },
  })),
}));

// Fetch APIをモック
global.fetch = vi.fn();

describe("ReportActions", () => {
  let mockWriteText: ReturnType<typeof vi.fn>;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Clipboard APIをモック
    mockWriteText = vi.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    // window.locationをモック
    Object.defineProperty(window, "location", {
      value: {
        origin: "https://example.com",
      },
      writable: true,
    });

    // Fetch APIをモック
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    // モック関数をリセット
    vi.clearAllMocks();
  });

  describe("正常系", () => {
    test("通常のreportIdでコンポーネントが正しく表示される", () => {
      render(<ReportActions reportId="test-report-123" />);

      // シェアボタンが表示される
      const shareButton = screen.getByText("シェア用リンクをコピー");
      expect(shareButton).toBeInTheDocument();
      expect(shareButton).not.toBeDisabled();
      expect(screen.getByTestId("share-icon")).toBeInTheDocument();

      // 別の写真を試すリンクが表示される
      const newPhotoLink = screen.getByText("別の写真を試す");
      expect(newPhotoLink).toBeInTheDocument();
      expect(screen.getByTestId("mock-link")).toHaveAttribute("href", "/");
    });

    test("シェアボタンクリックでClipboard APIが呼ばれシェアURLがコピーされる", async () => {
      const { toast } = await import("sonner");
      mockWriteText.mockResolvedValue(undefined);

      render(<ReportActions reportId="test-report-123" />);

      const shareButton = screen.getByText("シェア用リンクをコピー");
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(
          "https://example.com/s/test-report-123",
        );
        expect(toast.success).toHaveBeenCalledWith(
          "シェア用リンクをコピーしました",
          {
            description: "SNSやメッセージアプリで共有できます",
            duration: 3000,
          },
        );
      });
    });

    test("Clipboard API失敗時にエラートーストが表示される", async () => {
      const { toast } = await import("sonner");
      const error = new Error("Clipboard API not supported");
      mockWriteText.mockRejectedValue(error);

      render(<ReportActions reportId="test-report-123" />);

      const shareButton = screen.getByText("シェア用リンクをコピー");
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("シェアに失敗しました", {
          description: "Clipboard API not supported",
          duration: 5000,
        });
      });
    });

    test("APIコール失敗時にエラートーストが表示される", async () => {
      const { toast } = await import("sonner");
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      render(<ReportActions reportId="current" />);

      const shareButton = screen.getByText("シェア用リンクをコピー");
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("シェアに失敗しました", {
          description: "シェアデータの保存に失敗しました",
          duration: 5000,
        });
      });
    });
  });

  describe("境界値テスト", () => {
    test("reportIdが'current'の場合でもシェアボタンが有効になる", () => {
      render(<ReportActions reportId="current" />);

      const shareButton = screen.getByRole("button", {
        name: /シェア用リンクをコピー/,
      });
      expect(shareButton).not.toBeDisabled();
    });

    test("reportIdが'current'でシェアボタンクリック時にAPIコールが実行される", async () => {
      const { toast } = await import("sonner");
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            shareId: "generated-share-id",
            url: "/s/generated-share-id",
          }),
      });
      mockWriteText.mockResolvedValue(undefined);

      render(<ReportActions reportId="current" />);

      const shareButton = screen.getByText("シェア用リンクをコピー");
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/share", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: {
              preview: "data:image/jpeg;base64,test",
              original: "data:image/jpeg;base64,test",
              processedSize: { width: 800, height: 600 },
              originalSize: { width: 1600, height: 1200 },
              size: 1024000,
              exif: { camera: "Test Camera" },
            },
            critique: {
              technique: "テスト技術評価",
              composition: "テスト構図評価",
              color: "テスト色彩評価",
            },
          }),
        });
        expect(mockWriteText).toHaveBeenCalledWith(
          "https://example.com/s/generated-share-id",
        );
        expect(toast.success).toHaveBeenCalledWith(
          "シェア用リンクをコピーしました",
          {
            description: "SNSやメッセージアプリで共有できます",
            duration: 3000,
          },
        );
      });
    });

    test("reportIdが空文字列の場合も正常に動作する", async () => {
      const { toast } = await import("sonner");
      mockWriteText.mockResolvedValue(undefined);

      render(<ReportActions reportId="" />);

      const shareButton = screen.getByText("シェア用リンクをコピー");
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith("https://example.com/s/");
        expect(toast.success).toHaveBeenCalled();
      });
    });
  });

  describe("異常系", () => {
    test("navigator.clipboardが存在しない環境でエラーハンドリングされる", async () => {
      const { toast } = await import("sonner");

      // Clipboard APIを削除
      Object.assign(navigator, {
        clipboard: undefined,
      });

      render(<ReportActions reportId="test-report-123" />);

      const shareButton = screen.getByText("シェア用リンクをコピー");
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("シェアに失敗しました", {
          description:
            "Cannot read properties of undefined (reading 'writeText')",
          duration: 5000,
        });
      });
    });

    test("長いreportIdでも正しくURLが生成される", async () => {
      mockWriteText.mockResolvedValue(undefined);
      const longReportId = "a".repeat(100);

      render(<ReportActions reportId={longReportId} />);

      const shareButton = screen.getByText("シェア用リンクをコピー");
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(
          `https://example.com/s/${longReportId}`,
        );
      });
    });
  });
});
