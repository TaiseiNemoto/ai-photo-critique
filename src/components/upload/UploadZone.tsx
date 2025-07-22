"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Camera, Upload, ImageIcon } from "lucide-react"
import type { UploadedImage, ExifData } from "@/types/upload"

interface UploadZoneProps {
  onImageUploaded: (image: UploadedImage) => void
}

export default function UploadZone({ onImageUploaded }: UploadZoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      const preview = URL.createObjectURL(file)

      // Mock EXIF data extraction (in real app, this would be done server-side)
      const mockExif: ExifData = {
        fNumber: "f/2.8",
        exposureTime: "1/250s",
        iso: "ISO 200",
        lensModel: "Sony FE 24-70mm F2.8 GM",
        make: "Sony",
        model: "α7R V",
      }

      onImageUploaded({
        file,
        preview,
        exif: mockExif,
      })
    }
  }, [onImageUploaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".heic", ".webp"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const handleCameraCapture = () => {
    // Mobile camera capture would be implemented here
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.capture = "environment"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        onDrop([file])
      }
    }
    input.click()
  }

  return (
    <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors bg-gray-50/50">
      <CardContent className="p-8">
        <div
          {...getRootProps()}
          className={`text-center cursor-pointer transition-all duration-200 ${isDragActive ? "scale-105" : ""}`}
          role="button"
          tabIndex={0}
          aria-label="画像をアップロード"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              // dropzone内のinputをクリック
              const input = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement
              input?.click()
            }
          }}
        >
          <input {...getInputProps()} />

          {/* Desktop Upload */}
          <div className="hidden md:block">
            <div className="mx-auto w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 border border-gray-200 shadow-sm">
              <Upload className="h-12 w-12 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {isDragActive ? "画像をドロップしてください" : "画像をドラッグ&ドロップ"}
            </h3>
            <p className="text-gray-500 mb-6">または、クリックしてファイルを選択</p>
          </div>

          {/* Mobile Upload */}
          <div className="md:hidden">
            <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 border border-gray-200 shadow-sm">
              <Camera className="h-10 w-10 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">写真を撮影またはアップロード</h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              onClick={(e) => {
                e.stopPropagation()
                handleCameraCapture()
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

          <p className="text-xs text-gray-400 mt-4">対応形式: JPEG, PNG, HEIC, WebP (最大10MB)</p>
        </div>
      </CardContent>
    </Card>
  )
}