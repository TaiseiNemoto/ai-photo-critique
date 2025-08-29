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
    expect(screen.getByText("AI Photo Critique")).toBeInTheDocument();
    expect(
      screen.getByText("AIが写真を分析し、建設的な講評をお届けします"),
    ).toBeInTheDocument();
  });

  it("UploadZoneコンポーネントが表示される", () => {
    // Act
    renderWithProvider(<Home />);

    // Assert
    expect(screen.getByText("写真をドラッグ&ドロップ")).toBeInTheDocument();
    expect(screen.getByText("ファイルを選択")).toBeInTheDocument();
  });

  it("機能カードが表示される", () => {
    // Act
    renderWithProvider(<Home />);

    // Assert
    expect(screen.getByText("瞬時の分析")).toBeInTheDocument();
    expect(screen.getByText("3軸評価")).toBeInTheDocument();
    expect(screen.getByText("簡単共有")).toBeInTheDocument();
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
    expect(mainHeading).toHaveTextContent("AI Photo Critique");

    // ファイル入力のアクセシビリティ
    const fileInput = screen.getByLabelText(/写真を選択/);
    expect(fileInput).toBeInTheDocument();
  });

  it("レスポンシブデザインのクラスが適用されている", () => {
    // Act
    renderWithProvider(<Home />);

    // Assert
    const container = screen.getByRole("main");
    expect(container).toHaveClass("min-h-screen");

    // グリッドレイアウトのクラスを確認
    const featureSection = container.querySelector(".grid");
    expect(featureSection).toBeInTheDocument();
  });
});
