"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { extractExifDataClient } from "@/lib/exif-client";
import type { UploadedImage } from "@/types/upload";

interface UploadZoneProps {
  onImageUploaded: (image: UploadedImage) => void;
}

/**
 * エラーメッセージの定数定義
 */
const ERROR_MESSAGES = {
  UPLOAD_FAILED: "画像の処理に失敗しました",
  UNKNOWN_ERROR: "不明なエラーが発生しました",
  NETWORK_ERROR: "ネットワークエラーまたはサーバーエラーが発生しました",
  FILE_TOO_LARGE: "ファイルサイズが大きすぎます",
  FILE_TOO_LARGE_DESC: "10MB以下の画像を選択してください",
  INVALID_FILE_TYPE: "対応していないファイル形式です",
  INVALID_FILE_TYPE_DESC: "JPEG、PNG、HEIC、WebP形式の画像を選択してください",
} as const;

/**
 * 画像ファイルをクライアントサイドでプレビュー処理する関数
 */
const processImageFile = async (
  file: File,
  onSuccess: (image: UploadedImage) => void,
  onError: (error: string) => void,
): Promise<void> => {
  try {
    // クライアントサイドでプレビュー作成
    const preview = URL.createObjectURL(file);

    // クライアントサイドでEXIF抽出
    const exifData = await extractExifDataClient(file);

    // 成功時: プレビュー画像とEXIF情報を返す
    onSuccess({
      file,
      preview,
      exif: exifData,
    });
  } catch (error) {
    console.error("Client-side processing error:", error);
    onError(ERROR_MESSAGES.UNKNOWN_ERROR);
  }
};

/**
 * エラー処理用のトースト表示関数
 */
const showErrorToast = (message: string, description?: string): void => {
  toast.error(message, {
    description: description || ERROR_MESSAGES.UNKNOWN_ERROR,
    duration: 4000,
  });
};

export default function UploadZone({ onImageUploaded }: UploadZoneProps) {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setIsUploading(true);

      try {
        await processImageFile(file, onImageUploaded, (error) =>
          showErrorToast(ERROR_MESSAGES.UPLOAD_FAILED, error),
        );
      } catch (error) {
        console.error("Upload error:", error);
        showErrorToast(
          ERROR_MESSAGES.UPLOAD_FAILED,
          ERROR_MESSAGES.NETWORK_ERROR,
        );
      } finally {
        setIsUploading(false);
      }
    },
    [onImageUploaded],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".heic", ".webp"],
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024, // 20MB
    onDropRejected: (fileRejections) => {
      const rejection = fileRejections[0];
      if (!rejection) return;

      const error = rejection.errors[0];
      if (error?.code === "file-too-large") {
        showErrorToast(
          ERROR_MESSAGES.FILE_TOO_LARGE,
          "20MB以下の画像を選択してください",
        );
      } else if (error?.code === "file-invalid-type") {
        showErrorToast(
          ERROR_MESSAGES.INVALID_FILE_TYPE,
          ERROR_MESSAGES.INVALID_FILE_TYPE_DESC,
        );
      }
    },
  });

  /**
   * モバイルカメラキャプチャ機能
   */
  const handleCameraCapture = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        onDrop([file]);
      }
    };
    input.click();
  }, [onDrop]);

  return (
    <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors bg-gray-50/50">
      <CardContent className="p-8 relative">
        <div
          {...getRootProps()}
          className={`text-center cursor-pointer transition-all duration-200 ${isDragActive ? "scale-105" : ""}`}
          role="button"
          tabIndex={0}
          aria-label="画像をアップロード"
          aria-describedby="upload-instructions"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              // dropzone内のinputをクリック
              const input = e.currentTarget.querySelector(
                'input[type="file"]',
              ) as HTMLInputElement;
              input?.click();
            }
          }}
        >
          <input {...getInputProps()} disabled={isUploading} />

          {/* ローディング表示 */}
          {isUploading && (
            <div
              className="absolute inset-0 bg-white/80 flex items-center justify-center z-10"
              aria-live="polite"
            >
              <div className="text-center">
                <Loader2
                  className="h-8 w-8 animate-spin text-gray-600 mx-auto mb-2"
                  data-testid="loading-spinner"
                  aria-hidden="true"
                />
                <p className="text-sm text-gray-600" role="status">
                  画像を処理中...
                </p>
              </div>
            </div>
          )}

          {/* Desktop Upload */}
          <div className="hidden md:block">
            <div className="mx-auto w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 border border-gray-200 shadow-sm">
              <Upload className="h-12 w-12 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {isDragActive
                ? "画像をドロップしてください"
                : "画像をドラッグ&ドロップ"}
            </h3>
            <p className="text-gray-500 mb-6">
              または、クリックしてファイルを選択
            </p>
          </div>

          {/* Mobile Upload */}
          <div className="md:hidden">
            <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 border border-gray-200 shadow-sm">
              <Camera className="h-10 w-10 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              写真を撮影またはアップロード
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100 min-h-[44px] touch-manipulation active:scale-95 transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                handleCameraCapture();
              }}
            >
              <Camera className="h-4 w-4 mr-2" />
              撮影してアップロード
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 active:bg-gray-950 text-white border-0 min-h-[44px] touch-manipulation active:scale-95 transition-transform"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              ファイルを選択
            </Button>
          </div>

          <p id="upload-instructions" className="text-xs text-gray-400 mt-4">
            対応形式: JPEG, PNG, HEIC, WebP (最大20MB)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
