export interface ExifData {
  make?: string;         // カメラメーカー
  model?: string;        // カメラ機種
  lensModel?: string;    // レンズ名
  fNumber?: string;      // F値
  exposureTime?: string; // シャッター速度
  iso?: string;          // ISO感度
  focalLength?: string;  // 焦点距離
}

export interface UploadedImage {
  file: File;
  preview: string;
  exif?: ExifData;
}
