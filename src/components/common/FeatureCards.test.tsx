import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import FeatureCards from "@/components/common/FeatureCards";

/**
 * FeatureCardsコンポーネントテスト
 * t-wada手法: カバレッジ向上のためのテスト
 */

describe("FeatureCards", () => {
  it("すべての機能カードが表示される", () => {
    // Act
    render(<FeatureCards />);

    // Assert
    expect(screen.getByText("技術面")).toBeInTheDocument();
    expect(screen.getByText("構図")).toBeInTheDocument();
    expect(screen.getByText("色彩")).toBeInTheDocument();
  });

  it("各カードの説明文が表示される", () => {
    // Act
    render(<FeatureCards />);

    // Assert
    expect(
      screen.getByText("露出・ピント・ノイズなどの技術的評価"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("三分割法・対称性・視線誘導の分析"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("色調・彩度・コントラストの評価"),
    ).toBeInTheDocument();
  });

  it("適切なアイコンが表示される", () => {
    // Act
    render(<FeatureCards />);

    // Assert
    // アイコンはテキストで表示される
    expect(screen.getByText("技")).toBeInTheDocument();
    expect(screen.getByText("構")).toBeInTheDocument();
    expect(screen.getByText("色")).toBeInTheDocument();
  });

  it("レスポンシブグリッドレイアウトが適用される", () => {
    // Act
    const { container } = render(<FeatureCards />);

    // Assert
    const gridContainer = container.querySelector(".grid");
    expect(gridContainer).toHaveClass("grid", "md:grid-cols-3");
  });

  it("各カードが適切なスタイリングを持つ", () => {
    // Act
    const { container } = render(<FeatureCards />);

    // Assert
    const cards = container.querySelectorAll("[data-testid]");
    cards.forEach((card) => {
      expect(card).toHaveClass("rounded-lg", "border");
    });
  });
});
