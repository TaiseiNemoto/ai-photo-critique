import { parse } from 'exifr';
import type { ExifData } from '@/types/upload';

export async function extractExifData(file: File): Promise<ExifData> {
  // サポートされているファイル形式をチェック
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff'];
  if (!supportedTypes.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }

  // ファイル名の検証
  if (!file.name) {
    throw new Error('Invalid file: file name is empty');
  }

  try {
    const exifData = await parse(file);
    
    if (!exifData) {
      return {};
    }

    // EXIFデータを共通形式に変換
    const result: ExifData = {};

    if (exifData.Make) result.make = exifData.Make;
    if (exifData.Model) result.model = exifData.Model;
    if (exifData.LensModel) result.lensModel = exifData.LensModel;
    if (exifData.FNumber) result.fNumber = `f/${exifData.FNumber}`;
    if (exifData.ExposureTime) {
      // シャッター速度を分数形式に変換
      const fraction = convertToFraction(exifData.ExposureTime);
      result.exposureTime = `${fraction}s`;
    }
    if (exifData.ISO) result.iso = exifData.ISO.toString();
    if (exifData.FocalLength) result.focalLength = `${exifData.FocalLength}mm`;

    return result;
  } catch (error) {
    // EXIF解析エラーは空オブジェクトを返す
    return {};
  }
}

// シャッター速度を分数形式に変換するヘルパー関数
function convertToFraction(decimal: number): string {
  if (decimal >= 1) {
    return decimal.toString();
  }
  
  // 1未満の場合は分数形式に変換
  const denominator = Math.round(1 / decimal);
  return `1/${denominator}`;
}