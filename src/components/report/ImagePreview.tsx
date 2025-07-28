import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

interface ImagePreviewProps {
  src: string;
  alt?: string;
}

export function ImagePreview({
  src,
  alt = "分析対象の写真",
}: ImagePreviewProps) {
  return (
    <Card className="mb-8 bg-white border-gray-200 shadow-sm">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          分析対象画像
        </h3>
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
          <Image src={src} alt={alt} fill className="object-cover" />
        </div>
      </CardContent>
    </Card>
  );
}
