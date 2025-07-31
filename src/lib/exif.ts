import { parse } from "exifr";
import type { ExifData } from "@/types/upload";

// 環境に応じたログ出力制御
class Logger {
  private isDebugEnabled(): boolean {
    return (
      process.env.NODE_ENV !== "test" && process.env.NODE_ENV !== "production"
    );
  }

  debug(...args: unknown[]): void {
    if (this.isDebugEnabled()) {
      console.log("[DEBUG]", ...args);
    }
  }

  info(...args: unknown[]): void {
    if (process.env.NODE_ENV !== "test") {
      console.log("[INFO]", ...args);
    }
  }

  error(...args: unknown[]): void {
    console.error("[ERROR]", ...args);
  }
}

const logger = new Logger();

export async function extractExifData(file: File): Promise<ExifData> {
  // サポートされているファイル形式をチェック
  const supportedTypes = ["image/jpeg", "image/jpg", "image/png", "image/tiff"];
  if (!supportedTypes.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }

  // ファイル名の検証
  if (!file.name) {
    throw new Error("Invalid file: file name is empty");
  }

  try {
    logger.debug("EXIF解析開始:", {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });

    // Server ActionではFileオブジェクトをArrayBufferに変換してからexifrに渡す
    const arrayBuffer = await file.arrayBuffer();
    logger.debug("ArrayBuffer変換完了:", {
      byteLength: arrayBuffer.byteLength,
    });

    // exifrのオプション設定で必要なフィールドのみ取得
    const exifOptions = {
      tiff: true, // TIFFタグを有効（Make, Model情報のため）
      exif: true, // EXIFタグを有効
      gps: false, // GPSタグを無効（プライバシー考慮）
      interop: false, // 相互運用性タグを無効
      ifd1: false, // サムネイル用のIFD1を無効
      sanitize: true, // データをサニタイズ
      mergeOutput: true, // 出力をマージ
      silentErrors: false, // エラーを黙認しない
    };

    const exifData = await parse(arrayBuffer, exifOptions);
    logger.debug("exifr.parse結果:", exifData);

    if (!exifData) {
      logger.info("EXIF情報なし: exifDataがnull/undefined");
      return {};
    }

    // EXIFデータを共通形式に変換
    const result: ExifData = {};

    // デバッグ用：利用可能なEXIFフィールドをすべて表示
    logger.debug("利用可能なEXIFフィールド:", Object.keys(exifData));

    // メーカー（Make / Manufacturer）
    if (exifData.Make) {
      result.make = exifData.Make;
      logger.debug("Make:", exifData.Make);
    } else if (exifData.LensMake) {
      // Makeが取得できない場合はLensMakeから補完
      result.make = exifData.LensMake;
      logger.debug("Make (from LensMake):", exifData.LensMake);
    }

    // モデル（Model）
    if (exifData.Model) {
      result.model = exifData.Model;
      logger.debug("Model:", exifData.Model);
    }

    // レンズモデル（LensModel）
    if (exifData.LensModel) {
      result.lensModel = exifData.LensModel;
      logger.debug("LensModel:", exifData.LensModel);
    }

    // F値（FNumber / Aperture）
    if (exifData.FNumber) {
      result.fNumber = `f/${exifData.FNumber}`;
      logger.debug("FNumber:", exifData.FNumber);
    }

    // シャッター速度（ExposureTime）
    if (exifData.ExposureTime) {
      const fraction = convertToFraction(exifData.ExposureTime);
      result.exposureTime = `${fraction}s`;
      logger.debug(
        "ExposureTime:",
        exifData.ExposureTime,
        "→",
        result.exposureTime,
      );
    }

    // ISO感度（ISO / ISOSpeedRatings）
    const iso = exifData.ISO || exifData.ISOSpeedRatings;
    if (iso) {
      result.iso = iso.toString();
      logger.debug("ISO:", iso);
    }

    // 焦点距離（FocalLength）
    if (exifData.FocalLength) {
      result.focalLength = `${exifData.FocalLength}mm`;
      logger.debug("FocalLength:", exifData.FocalLength);
    }

    logger.debug("変換後のEXIFデータ:", result);
    return result;
  } catch (error) {
    logger.error("EXIF解析エラー:", error);
    logger.debug("エラー詳細:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });
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
