import { render, screen, fireEvent } from "@testing-library/react";
import { expect, test, describe, vi, beforeEach } from "vitest";
import GenerateButton from "@/components/upload/GenerateButton";

describe("GenerateButton", () => {
  let mockOnGenerate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnGenerate = vi.fn();
  });

  describe("正常系", () => {
    test("アイドル状態で正しく表示される", () => {
      render(
        <GenerateButton
          isProcessing={false}
          onGenerate={mockOnGenerate}
          critiqueStatus="idle"
        />,
      );

      // ボタンテキストが正しく表示される
      expect(screen.getByText("講評を生成する")).toBeInTheDocument();

      // Sparklesアイコンが表示される（data-testidで識別）
      expect(screen.getByTestId("sparkles-icon")).toBeInTheDocument();

      // ステータスメッセージが表示される
      expect(screen.getByText("通常2-3秒で完了します")).toBeInTheDocument();

      // ボタンがクリック可能
      expect(screen.getByRole("button")).not.toBeDisabled();
    });

    test("処理中状態で正しく表示される", () => {
      render(
        <GenerateButton
          isProcessing={true}
          onGenerate={mockOnGenerate}
          critiqueStatus="loading"
        />,
      );

      // ボタンテキストが変更される
      expect(screen.getByText("AI講評を生成中...")).toBeInTheDocument();

      // スピナーが表示される
      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();

      // 処理中メッセージが表示される
      expect(screen.getByText("AI講評を生成しています")).toBeInTheDocument();
      expect(
        screen.getByText("技術・構図・色彩を分析中..."),
      ).toBeInTheDocument();

      // ボタンが無効化される
      expect(screen.getByRole("button")).toBeDisabled();
    });

    test("成功状態で正しく表示される", () => {
      render(
        <GenerateButton
          isProcessing={false}
          onGenerate={mockOnGenerate}
          critiqueStatus="success"
        />,
      );

      // ボタンテキストが変更される
      expect(screen.getByText("講評完了！")).toBeInTheDocument();

      // ArrowRightアイコンが表示される
      expect(screen.getByTestId("arrow-right-icon")).toBeInTheDocument();

      // 成功メッセージが表示される
      expect(
        screen.getByText("講評が正常に生成されました"),
      ).toBeInTheDocument();
      expect(screen.getByText("結果ページに移動します...")).toBeInTheDocument();

      // ボタンが無効化される
      expect(screen.getByRole("button")).toBeDisabled();

      // ボタンの背景色が緑色になる
      expect(screen.getByRole("button")).toHaveClass("bg-green-600");
    });

    test("エラー状態で正しく表示される", () => {
      const errorMessage = "ネットワークエラーが発生しました";

      render(
        <GenerateButton
          isProcessing={false}
          onGenerate={mockOnGenerate}
          critiqueStatus="error"
          critiqueError={errorMessage}
        />,
      );

      // エラーメッセージが表示される
      expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();

      // ボタンの背景色が赤色になる
      expect(screen.getByRole("button")).toHaveClass("bg-red-600");
    });

    test("ボタンクリックでonGenerateが呼ばれる", () => {
      render(
        <GenerateButton
          isProcessing={false}
          onGenerate={mockOnGenerate}
          critiqueStatus="idle"
        />,
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockOnGenerate).toHaveBeenCalledTimes(1);
    });
  });

  describe("境界値テスト", () => {
    test("disabledがtrueの場合ボタンが無効化される", () => {
      render(
        <GenerateButton
          isProcessing={false}
          onGenerate={mockOnGenerate}
          disabled={true}
          critiqueStatus="idle"
        />,
      );

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();

      fireEvent.click(button);
      expect(mockOnGenerate).not.toHaveBeenCalled();
    });

    test("critiqueStatusがundefinedの場合デフォルト値が使用される", () => {
      render(
        <GenerateButton isProcessing={false} onGenerate={mockOnGenerate} />,
      );

      // デフォルトのアイドル状態で表示される
      expect(screen.getByText("講評を生成する")).toBeInTheDocument();
      expect(screen.getByText("通常2-3秒で完了します")).toBeInTheDocument();
    });
  });

  describe("異常系", () => {
    test("エラー状態でcritiqueErrorがない場合はエラーメッセージが表示されない", () => {
      render(
        <GenerateButton
          isProcessing={false}
          onGenerate={mockOnGenerate}
          critiqueStatus="error"
        />,
      );

      // エラーメッセージのコンテナが表示されない
      expect(
        screen.queryByText("エラーが発生しました"),
      ).not.toBeInTheDocument();
    });

    test("複数の状態が同時に設定された場合の優先順位確認", () => {
      render(
        <GenerateButton
          isProcessing={true}
          onGenerate={mockOnGenerate}
          critiqueStatus="success"
        />,
      );

      // isProcessingが優先される
      expect(screen.getByText("AI講評を生成中...")).toBeInTheDocument();
      expect(screen.getByRole("button")).toBeDisabled();
    });
  });
});
