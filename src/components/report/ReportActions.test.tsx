import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ReportActions } from "@/components/report/ReportActions";

// モックの設定
const mockWriteText = vi.fn();
const mockFetch = vi.fn();

vi.stubGlobal("fetch", mockFetch);

Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

// Sonnerトーストライブラリをモック
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// CritiqueContextをモック
vi.mock("@/contexts/CritiqueContext", () => ({
  useCritique: () => ({
    currentCritique: {
      image: { url: "test-image-url" },
      critique: {
        technique: "test technique",
        composition: "test composition",
        color: "test color",
      },
    },
  }),
}));

describe("ReportActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteText.mockResolvedValue(undefined);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        shareUrl: "https://example.com/s/abc123",
      }),
    });
  });

  describe("正常系", () => {
    test("コンポーネントが正しくレンダリングされる", () => {
      render(<ReportActions reportId="test-report-123" />);

      expect(screen.getByText("シェア用リンクをコピー")).toBeInTheDocument();
    });

    test("シェアボタンクリック時にクリップボードにURLがコピーされる", async () => {
      render(<ReportActions reportId="test-report-123" />);

      const shareButton = screen.getByText("シェア用リンクをコピー");
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(
          "http://localhost:3000/s/test-report-123",
        );
      });
    });

    test("成功時にトーストが表示される", async () => {
      const { toast } = await import("sonner");

      render(<ReportActions reportId="test-report-123" />);

      const shareButton = screen.getByText("シェア用リンクをコピー");
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "シェア用リンクをコピーしました",
          {
            description: "SNSやメッセージアプリで共有できます",
            duration: 3000,
          },
        );
      });
    });
  });

  describe("境界値テスト", () => {
    test("reportIdが'current'の場合でもシェアボタンが有効になる", () => {
      render(<ReportActions reportId="current" />);

      const shareButton = screen.getByRole("button", {
        name: /シェア用リンクをコピー/,
      });
      expect(shareButton).toBeEnabled();
    });

    test("reportIdが長い文字列の場合でも正常に動作する", async () => {
      const longReportId = "a".repeat(100);
      render(<ReportActions reportId={longReportId} />);

      const shareButton = screen.getByText("シェア用リンクをコピー");
      fireEvent.click(shareButton);

      // current以外の場合は直接URLをコピーするため、fetchは呼ばれない
      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(
          expect.stringContaining(`/s/${longReportId}`),
        );
      });
    });
  });
});
