import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { ExifData } from "@/types/upload";

interface ExifDetailsProps {
  exif?: ExifData | null;
}

export function ExifDetails({ exif }: ExifDetailsProps) {
  // exifデータが存在しない場合は何も表示しない
  if (!exif) {
    return null;
  }
  return (
    <Card className="mb-8 bg-white border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-gray-800">撮影情報</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">絞り値</span>
            <p className="font-medium text-gray-900">
              {exif.fNumber || "不明"}
            </p>
          </div>
          <div>
            <span className="text-gray-500">シャッター速度</span>
            <p className="font-medium text-gray-900">
              {exif.exposureTime || "不明"}
            </p>
          </div>
          <div>
            <span className="text-gray-500">ISO感度</span>
            <p className="font-medium text-gray-900">{exif.iso || "不明"}</p>
          </div>
          <div>
            <span className="text-gray-500">焦点距離</span>
            <p className="font-medium text-gray-900">
              {exif.focalLength || "不明"}
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <strong>レンズ:</strong> {exif.lensModel || "不明"}
            <br />
            <strong>カメラ:</strong>{" "}
            {exif.make && exif.model ? `${exif.make} ${exif.model}` : "不明"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
