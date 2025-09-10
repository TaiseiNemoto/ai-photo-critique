export interface ExifData {
  make?: string; // カメラメーカー
  model?: string; // カメラ機種
  lensModel?: string; // レンズ名
  fNumber?: string; // F値
  exposureTime?: string; // シャッター速度
  iso?: string; // ISO感度
  focalLength?: string; // 焦点距離
}

export interface CritiqueData {
  technique: string; // 技術面の講評（50-100文字）
  composition: string; // 構図面の講評（50-100文字）
  color: string; // 色彩面の講評（50-100文字）
  overall?: string; // 総合評価（オプション）
}

export interface CritiqueResult {
  success: boolean;
  data?: CritiqueData & {
    shareId?: string; // 共有用のID
  };
  error?: string;
  processingTime?: number; // デバッグ用
}

// フロントエンド用のアップロード画像型（既存のコンポーネント用）
export interface UploadedImage {
  file: File;
  preview: string;
  exif?: ExifData;
  critique?: CritiqueData;
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
