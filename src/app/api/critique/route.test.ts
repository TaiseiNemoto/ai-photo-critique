import { POST } from "./route";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { CritiqueResult } from "@/types/upload";

// モックの設定
vi.mock("@/lib/critique", () => ({
  generatePhotoCritiqueWithRetry: vi.fn(),
}));

import { generatePhotoCritiqueWithRetry } from "@/lib/critique";

describe("/api/critique POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常な画像ファイルを受信して成功レスポンスを返す", async () => {
    // テスト用のモックレスポンス
    const mockCritiqueResult: CritiqueResult = {
      success: true,
      data: {
        technique: "良好なフォーカスが設定されています",
        composition: "三分割法が効果的に使用されています",
        color: "色彩のバランスが優れています",
      },
      processingTime: 2500,
    };

    vi.mocked(generatePhotoCritiqueWithRetry).mockResolvedValue(
      mockCritiqueResult,
    );

    // FormDataとFileのモックを作成
    const mockFile = {
      name: "test.jpg",
      type: "image/jpeg",
      size: 1024,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    } as File;

    const mockFormData = {
      get: (key: string) => (key === "image" ? mockFile : null),
    } as FormData;

    // NextRequestを模擬するためにカスタムオブジェクトを作成
    const mockRequest = {
      formData: () => Promise.resolve(mockFormData),
    } as NextRequest;

    const response = await POST(mockRequest);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody).toEqual(mockCritiqueResult);
    expect(generatePhotoCritiqueWithRetry).toHaveBeenCalledWith(
      expect.any(Buffer),
      "image/jpeg",
      1,
    );
  });

  it("画像ファイルがない場合にエラーレスポンスを返す", async () => {
    const formData = new FormData();
    // ファイルを追加しない

    const mockRequest = {
      formData: () => Promise.resolve(formData),
    } as NextRequest;

    const response = await POST(mockRequest);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody).toEqual({
      success: false,
      error: "ファイルが選択されていません",
    });
  });

  it("画像以外のファイルの場合にエラーレスポンスを返す", async () => {
    const formData = new FormData();
    const mockFile = {
      name: "test.txt",
      type: "text/plain",
      size: 1024,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    } as File;
    formData.append("image", mockFile);

    const mockRequest = {
      formData: () => Promise.resolve(formData),
    } as NextRequest;

    const response = await POST(mockRequest);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody).toEqual({
      success: false,
      error: "画像ファイルを選択してください",
    });
  });

  it("AIサービスエラーの場合にエラーレスポンスを返す", async () => {
    const mockErrorResult: CritiqueResult = {
      success: false,
      error: "AI講評の生成中にエラーが発生しました",
    };

    vi.mocked(generatePhotoCritiqueWithRetry).mockResolvedValue(
      mockErrorResult,
    );

    const mockFile = {
      name: "test.jpg",
      type: "image/jpeg",
      size: 1024,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    } as File;

    const mockFormData = {
      get: (key: string) => (key === "image" ? mockFile : null),
    } as FormData;

    const mockRequest = {
      formData: () => Promise.resolve(mockFormData),
    } as NextRequest;

    const response = await POST(mockRequest);
    const responseBody = await response.json();

    expect(response.status).toBe(500);
    expect(responseBody).toEqual(mockErrorResult);
  });

  it("予期しない例外が発生した場合にエラーレスポンスを返す", async () => {
    vi.mocked(generatePhotoCritiqueWithRetry).mockRejectedValue(
      new Error("Network error"),
    );

    const mockFile = {
      name: "test.jpg",
      type: "image/jpeg",
      size: 1024,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    } as File;

    const mockFormData = {
      get: (key: string) => (key === "image" ? mockFile : null),
    } as FormData;

    const mockRequest = {
      formData: () => Promise.resolve(mockFormData),
    } as NextRequest;

    const response = await POST(mockRequest);
    const responseBody = await response.json();

    expect(response.status).toBe(500);
    expect(responseBody.success).toBe(false);
    expect(responseBody.error).toContain("Network error");
  });
});
