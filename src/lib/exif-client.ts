import exifr from "exifr";
import type { ExifData } from "@/types/upload";

/**
 * クライアントサイドでファイルからEXIF情報を抽出する
 * 
 * @param file - EXIF情報を抽出するファイル
 * @returns EXIF情報（抽出できない場合は空オブジェクト）
 */
export async function extractExifDataClient(file: File): Promise<ExifData> {
  try {
    const rawExifData = await exifr.parse(file);
    
    if (!rawExifData) {
      return {};
    }

    // rawExifDataから必要な情報を抽出・変換
    const exifData: ExifData = {};

    if (rawExifData.Make) {
      exifData.make = rawExifData.Make;
    }

    if (rawExifData.Model) {
      exifData.model = rawExifData.Model;
    }

    if (rawExifData.LensModel) {
      exifData.lensModel = rawExifData.LensModel;
    }

    if (rawExifData.FNumber) {
      exifData.fNumber = `F${rawExifData.FNumber}`;
    }

    if (rawExifData.ExposureTime) {
      exifData.exposureTime = rawExifData.ExposureTime;
    }

    if (rawExifData.ISO) {
      exifData.iso = rawExifData.ISO.toString();
    }

    if (rawExifData.FocalLength) {
      exifData.focalLength = `${rawExifData.FocalLength}mm`;
    }

    return exifData;
  } catch (error) {
    console.warn("Failed to extract EXIF data on client side:", error);
    return {};
  }
}