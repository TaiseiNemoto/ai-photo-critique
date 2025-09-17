import { render, screen, act } from "@testing-library/react";
import { CritiqueProvider, useCritique } from "@/contexts/CritiqueContext";
import type { UploadedImage, CritiqueData } from "@/types/upload";

// テスト用のコンポーネント
function TestComponent() {
  const { currentCritique, setCritiqueData, clearCritiqueData, hasCritiqueData } = useCritique();

  return (
    <div>
      <div data-testid="has-critique">{hasCritiqueData.toString()}</div>
      <div data-testid="image-file-name">
        {currentCritique?.image?.file?.name || "null"}
      </div>
      <div data-testid="critique-share-id">
        {currentCritique?.critique?.shareId || "null"}
      </div>
      <div data-testid="has-timestamp">
        {currentCritique && "timestamp" in currentCritique ? "true" : "false"}
      </div>
      <button
        data-testid="set-critique"
        onClick={() =>
          setCritiqueData({
            image: mockUploadedImage,
            critique: mockCritiqueData,
          })
        }
      >
        Set Critique
      </button>
      <button data-testid="clear-critique" onClick={clearCritiqueData}>
        Clear Critique
      </button>
    </div>
  );
}

// モックデータ
const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
const mockUploadedImage: UploadedImage = {
  file: mockFile,
  preview: "blob:test-preview-url",
  exif: {
    camera: "Test Camera",
    lens: "Test Lens",
    settings: {
      focalLength: "50mm",
      aperture: "f/2.8",
      shutterSpeed: "1/60",
      iso: "100",
    },
    dateTime: "2025-09-17T10:00:00Z",
  },
};

const mockCritiqueData: CritiqueData = {
  shareId: "test-share-id",
  filename: "test.jpg",
  exifData: mockUploadedImage.exif,
  imageData: "base64-test-data",
  technique: {
    score: 85,
    feedback: "技術的な評価フィードバック",
    details: "詳細な技術評価",
  },
  composition: {
    score: 90,
    feedback: "構図の評価フィードバック",
    details: "詳細な構図評価",
  },
  color: {
    score: 80,
    feedback: "色彩の評価フィードバック",
    details: "詳細な色彩評価",
  },
  overall: {
    score: 85,
    summary: "全体的な評価まとめ",
  },
};

describe("CritiqueContext - 状態管理統一", () => {
  it("講評データはContext APIのみで管理される", () => {
    render(
      <CritiqueProvider>
        <TestComponent />
      </CritiqueProvider>
    );

    // 初期状態：講評データなし
    expect(screen.getByTestId("has-critique")).toHaveTextContent("false");
    expect(screen.getByTestId("image-file-name")).toHaveTextContent("null");
    expect(screen.getByTestId("critique-share-id")).toHaveTextContent("null");

    // 講評データ設定
    act(() => {
      screen.getByTestId("set-critique").click();
    });

    // Context APIで管理されていることを確認
    expect(screen.getByTestId("has-critique")).toHaveTextContent("true");
    expect(screen.getByTestId("image-file-name")).toHaveTextContent("test.jpg");
    expect(screen.getByTestId("critique-share-id")).toHaveTextContent("test-share-id");

    // データクリア
    act(() => {
      screen.getByTestId("clear-critique").click();
    });

    expect(screen.getByTestId("has-critique")).toHaveTextContent("false");
    expect(screen.getByTestId("image-file-name")).toHaveTextContent("null");
    expect(screen.getByTestId("critique-share-id")).toHaveTextContent("null");
  });

  it("未使用timestampフィールドが削除されている", () => {
    render(
      <CritiqueProvider>
        <TestComponent />
      </CritiqueProvider>
    );

    // 講評データ設定
    act(() => {
      screen.getByTestId("set-critique").click();
    });

    // timestampフィールドが存在しないことを確認
    expect(screen.getByTestId("has-timestamp")).toHaveTextContent("false");
  });

  it("Single Source of Truthが確立されている", () => {
    render(
      <CritiqueProvider>
        <TestComponent />
      </CritiqueProvider>
    );

    // 講評データ設定
    act(() => {
      screen.getByTestId("set-critique").click();
    });

    // Context APIがデータの唯一のソースであることを確認
    expect(screen.getByTestId("has-critique")).toHaveTextContent("true");
    expect(screen.getByTestId("image-file-name")).toHaveTextContent("test.jpg");
    expect(screen.getByTestId("critique-share-id")).toHaveTextContent("test-share-id");
    expect(screen.getByTestId("has-timestamp")).toHaveTextContent("false");
  });
});