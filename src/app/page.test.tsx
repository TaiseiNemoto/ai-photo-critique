import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";
import Home from "@/app/page";
import { CritiqueProvider } from "@/contexts/CritiqueContext";

/**
 * メインページ（page.tsx）テスト
 * t-wada手法: カバレッジ向上のためのテスト
 */

// Next.js routerのモック
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => "/"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
};

// Context Provider でラップするヘルパー
const renderWithProvider = (component: React.ReactElement) => {
  vi.mocked(useRouter).mockReturnValue(mockRouter);

  return render(<CritiqueProvider>{component}</CritiqueProvider>);
};

describe("Home Page", () => {
  it("メインページが正しくレンダリングされる", () => {
    // Act
    renderWithProvider(<Home />);

    // Assert
    expect(screen.getByText("Photo-Critique")).toBeInTheDocument();
    expect(
      screen.getByText("あなたの写真を数秒でAI講評"),
    ).toBeInTheDocument();
  });

  it("UploadZoneコンポーネントが表示される", () => {
    // Act
    renderWithProvider(<Home />);

    // Assert
    expect(screen.getByText("ファイルを選択")).toBeInTheDocument();
    expect(screen.getByText("撮影してアップロード")).toBeInTheDocument();
  });

  it("機能説明が表示される", () => {
    // Act
    renderWithProvider(<Home />);

    // Assert
    expect(screen.getByText(/技術・構図・色彩の3つの観点から/)).toBeInTheDocument();
  });

  it("セマンティックなHTML構造を持つ", () => {
    // Act
    renderWithProvider(<Home />);

    // Assert
    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();

    const header = document.querySelector("header");
    expect(header).toBeInTheDocument();
  });

  it("アクセシビリティ属性が適切に設定されている", () => {
    // Act
    renderWithProvider(<Home />);

    // Assert
    const mainHeading = screen.getByRole("heading", { level: 1 });
    expect(mainHeading).toHaveTextContent("Photo-Critique");

    // ファイル入力のアクセシビリティ
    const uploadButton = screen.getByLabelText("画像をアップロード");
    expect(uploadButton).toBeInTheDocument();
  });

});
