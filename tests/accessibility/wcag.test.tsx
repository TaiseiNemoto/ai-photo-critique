import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import React from "react";
import UploadZone from "@/components/upload/UploadZone";
import GenerateButton from "@/components/upload/GenerateButton";
import AppHeader from "@/components/common/AppHeader";
import { CritiqueCard } from "@/components/report/CritiqueCard";

describe("WCAG AA準拠テスト", () => {
  describe("セマンティックHTML", () => {
    it("AppHeaderが適切なheader要素を使用している", () => {
      render(<AppHeader />);
      const header = screen.getByRole("banner");
      expect(header).toBeInTheDocument();
      expect(header.tagName).toBe("HEADER");
    });

    it("メインコンテンツにh1要素が存在する", () => {
      render(<AppHeader />);
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent("Photo-Critique");
    });
  });

  describe("キーボードアクセシビリティ", () => {
    it("UploadZoneがtabIndexとroleを持つ", () => {
      const mockHandler = () => {};
      render(<UploadZone onImageUploaded={mockHandler} />);

      const uploadArea = screen.getByRole("button", {
        name: /画像をアップロード/i,
      });
      expect(uploadArea).toHaveAttribute("tabIndex", "0");
    });

    it("GenerateButtonがfocus可能である", () => {
      const mockHandler = () => {};
      render(
        <GenerateButton
          isProcessing={false}
          onGenerate={mockHandler}
          disabled={false}
        />,
      );

      const button = screen.getByRole("button", { name: /講評を生成する/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toHaveAttribute("disabled");
    });
  });

  describe("ARIAラベル", () => {
    it("UploadZoneに適切なaria-labelとaria-describedbyがある", () => {
      const mockHandler = () => {};
      render(<UploadZone onImageUploaded={mockHandler} />);

      const uploadArea = screen.getByRole("button", {
        name: /画像をアップロード/i,
      });
      expect(uploadArea).toHaveAttribute("aria-label", "画像をアップロード");
      expect(uploadArea).toHaveAttribute(
        "aria-describedby",
        "upload-instructions",
      );

      const instructions = screen.getByText(/対応形式: JPEG, PNG, HEIC, WebP/);
      expect(instructions).toHaveAttribute("id", "upload-instructions");
    });

    it("GenerateButtonにaria-describedbyがある", () => {
      const mockHandler = () => {};
      render(
        <GenerateButton
          isProcessing={false}
          onGenerate={mockHandler}
          disabled={false}
        />,
      );

      const button = screen.getByRole("button", { name: /講評を生成する/i });
      expect(button).toHaveAttribute("aria-describedby", "generate-status");

      const statusElement = document.getElementById("generate-status");
      expect(statusElement).toBeInTheDocument();
    });

    it("CritiqueCardが適切なregionとラベルを持つ", () => {
      render(
        <CritiqueCard title="技術面" icon="技" content="テスト講評内容" />,
      );

      const card = screen.getByRole("region", { name: "技術面" });
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute("aria-labelledby", "critique-技術面");

      const headingElement = screen.getByText("技術面").closest("[id]");
      expect(headingElement).toHaveAttribute("id", "critique-技術面");
    });
  });

  describe("ライブリージョン", () => {
    it("ローディング状態でaria-liveが適用される", () => {
      const mockHandler = () => {};
      render(
        <GenerateButton
          isProcessing={true}
          onGenerate={mockHandler}
          disabled={false}
        />,
      );

      const button = screen.getByRole("button", { name: /AI講評を生成中/i });
      expect(button).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("アイコンのアクセシビリティ", () => {
    it("装飾的なアイコンがaria-hiddenを持つ", () => {
      render(
        <CritiqueCard title="技術面" icon="技" content="テスト講評内容" />,
      );

      const iconSpan = screen.getByText("技");
      expect(iconSpan).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("言語設定", () => {
    it("コンポーネントが日本語コンテンツを適切に表示する", () => {
      render(<AppHeader />);

      const japaneseText = screen.getByText("あなたの写真を数秒でAI講評");
      expect(japaneseText).toBeInTheDocument();

      const description = screen.getByText(/技術・構図・色彩の3つの観点/);
      expect(description).toBeInTheDocument();
    });
  });
});
