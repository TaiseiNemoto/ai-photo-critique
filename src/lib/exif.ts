import { ExifData } from "@/types/upload";
import { extractStringFromFormData } from "@/lib/form-utils";

/**
 * FormDataからEXIF情報を抽出・パースする統合関数
 * @param formData - FormDataオブジェクト
 * @returns パース済みのEXIFデータ
 */
export function extractExifFromFormData(formData: FormData): ExifData {
  const exifDataResult = extractStringFromFormData(formData, "exifData", {
    optional: true,
  });

  let exifData: ExifData = {};

  if (exifDataResult.success && exifDataResult.data) {
    try {
      exifData = JSON.parse(exifDataResult.data);
      console.log("Using client-side EXIF data");
    } catch (error) {
      console.warn("Invalid EXIF data from client, using empty object:", error);
      exifData = {};
    }
  } else {
    console.log("No client EXIF data provided, using empty object");
  }

  return exifData;
}