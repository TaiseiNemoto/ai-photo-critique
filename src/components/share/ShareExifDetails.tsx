import { ExifDetails } from "@/components/report/ExifDetails";

interface ExifData {
  fNumber: string;
  exposureTime: string;
  iso: string;
  focalLength: string;
  lens: string;
  camera: string;
}

interface ShareExifDetailsProps {
  exif?: ExifData | null;
}

export function ShareExifDetails({ exif }: ShareExifDetailsProps) {
  return <ExifDetails exif={exif} />;
}
