import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import type { UploadedImage } from "@/types/upload";
import ExifDisplay from "./ExifDisplay";

interface ImagePreviewProps {
  uploadedImage: UploadedImage;
  onReset: () => void;
}

export default function ImagePreview({
  uploadedImage,
  onReset,
}: ImagePreviewProps) {
  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">プレビュー</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
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
        {uploadedImage.exif && <ExifDisplay exif={uploadedImage.exif} />}
      </CardContent>
    </Card>
  );
}
