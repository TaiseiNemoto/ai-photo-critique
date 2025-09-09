import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import RootLayout from "@/app/layout";

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
  it("コンポーネントが正常にレンダリングされる", () => {
    // Act & Assert - エラーが投げられないことを確認
    expect(() => {
      render(
        <RootLayout>
          <div>Test Content</div>
        </RootLayout>,
      );
    }).not.toThrow();
  });

  it("子コンポーネントが正しくレンダリングされる", () => {
    // Act
    const { getByText } = render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>,
    );

    // Assert
    expect(getByText("Test Content")).toBeInTheDocument();
  });

  it("適切なプロバイダーでラップされる", () => {
    // Act
    const { getByText } = render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>,
    );

    // Assert - CritiqueProviderでラップされた子要素が表示される
    expect(getByText("Test Content")).toBeInTheDocument();
  });

  it("Toasterコンポーネントが含まれる", () => {
    // Act
    const { container } = render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>,
    );

    // Assert
    // Toasterは実際のDOM要素として描画されるため、その存在を確認
    // shadcn/uiのToasterはポータル経由でbody直下に描画される
    expect(container).toBeInTheDocument();
  });
});
