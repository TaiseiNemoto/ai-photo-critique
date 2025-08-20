import { POST } from "./route";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// モックの設定
vi.mock("@/lib/kv", () => ({
  kvClient: {
    generateId: vi.fn(() => "share-short-123"),
    getCritique: vi.fn(),
    saveShare: vi.fn(),
  },
}));

import { kvClient } from "@/lib/kv";

describe("/api/share POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("有効な講評IDで短縮URLを生成できる", async () => {
    const mockCritiqueData = {
      id: "critique-123",
      filename: "test.jpg",
      technique: "良好なフォーカスが設定されています",
      composition: "三分割法が効果的に使用されています",
      color: "色彩のバランスが優れています",
      exifData: { make: "Canon", model: "EOS R5" },
      uploadedAt: "2025-08-20T09:30:00.000Z",
    };

    vi.mocked(kvClient.getCritique).mockResolvedValue(mockCritiqueData);

    const mockRequest = {
      json: () => Promise.resolve({ critiqueId: "critique-123" }),
    } as NextRequest;

    const response = await POST(mockRequest);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody).toEqual({
      success: true,
      shareId: "share-short-123",
      url: "/s/share-short-123",
    });

    expect(kvClient.getCritique).toHaveBeenCalledWith("critique-123");
    expect(kvClient.saveShare).toHaveBeenCalledWith({
      id: "share-short-123",
      critiqueId: "critique-123",
      createdAt: expect.any(String),
      expiresAt: expect.any(String),
    });
  });

  it("存在しない講評IDの場合に404エラーを返す", async () => {
    vi.mocked(kvClient.getCritique).mockResolvedValue(null);

    const mockRequest = {
      json: () => Promise.resolve({ critiqueId: "nonexistent-123" }),
    } as NextRequest;

    const response = await POST(mockRequest);
    const responseBody = await response.json();

    expect(response.status).toBe(404);
    expect(responseBody).toEqual({
      success: false,
      error: "講評データが見つかりません",
    });
  });

  it("講評IDが無い場合に400エラーを返す", async () => {
    const mockRequest = {
      json: () => Promise.resolve({}),
    } as NextRequest;

    const response = await POST(mockRequest);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody).toEqual({
      success: false,
      error: "講評IDが必要です",
    });
  });

  it("無効なJSONの場合に400エラーを返す", async () => {
    const mockRequest = {
      json: () => Promise.reject(new Error("Invalid JSON")),
    } as NextRequest;

    const response = await POST(mockRequest);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody).toEqual({
      success: false,
      error: "リクエストの形式が正しくありません",
    });
  });
});
