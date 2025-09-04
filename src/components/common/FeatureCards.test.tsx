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
    expect(screen.getByText("瞬時の分析")).toBeInTheDocument();
    expect(screen.getByText("3軸評価")).toBeInTheDocument();
    expect(screen.getByText("簡単共有")).toBeInTheDocument();
  });

  it("各カードの説明文が表示される", () => {
    // Act
    render(<FeatureCards />);

    // Assert
    expect(
      screen.getByText("AIが数秒で写真を解析し、即座にフィードバックを提供"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("技術・構図・色彩の3つの観点から総合的に評価"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("結果を簡単にSNSでシェアして、みんなと共有"),
    ).toBeInTheDocument();
  });

  it("適切なアイコンが表示される", () => {
    // Act
    const { container } = render(<FeatureCards />);

    // Assert
    // アイコンはSVG要素として描画される
    const icons = container.querySelectorAll("svg");
    expect(icons.length).toBeGreaterThanOrEqual(3);
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
