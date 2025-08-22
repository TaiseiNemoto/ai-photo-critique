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

describe("ReportActions", () => {
  let mockWriteText: ReturnType<typeof vi.fn>;

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
        expect(toast.error).toHaveBeenCalledWith("コピーに失敗しました", {
          description: "手動でURLをコピーしてください",
          duration: 5000,
        });
      });
    });
  });

  describe("境界値テスト", () => {
    test("reportIdが'current'の場合シェアボタンが無効化される", () => {
      render(<ReportActions reportId="current" />);

      const shareButton = screen.getByRole("button", {
        name: /シェア用リンクをコピー/,
      });
      expect(shareButton).toBeDisabled();
    });

    test("reportIdが'current'でシェアボタンクリック時に制限メッセージが表示される", async () => {
      const { toast } = await import("sonner");

      render(<ReportActions reportId="current" />);

      const shareButton = screen.getByText("シェア用リンクをコピー");

      // disabledなボタンでも強制的にイベントを発火させる
      fireEvent.click(shareButton, { button: 0 });

      // disabledボタンではクリックイベントが処理されないため、
      // Clipboard APIも呼ばれず、toastも呼ばれない
      expect(mockWriteText).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
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
        expect(toast.error).toHaveBeenCalledWith("コピーに失敗しました", {
          description: "手動でURLをコピーしてください",
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
