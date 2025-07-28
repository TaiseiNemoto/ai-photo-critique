import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ExifData {
  fNumber: string;
  exposureTime: string;
  iso: string;
  focalLength: string;
  lens: string;
  camera: string;
}

interface ExifDetailsProps {
  exif: ExifData;
}

export function ExifDetails({ exif }: ExifDetailsProps) {
  return (
    <Card className="mb-8 bg-white border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-gray-800">撮影情報</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">絞り値</span>
            <p className="font-medium text-gray-900">{exif.fNumber}</p>
          </div>
          <div>
            <span className="text-gray-500">シャッター速度</span>
            <p className="font-medium text-gray-900">{exif.exposureTime}</p>
          </div>
          <div>
            <span className="text-gray-500">ISO感度</span>
            <p className="font-medium text-gray-900">{exif.iso}</p>
          </div>
          <div>
            <span className="text-gray-500">焦点距離</span>
            <p className="font-medium text-gray-900">{exif.focalLength}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <strong>レンズ:</strong> {exif.lens}
            <br />
            <strong>カメラ:</strong> {exif.camera}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
