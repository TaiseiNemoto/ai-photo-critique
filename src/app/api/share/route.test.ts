import { POST } from "./route";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// モックの設定（統合データ構造対応）
vi.mock("@/lib/kv", () => ({
  kvClient: {
    getCritique: vi.fn(),
  },
}));

import { kvClient } from "@/lib/kv";

describe("/api/share POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("有効なshareIdで既存データを活用して共有URLを生成できる", async () => {
    const mockCritiqueData = {
      id: "critique-123",
      filename: "test.jpg",
      uploadedAt: "2025-08-20T09:30:00.000Z",
      technique: "良好なフォーカスが設定されています",
      composition: "三分割法が効果的に使用されています",
      color: "色彩のバランスが優れています",
      overall: "総合的に優秀な写真です",
      imageData: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD",
      exifData: { make: "Canon", model: "EOS R5" },
      shareId: "critique-123",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    vi.mocked(kvClient.getCritique).mockResolvedValue(mockCritiqueData);

    const mockRequest = {
      json: () =>
        Promise.resolve({
          critique: {
            shareId: "critique-123",
            technique: "良好なフォーカスが設定されています",
            composition: "三分割法が効果的に使用されています",
            color: "色彩のバランスが優れています",
          },
        }),
    } as NextRequest;

    const response = await POST(mockRequest);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody).toEqual({
      success: true,
      shareId: "critique-123",
      url: "/s/critique-123",
    });

    expect(kvClient.getCritique).toHaveBeenCalledWith("critique-123");
  });

  it("存在しないshareIdの場合に404エラーを返す（旧テスト修正版）", async () => {
    vi.mocked(kvClient.getCritique).mockResolvedValue(null);

    const mockRequest = {
      json: () =>
        Promise.resolve({
          critique: {
            shareId: "nonexistent-123",
            technique: "良好なフォーカスが設定されています",
            composition: "三分割法が効果的に使用されています",
            color: "色彩のバランスが優れています",
          },
        }),
    } as NextRequest;

    const response = await POST(mockRequest);
    const responseBody = await response.json();

    expect(response.status).toBe(404);
    expect(responseBody).toEqual({
      success: false,
      error: "データが見つかりません",
    });
  });

  it("講評データが無い場合に400エラーを返す（旧テスト修正版）", async () => {
    const mockRequest = {
      json: () => Promise.resolve({}),
    } as NextRequest;

    const response = await POST(mockRequest);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody).toEqual({
      success: false,
      error: "送信されたデータが無効です",
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

  // === 新しいテストケース（課題C4対応） ===

  it("既存のshareIdがある場合、保存処理を行わずにshareIdを返却する", async () => {
    const mockCritiqueData = {
      id: "existing-share-id-123",
      filename: "test.jpg",
      uploadedAt: "2025-08-20T09:30:00.000Z",
      technique: "良好なフォーカスが設定されています",
      composition: "三分割法が効果的に使用されています",
      color: "色彩のバランスが優れています",
      overall: "総合的に優秀な写真です",
      imageData: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD",
      exifData: { make: "Canon", model: "EOS R5" },
      shareId: "existing-share-id-123",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    vi.mocked(kvClient.getCritique).mockResolvedValue(mockCritiqueData);

    const mockRequest = {
      json: () =>
        Promise.resolve({
          critique: {
            shareId: "existing-share-id-123",
            technique: "良好なフォーカスが設定されています",
            composition: "三分割法が効果的に使用されています",
            color: "色彩のバランスが優れています",
          },
        }),
    } as NextRequest;

    const response = await POST(mockRequest);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody).toEqual({
      success: true,
      shareId: "existing-share-id-123",
      url: "/s/existing-share-id-123",
    });

    // 既存データの確認のみ実行されることを確認
    expect(kvClient.getCritique).toHaveBeenCalledWith("existing-share-id-123");
  });

  it("shareIdがない場合、400エラーを返す", async () => {
    const mockRequest = {
      json: () =>
        Promise.resolve({
          critique: {
            technique: "良好なフォーカスが設定されています",
            composition: "三分割法が効果的に使用されています",
            color: "色彩のバランスが優れています",
            // shareIdが存在しない
          },
        }),
    } as NextRequest;

    const response = await POST(mockRequest);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody).toEqual({
      success: false,
      error: "送信されたデータが無効です",
    });

    // データ取得処理が呼ばれないことを確認
    expect(kvClient.getCritique).not.toHaveBeenCalled();
  });

  it("存在しないshareIdの場合、404エラーを返す", async () => {
    vi.mocked(kvClient.getCritique).mockResolvedValue(null);

    const mockRequest = {
      json: () =>
        Promise.resolve({
          critique: {
            shareId: "nonexistent-share-id-123",
            technique: "良好なフォーカスが設定されています",
            composition: "三分割法が効果的に使用されています",
            color: "色彩のバランスが優れています",
          },
        }),
    } as NextRequest;

    const response = await POST(mockRequest);
    const responseBody = await response.json();

    expect(response.status).toBe(404);
    expect(responseBody).toEqual({
      success: false,
      error: "データが見つかりません",
    });

    // 確認処理のみ実行されることを確認
    expect(kvClient.getCritique).toHaveBeenCalledWith(
      "nonexistent-share-id-123",
    );
  });
});
