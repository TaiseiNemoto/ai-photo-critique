import { POST } from "./route";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// モックの設定
vi.mock("@/lib/kv", () => ({
  kvClient: {
    generateId: vi.fn(() => "share-short-123"),
    getCritique: vi.fn(),
    saveShare: vi.fn(),
    saveCritique: vi.fn(),
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
      technique: "良好なフォーカスが設定されています",
      composition: "三分割法が効果的に使用されています",
      color: "色彩のバランスが優れています",
      exifData: { make: "Canon", model: "EOS R5" },
      uploadedAt: "2025-08-20T09:30:00.000Z",
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
    // 重要: 保存処理が呼ばれないことを確認（重複保存防止）
    expect(kvClient.saveShare).not.toHaveBeenCalled();
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
      error: "講評データが見つかりません",
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
      error: "講評データにshareIdが見つかりません",
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
      technique: "良好なフォーカスが設定されています",
      composition: "三分割法が効果的に使用されています",
      color: "色彩のバランスが優れています",
      exifData: { make: "Canon", model: "EOS R5" },
      uploadedAt: "2025-08-20T09:30:00.000Z",
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

    // 重要: 保存処理が呼ばれないことを確認（重複保存防止）
    expect(kvClient.saveCritique).not.toHaveBeenCalled();
    expect(kvClient.saveShare).not.toHaveBeenCalled();
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
      error: "講評データにshareIdが見つかりません",
    });

    // データ取得・保存処理が呼ばれないことを確認
    expect(kvClient.getCritique).not.toHaveBeenCalled();
    expect(kvClient.saveCritique).not.toHaveBeenCalled();
    expect(kvClient.saveShare).not.toHaveBeenCalled();
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
      error: "講評データが見つかりません",
    });

    // 確認処理のみ実行され、保存処理は呼ばれないことを確認
    expect(kvClient.getCritique).toHaveBeenCalledWith(
      "nonexistent-share-id-123",
    );
    expect(kvClient.saveCritique).not.toHaveBeenCalled();
    expect(kvClient.saveShare).not.toHaveBeenCalled();
  });
});
