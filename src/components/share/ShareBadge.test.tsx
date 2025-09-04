import { render, screen } from "@testing-library/react";
import { expect, test, describe } from "vitest";
import { ShareBadge } from "@/components/share/ShareBadge";

describe("ShareBadge", () => {
  describe("正常系", () => {
    test("コンポーネントが正しく表示される", () => {
      render(<ShareBadge />);

      // バッジテキストが表示される
      expect(screen.getByText("シェアされた講評結果")).toBeInTheDocument();

      // グリーンドットアニメーションが表示される
      expect(screen.getByTestId("status-indicator")).toBeInTheDocument();
      expect(screen.getByTestId("status-indicator")).toHaveClass(
        "bg-green-500",
      );
      expect(screen.getByTestId("status-indicator")).toHaveClass(
        "animate-pulse",
      );

      // バッジ全体のスタイリングが適用される
      const badge = screen.getByTestId("share-badge");
      expect(badge).toHaveClass("bg-gray-100");
      expect(badge).toHaveClass("text-gray-700");
      expect(badge).toHaveClass("rounded-full");
      expect(badge).toHaveClass("border-gray-200");
    });

    test("バッジが中央に配置される", () => {
      render(<ShareBadge />);

      const container = screen.getByTestId("share-badge-container");
      expect(container).toHaveClass("flex");
      expect(container).toHaveClass("justify-center");
      expect(container).toHaveClass("mb-6");
    });
  });

  describe("境界値テスト", () => {
    test("複数回レンダリングしても同じ内容が表示される", () => {
      const { rerender } = render(<ShareBadge />);

      expect(screen.getByText("シェアされた講評結果")).toBeInTheDocument();

      rerender(<ShareBadge />);

      expect(screen.getByText("シェアされた講評結果")).toBeInTheDocument();
      expect(screen.getByTestId("status-indicator")).toBeInTheDocument();
    });
  });

  describe("視覚的テスト", () => {
    test("アニメーション要素が正しく設定される", () => {
      render(<ShareBadge />);

      const indicator = screen.getByTestId("status-indicator");

      // サイズクラスが正しく設定される
      expect(indicator).toHaveClass("w-2");
      expect(indicator).toHaveClass("h-2");

      // 形状クラスが正しく設定される
      expect(indicator).toHaveClass("rounded-full");

      // アニメーションクラスが設定される
      expect(indicator).toHaveClass("animate-pulse");
    });

    test("バッジのタイポグラフィが正しく設定される", () => {
      render(<ShareBadge />);

      const badge = screen.getByTestId("share-badge");

      // フォントサイズとウェイト
      expect(badge).toHaveClass("text-sm");
      expect(badge).toHaveClass("font-medium");

      // パディング
      expect(badge).toHaveClass("px-4");
      expect(badge).toHaveClass("py-2");

      // ボーダー
      expect(badge).toHaveClass("border");
    });
  });
});
