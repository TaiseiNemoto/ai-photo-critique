import { describe, it, expect, beforeEach } from "vitest";
import { kvClient, type CritiqueData } from "./kv";

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
        imageData: "data:image/jpeg;base64,AAAAAAAAAAAAAAAAAAAAAAA=",
        uploadedAt: new Date().toISOString(),
      };

      // 保存
      await kvClient.saveCritique(testData);

      // 取得
      const retrieved = await kvClient.getCritique(testData.id);
      expect(retrieved).toEqual(testData);
    });

    it("画像データ統合後のCritiqueDataが正しく保存・取得できること", async () => {
      const testData: CritiqueData = {
        id: "test-critique-with-image",
        filename: "test-image.jpg",
        technique: "統合テスト技術評価",
        composition: "統合テスト構図評価",
        color: "統合テスト色彩評価",
        exifData: { camera: "Integrated Test Camera", iso: 200 },
        imageData: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD",
        uploadedAt: new Date().toISOString(),
      };

      // 保存
      await kvClient.saveCritique(testData);

      // 取得
      const retrieved = await kvClient.getCritique(testData.id);
      expect(retrieved).toEqual(testData);
      expect(retrieved?.imageData).toBe(testData.imageData);
    });

    it("存在しない批評データを取得すると null が返ること", async () => {
      const result = await kvClient.getCritique("non-existent-id");
      expect(result).toBeNull();
    });
  });

  describe("統合されたCritiqueData（共有機能統合）", () => {
    it("統合CritiqueData（共有データ統合）の保存と取得ができること", async () => {
      const testData: CritiqueData = {
        // 基本情報
        id: "test-critique-unified",
        filename: "unified-test.jpg",
        uploadedAt: new Date().toISOString(),

        // 講評内容
        technique: "統合テスト技術評価",
        composition: "統合テスト構図評価",
        color: "統合テスト色彩評価",
        overall: "統合テスト総合評価",

        // 画像関連
        imageData: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD",
        exifData: { camera: "Unified Test Camera", iso: 400 },

        // 共有機能（旧ShareData統合）
        shareId: "share-unified-test",
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      // 保存（これは現在失敗するはず - 統合型定義前のため）
      await kvClient.saveCritique(testData);

      // 取得（これも失敗するはず）
      const retrieved = await kvClient.getCritique(testData.id);
      expect(retrieved).toEqual(testData);
      expect(retrieved?.shareId).toBe(testData.shareId);
      expect(retrieved?.expiresAt).toBe(testData.expiresAt);
    });

    it("ShareDataメソッドが削除されていること", async () => {
      // これらのメソッドは統合後削除されるため、存在しないはず
      expect(typeof kvClient.saveShare).toBe("undefined");
      expect(typeof kvClient.getShare).toBe("undefined");
    });
  });

  // 注意: 画像データの操作テストは重複保存解消のため削除
  // 画像データはCritiqueDataに統合されるため、単独の保存・取得は不要

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
        imageData: "data:image/jpeg;base64,TESTDATA",
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
