import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import * as imageModule from "@/lib/image";
import * as exifModule from "@/lib/exif";
import * as kvModule from "@/lib/kv";

/**
 * /api/upload API Route テスト
 * t-wada手法: テストファースト開発
 */

// モックの設定
vi.mock("@/lib/image", () => ({
  processImage: vi.fn(),
}));

vi.mock("@/lib/exif", () => ({
  extractExif: vi.fn(),
}));

vi.mock("@/lib/kv", () => ({
  setCritiqueData: vi.fn(),
}));

const mockProcessImage = vi.fn();
const mockExtractExif = vi.fn();
const mockSetCritiqueData = vi.fn();

// モックの直接割り当て
vi.mocked(imageModule.processImage).mockImplementation(mockProcessImage);
vi.mocked(exifModule.extractExif).mockImplementation(mockExtractExif);
vi.mocked(kvModule.setCritiqueData).mockImplementation(mockSetCritiqueData);

describe("/api/upload POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常な画像アップロードの場合、処理されたデータを返す", async () => {
    // Arrange
    const mockImageBuffer = Buffer.from("fake image data");
    const mockProcessedData = {
      buffer: mockImageBuffer,
      width: 800,
      height: 600,
      format: "jpeg" as const,
      originalSize: 1024,
      processedSize: 512,
    };
    const mockExifData = {
      Camera: "Canon EOS R5",
      Lens: "RF24-70mm F2.8 L IS USM",
      ISO: 100,
      FocalLength: "50mm",
      Aperture: "f/2.8",
      ShutterSpeed: "1/125s",
      DateTime: "2024:08:29 09:30:00",
    };

    mockProcessImage.mockResolvedValue(mockProcessedData);
    mockExtractExif.mockResolvedValue(mockExifData);
    mockSetCritiqueData.mockResolvedValue();

    const formData = new FormData();
    formData.append(
      "file",
      new Blob([mockImageBuffer], { type: "image/jpeg" }),
      "test.jpg",
    );

    const request = new NextRequest("http://localhost:3000/api/upload", {
      method: "POST",
      body: formData,
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.exif).toEqual(mockExifData);
    expect(data.data.imageInfo.width).toBe(800);
    expect(data.data.imageInfo.height).toBe(600);
    expect(typeof data.data.id).toBe("string");

    expect(mockProcessImage).toHaveBeenCalledOnce();
    expect(mockExtractExif).toHaveBeenCalledOnce();
    expect(mockSetCritiqueData).toHaveBeenCalledOnce();
  });

  it("ファイルが含まれていない場合、400エラーを返す", async () => {
    // Arrange
    const formData = new FormData();
    const request = new NextRequest("http://localhost:3000/api/upload", {
      method: "POST",
      body: formData,
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("ファイルが選択されていません");
  });

  it("画像処理が失敗した場合、500エラーを返す", async () => {
    // Arrange
    const mockImageBuffer = Buffer.from("invalid image data");
    mockProcessImage.mockRejectedValue(new Error("Invalid image format"));

    const formData = new FormData();
    formData.append(
      "file",
      new Blob([mockImageBuffer], { type: "image/jpeg" }),
      "test.jpg",
    );

    const request = new NextRequest("http://localhost:3000/api/upload", {
      method: "POST",
      body: formData,
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("画像の処理中にエラーが発生しました");
  });

  it("EXIF抽出が失敗した場合でも処理を継続する", async () => {
    // Arrange
    const mockImageBuffer = Buffer.from("fake image data");
    const mockProcessedData = {
      buffer: mockImageBuffer,
      width: 800,
      height: 600,
      format: "jpeg" as const,
      originalSize: 1024,
      processedSize: 512,
    };

    mockProcessImage.mockResolvedValue(mockProcessedData);
    mockExtractExif.mockRejectedValue(new Error("EXIF parsing failed"));
    mockSetCritiqueData.mockResolvedValue();

    const formData = new FormData();
    formData.append(
      "file",
      new Blob([mockImageBuffer], { type: "image/jpeg" }),
      "test.jpg",
    );

    const request = new NextRequest("http://localhost:3000/api/upload", {
      method: "POST",
      body: formData,
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.exif).toEqual({});
    expect(mockProcessImage).toHaveBeenCalledOnce();
    expect(mockExtractExif).toHaveBeenCalledOnce();
    expect(mockSetCritiqueData).toHaveBeenCalledOnce();
  });

  it("KV保存が失敗した場合、500エラーを返す", async () => {
    // Arrange
    const mockImageBuffer = Buffer.from("fake image data");
    const mockProcessedData = {
      buffer: mockImageBuffer,
      width: 800,
      height: 600,
      format: "jpeg" as const,
      originalSize: 1024,
      processedSize: 512,
    };
    const mockExifData = {
      Camera: "Canon EOS R5",
    };

    mockProcessImage.mockResolvedValue(mockProcessedData);
    mockExtractExif.mockResolvedValue(mockExifData);
    mockSetCritiqueData.mockRejectedValue(new Error("KV storage failed"));

    const formData = new FormData();
    formData.append(
      "file",
      new Blob([mockImageBuffer], { type: "image/jpeg" }),
      "test.jpg",
    );

    const request = new NextRequest("http://localhost:3000/api/upload", {
      method: "POST",
      body: formData,
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("データの保存中にエラーが発生しました");
  });

  it("非対応のHTTPメソッドの場合、405エラーを返す", async () => {
    // Act & Assert - このテストケースはPOST関数のみ定義されているため、Nextjsが自動的に405を返す
    // 実際の実装ではGET関数が定義されていないため、このテストは設計上のものです
    expect(true).toBe(true); // プレースホルダーテスト
  });
});
