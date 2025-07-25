"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, ImageIcon, Sparkles, ArrowRight } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface ExifData {
  fNumber?: string;
  exposureTime?: string;
  iso?: string;
  lensModel?: string;
  make?: string;
  model?: string;
}

interface UploadedImage {
  file: File;
  preview: string;
  exif?: ExifData;
}

export default function UploadPage() {
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(
    null,
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const preview = URL.createObjectURL(file);

      // Mock EXIF data extraction (in real app, this would be done server-side)
      const mockExif: ExifData = {
        fNumber: "f/2.8",
        exposureTime: "1/250s",
        iso: "ISO 200",
        lensModel: "Sony FE 24-70mm F2.8 GM",
        make: "Sony",
        model: "α7R V",
      };

      setUploadedImage({
        file,
        preview,
        exif: mockExif,
      });

      toast.success("画像をアップロードしました", {
        description: "EXIF情報を解析中...",
        duration: 2000,
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".heic", ".webp"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDropRejected: (fileRejections) => {
      const rejection = fileRejections[0];
      if (rejection) {
        const error = rejection.errors[0];
        if (error?.code === "file-too-large") {
          toast.error("ファイルサイズが大きすぎます", {
            description: "10MB以下の画像を選択してください",
            duration: 4000,
          });
        } else if (error?.code === "file-invalid-type") {
          toast.error("対応していないファイル形式です", {
            description: "JPEG、PNG、HEIC、WebP形式の画像を選択してください",
            duration: 4000,
          });
        }
      }
    },
  });

  const handleCameraCapture = () => {
    // Mobile camera capture would be implemented here
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
  };

  const handleGenerateCritique = async () => {
    if (!uploadedImage) return;

    setIsProcessing(true);

    toast.loading("AI講評を生成中...", {
      description: "技術・構図・色彩を分析しています",
      duration: 2000,
    });

    // In real app, this would call the critique API
    setTimeout(() => {
      toast.success("講評が完了しました", {
        description: "結果ページに移動します",
        duration: 1500,
      });

      setTimeout(() => {
        window.location.href = "/report/demo";
      }, 1500);
    }, 2000);
  };

  const resetUpload = () => {
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage.preview);
    }
    setUploadedImage(null);

    toast("画像をリセットしました", {
      description: "新しい画像を選択してください",
      duration: 2000,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200 shadow-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-8 w-8 text-gray-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                Photo-Critique
              </h1>
            </div>
            <p className="text-lg text-gray-700 mb-2">
              あなたの写真を数秒でAI講評
            </p>
            <p className="text-sm text-gray-500">
              技術・構図・色彩の3つの観点から、プロレベルのフィードバックを瞬時に取得
            </p>
          </div>

          {!uploadedImage ? (
            /* Upload Zone */
            <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors bg-gray-50/50">
              <CardContent className="p-8">
                <div
                  {...getRootProps()}
                  className={`text-center cursor-pointer transition-all duration-200 ${isDragActive ? "scale-105" : ""}`}
                >
                  <input {...getInputProps()} />

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
                      className="w-full sm:w-auto bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
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
                      className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white border-0"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      ファイルを選択
                    </Button>
                  </div>

                  <p className="text-xs text-gray-400 mt-4">
                    対応形式: JPEG, PNG, HEIC, WebP (最大10MB)
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Preview & EXIF */
            <div className="space-y-6">
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      プレビュー
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetUpload}
                      className="text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                    >
                      別の画像を選択
                    </Button>
                  </div>

                  <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4 border border-gray-200">
                    <Image
                      src={uploadedImage.preview || "/placeholder.svg"}
                      alt="アップロード画像"
                      fill
                      className="object-contain"
                    />
                  </div>

                  {/* EXIF Summary */}
                  {uploadedImage.exif && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        撮影情報
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {uploadedImage.exif.fNumber && (
                          <Badge
                            variant="secondary"
                            className="bg-white text-gray-700 border-gray-300"
                          >
                            {uploadedImage.exif.fNumber}
                          </Badge>
                        )}
                        {uploadedImage.exif.exposureTime && (
                          <Badge
                            variant="secondary"
                            className="bg-white text-gray-700 border-gray-300"
                          >
                            {uploadedImage.exif.exposureTime}
                          </Badge>
                        )}
                        {uploadedImage.exif.iso && (
                          <Badge
                            variant="secondary"
                            className="bg-white text-gray-700 border-gray-300"
                          >
                            {uploadedImage.exif.iso}
                          </Badge>
                        )}
                        {uploadedImage.exif.lensModel && (
                          <Badge
                            variant="secondary"
                            className="hidden sm:inline-flex bg-white text-gray-700 border-gray-300"
                          >
                            {uploadedImage.exif.lensModel}
                          </Badge>
                        )}
                      </div>
                      {uploadedImage.exif.make && uploadedImage.exif.model && (
                        <p className="text-xs text-gray-500 mt-2">
                          {uploadedImage.exif.make} {uploadedImage.exif.model}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Generate Button */}
              <div className="text-center">
                <Button
                  size="lg"
                  onClick={handleGenerateCritique}
                  disabled={isProcessing}
                  className="bg-gray-900 text-white hover:bg-gray-800 px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 border-0"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      AI講評を生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      講評を生成する
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>
                <p className="text-sm text-gray-500 mt-3">
                  通常2-3秒で完了します
                </p>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-200 shadow-sm">
                <span className="text-gray-700 font-bold">技</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">技術面</h4>
              <p className="text-sm text-gray-600">
                露出・ピント・ノイズなどの技術的評価
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-200 shadow-sm">
                <span className="text-gray-700 font-bold">構</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">構図</h4>
              <p className="text-sm text-gray-600">
                三分割法・対称性・視線誘導の分析
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-200 shadow-sm">
                <span className="text-gray-700 font-bold">色</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">色彩</h4>
              <p className="text-sm text-gray-600">
                色調・彩度・コントラストの評価
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
