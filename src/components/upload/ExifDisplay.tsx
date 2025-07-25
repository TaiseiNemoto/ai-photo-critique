import { Badge } from "@/components/ui/badge";
import type { ExifData } from "@/types/upload";

interface ExifDisplayProps {
  exif: ExifData;
}

export default function ExifDisplay({ exif }: ExifDisplayProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <h4 className="text-sm font-medium text-gray-700 mb-3">撮影情報</h4>
      <div className="flex flex-wrap gap-2">
        {exif.fNumber && (
          <Badge
            variant="secondary"
            className="bg-white text-gray-700 border-gray-300"
          >
            {exif.fNumber}
          </Badge>
        )}
        {exif.exposureTime && (
          <Badge
            variant="secondary"
            className="bg-white text-gray-700 border-gray-300"
          >
            {exif.exposureTime}
          </Badge>
        )}
        {exif.iso && (
          <Badge
            variant="secondary"
            className="bg-white text-gray-700 border-gray-300"
          >
            {exif.iso}
          </Badge>
        )}
        {exif.lensModel && (
          <Badge
            variant="secondary"
            className="hidden sm:inline-flex bg-white text-gray-700 border-gray-300"
          >
            {exif.lensModel}
          </Badge>
        )}
      </div>
      {exif.make && exif.model && (
        <p className="text-xs text-gray-500 mt-2">
          {exif.make} {exif.model}
        </p>
      )}
    </div>
  );
}
