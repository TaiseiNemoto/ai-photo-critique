import { GET } from "./route";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// モックの設定（統合データ構造対応）
vi.mock("@/lib/kv", () => ({
  kvClient: {
    getCritique: vi.fn(),
  },
}));

import { kvClient } from "@/lib/kv";

describe("/api/data/[id] GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("有効なIDで講評データを取得できる", async () => {
    const mockCritiqueData = {
      id: "test-id-12345",
      filename: "test.jpg",
      uploadedAt: "2025-08-20T09:30:00.000Z",
      technique: "良好なフォーカスが設定されています",
      composition: "三分割法が効果的に使用されています",
      color: "色彩のバランスが優れています",
      overall: "総合的に優秀な写真です",
      imageData: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD",
      exifData: { make: "Canon", model: "EOS R5" },
      shareId: "test-id-12345",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24時間後
    };

    vi.mocked(kvClient.getCritique).mockResolvedValue(mockCritiqueData);

    const mockRequest = {} as NextRequest;
    const params = { id: "test-id-12345" };

    const response = await GET(mockRequest, { params });
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody).toEqual({
      success: true,
      data: mockCritiqueData,
    });
    expect(kvClient.getCritique).toHaveBeenCalledWith("test-id-12345");
  });

  it("存在しないIDの場合に404エラーを返す", async () => {
    vi.mocked(kvClient.getCritique).mockResolvedValue(null);

    const mockRequest = {} as NextRequest;
    const params = { id: "nonexistent-id" };

    const response = await GET(mockRequest, { params });
    const responseBody = await response.json();

    expect(response.status).toBe(404);
    expect(responseBody).toEqual({
      success: false,
      error: "データが見つかりません",
    });
  });

  it("期限切れのデータの場合に410エラーを返す", async () => {
    const expiredCritiqueData = {
      id: "expired-id",
      filename: "test.jpg",
      uploadedAt: "2025-08-19T09:30:00.000Z",
      technique: "テスト講評",
      composition: "テスト構図",
      color: "テスト色彩",
      overall: "テスト総合評価",
      imageData: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD",
      exifData: {},
      shareId: "expired-id",
      createdAt: "2025-08-19T09:30:00.000Z",
      expiresAt: "2025-08-19T10:30:00.000Z", // 既に期限切れ
    };

    vi.mocked(kvClient.getCritique).mockResolvedValue(expiredCritiqueData);

    const mockRequest = {} as NextRequest;
    const params = { id: "expired-id" };

    const response = await GET(mockRequest, { params });
    const responseBody = await response.json();

    expect(response.status).toBe(410);
    expect(responseBody).toEqual({
      success: false,
      error: "このデータは期限切れです",
    });
  });

  it("IDが無効な形式の場合に400エラーを返す", async () => {
    const mockRequest = {} as NextRequest;
    const params = { id: "" };

    const response = await GET(mockRequest, { params });
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody).toEqual({
      success: false,
      error: "有効なIDが必要です",
    });
  });

  it("KVストレージエラーの場合に500エラーを返す", async () => {
    vi.mocked(kvClient.getCritique).mockRejectedValue(
      new Error("Redis connection error"),
    );

    const mockRequest = {} as NextRequest;
    const params = { id: "test-id-12345" };

    const response = await GET(mockRequest, { params });
    const responseBody = await response.json();

    expect(response.status).toBe(500);
    expect(responseBody.success).toBe(false);
    expect(responseBody.error).toBe("処理中にエラーが発生しました");
  });
});
