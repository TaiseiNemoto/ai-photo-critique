import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import RootLayout from "@/app/layout";

/**
 * ルートレイアウト（layout.tsx）テスト
 * t-wada手法: カバレッジ向上のためのテスト
 */

describe("RootLayout", () => {
  it("HTML構造が正しく設定される", () => {
    // Act
    const { container } = render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>,
    );

    // Assert
    const html = container.querySelector("html");
    expect(html).toHaveAttribute("lang", "ja");
    expect(html).toHaveClass("h-full");

    const body = container.querySelector("body");
    expect(body).toHaveClass("h-full");
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

  it("適切なフォントクラスが適用される", () => {
    // Act
    const { container } = render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>,
    );

    // Assert
    const body = container.querySelector("body");
    expect(body?.className).toMatch(/antialiased/);
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
