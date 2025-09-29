import type { AppError } from "./error";
import type { CritiqueData } from "@/lib/kv";

export type { CritiqueData };

// 講評のみを扱う場合の型（CritiqueDataから必要なプロパティを抽出）
export type CritiqueContent = Pick<
  CritiqueData,
  "technique" | "composition" | "color" | "overall"
>;

export interface ExifData {
  make?: string; // カメラメーカー
  model?: string; // カメラ機種
  lensModel?: string; // レンズ名
  fNumber?: string; // F値
  exposureTime?: string; // シャッター速度
  iso?: string; // ISO感度
  focalLength?: string; // 焦点距離
}

export interface CritiqueResult {
  success: boolean;
  data?: CritiqueContent & {
    shareId?: string;
  };
  error?: string | AppError;
  processingTime?: number;
}

// フロントエンド用のアップロード画像型（既存のコンポーネント用）
export interface UploadedImage {
  file: File;
  preview: string;
  exif?: ExifData;
  critique?: CritiqueContent;
}

// FormData付きのアップロード画像型（EXIF最適化用）
export interface UploadedImageWithFormData extends UploadedImage {
  formData: FormData;
}

// API用の処理済み画像型
export interface ProcessedImageData {
  dataUrl: string;
  originalSize: number;
  processedSize: number;
}
