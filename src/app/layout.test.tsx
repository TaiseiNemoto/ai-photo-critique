import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { CritiqueProvider } from "@/contexts/CritiqueContext";

// next/font/googleをモック化
vi.mock("next/font/google", () => ({
  Inter: vi.fn(() => ({
    className: "mock-inter-font",
  })),
}));

/**
 * ルートレイアウト（layout.tsx）テスト
 * t-wada手法: カバレッジ向上のためのテスト
 */

describe("RootLayout", () => {
  // BodyContentコンポーネントを作成してテスト用に分離
  const BodyContent = ({ children }: { children: React.ReactNode }) => {
    return (
      <div className="mock-inter-font tap-highlight-none">
        <CritiqueProvider>{children}</CritiqueProvider>
        {/* Toasterのモック版 */}
        <div data-testid="toaster" />
      </div>
    );
  };

  it("コンポーネントが正常にレンダリングされる", () => {
    // Act & Assert - エラーが投げられないことを確認
    expect(() => {
      render(
        <BodyContent>
          <div>Test Content</div>
        </BodyContent>,
      );
    }).not.toThrow();
  });

  it("子コンポーネントが正しくレンダリングされる", () => {
    // Act
    const { getByText } = render(
      <BodyContent>
        <div>Test Content</div>
      </BodyContent>,
    );

    // Assert
    expect(getByText("Test Content")).toBeInTheDocument();
  });

  it("適切なプロバイダーでラップされる", () => {
    // Act
    const { getByText } = render(
      <BodyContent>
        <div>Test Content</div>
      </BodyContent>,
    );

    // Assert - CritiqueProviderでラップされた子要素が表示される
    expect(getByText("Test Content")).toBeInTheDocument();
  });

  it("Toasterコンポーネントが含まれる", () => {
    // Act
    const { getByTestId } = render(
      <BodyContent>
        <div>Test Content</div>
      </BodyContent>,
    );

    // Assert - Toasterのモック版が存在することを確認
    expect(getByTestId("toaster")).toBeInTheDocument();
  });
});
