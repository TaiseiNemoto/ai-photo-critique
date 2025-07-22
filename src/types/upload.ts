export interface ExifData {
  fNumber?: string
  exposureTime?: string
  iso?: string
  lensModel?: string
  make?: string
  model?: string
}

export interface UploadedImage {
  file: File
  preview: string
  exif?: ExifData
}