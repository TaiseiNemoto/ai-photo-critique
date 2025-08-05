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
  data?: CritiqueData;
  error?: string;
  processingTime?: number; // デバッグ用
}

export interface UploadedImage {
  file: File;
  preview: string;
  exif?: ExifData;
  critique?: CritiqueData; // 新規追加
}
