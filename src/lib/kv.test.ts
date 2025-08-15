import { describe, it, expect, beforeEach } from "vitest";
import { kvClient, type CritiqueData, type ShareData } from "./kv";

describe("KV Client", () => {
  beforeEach(async () => {
    // テスト用のクリーンアップ（必要に応じて）
  });

  describe("接続テスト", () => {
    it("KVへの接続が成功すること", async () => {
      const result = await kvClient.testConnection();
      expect(result).toBe(true);
    });
  });

  describe("批評データの操作", () => {
    it("批評データの保存と取得ができること", async () => {
      const testData: CritiqueData = {
        id: "test-critique-1",
        filename: "test.jpg",
        technique: "テスト技術評価",
        composition: "テスト構図評価",
        color: "テスト色彩評価",
        exifData: { camera: "Test Camera" },
        uploadedAt: new Date().toISOString(),
      };

      // 保存
      await kvClient.saveCritique(testData);

      // 取得
      const retrieved = await kvClient.getCritique(testData.id);
      expect(retrieved).toEqual(testData);
    });

    it("存在しない批評データを取得すると null が返ること", async () => {
      const result = await kvClient.getCritique("non-existent-id");
      expect(result).toBeNull();
    });
  });

  describe("共有データの操作", () => {
    it("共有データの保存と取得ができること", async () => {
      const testData: ShareData = {
        id: "test-share-1",
        critiqueId: "test-critique-1",
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      // 保存
      await kvClient.saveShare(testData);

      // 取得
      const retrieved = await kvClient.getShare(testData.id);
      expect(retrieved).toEqual(testData);
    });

    it("存在しない共有データを取得すると null が返ること", async () => {
      const result = await kvClient.getShare("non-existent-share-id");
      expect(result).toBeNull();
    });
  });

  describe("画像データの操作", () => {
    it("画像データの保存と取得ができること", async () => {
      const testImageId = "test-image-1";
      const testImageData =
        "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD"; // Base64テストデータ

      // 保存
      await kvClient.saveImage(testImageId, testImageData);

      // 取得
      const retrieved = await kvClient.getImage(testImageId);
      expect(retrieved).toBe(testImageData);
    });

    it("存在しない画像データを取得すると null が返ること", async () => {
      const result = await kvClient.getImage("non-existent-image-id");
      expect(result).toBeNull();
    });
  });

  describe("ユーティリティ機能", () => {
    it("IDが生成できること", () => {
      const id1 = kvClient.generateId();
      const id2 = kvClient.generateId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2); // 異なるIDが生成される
      expect(id1.length).toBeGreaterThan(10); // 十分な長さがある
    });

    it("データの削除ができること", async () => {
      const testData: CritiqueData = {
        id: "test-delete-1",
        filename: "delete-test.jpg",
        technique: "テスト",
        composition: "テスト",
        color: "テスト",
        exifData: {},
        uploadedAt: new Date().toISOString(),
      };

      // 保存
      await kvClient.saveCritique(testData);

      // 確認
      let retrieved = await kvClient.getCritique(testData.id);
      expect(retrieved).toEqual(testData);

      // 削除
      await kvClient.delete(`critique:${testData.id}`);

      // 削除確認
      retrieved = await kvClient.getCritique(testData.id);
      expect(retrieved).toBeNull();
    });
  });
});
