import { describe, it, expect } from "vitest";
import { extractExifFromFormData } from "./exif";

describe("extractExifFromFormData", () => {
  describe("正常系", () => {
    it("有効なEXIFデータをパースできる", () => {
      const formData = new FormData();
      const exifData = {
        make: "Canon",
        model: "EOS R5",
        fNumber: 2.8,
        exposureTime: "1/60",
        iso: 800,
      };
      formData.append("exifData", JSON.stringify(exifData));

      const result = extractExifFromFormData(formData);

      expect(result).toEqual(exifData);
    });

    it("EXIFデータが存在しない場合は空オブジェクトを返す", () => {
      const formData = new FormData();

      const result = extractExifFromFormData(formData);

      expect(result).toEqual({});
    });

    it("EXIFデータが空文字列の場合は空オブジェクトを返す", () => {
      const formData = new FormData();
      formData.append("exifData", "");

      const result = extractExifFromFormData(formData);

      expect(result).toEqual({});
    });
  });

  describe("異常系", () => {
    it("無効なJSONデータの場合は空オブジェクトを返す", () => {
      const formData = new FormData();
      formData.append("exifData", "invalid json");

      const result = extractExifFromFormData(formData);

      expect(result).toEqual({});
    });

    it("malformed JSONの場合は空オブジェクトを返す", () => {
      const formData = new FormData();
      formData.append("exifData", '{"incomplete": json}');

      const result = extractExifFromFormData(formData);

      expect(result).toEqual({});
    });

    it("nullを含むJSONでも正常にパースする", () => {
      const formData = new FormData();
      const exifData = {
        make: "Canon",
        model: null,
        fNumber: 2.8,
      };
      formData.append("exifData", JSON.stringify(exifData));

      const result = extractExifFromFormData(formData);

      expect(result).toEqual(exifData);
    });
  });

  describe("境界値", () => {
    it("非常に大きなEXIFデータでも処理できる", () => {
      const formData = new FormData();
      const largeExifData = {
        make: "Canon",
        model: "EOS R5",
        description: "A".repeat(1000), // 1000文字の説明
        tags: Array.from({ length: 100 }, (_, i) => `tag${i}`), // 100個のタグ
      };
      formData.append("exifData", JSON.stringify(largeExifData));

      const result = extractExifFromFormData(formData);

      expect(result).toEqual(largeExifData);
    });

    it("ネストしたオブジェクトも正常にパースする", () => {
      const formData = new FormData();
      const nestedExifData = {
        camera: {
          make: "Canon",
          model: "EOS R5",
          settings: {
            fNumber: 2.8,
            exposureTime: "1/60",
          },
        },
        gps: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
      };
      formData.append("exifData", JSON.stringify(nestedExifData));

      const result = extractExifFromFormData(formData);

      expect(result).toEqual(nestedExifData);
    });
  });
});