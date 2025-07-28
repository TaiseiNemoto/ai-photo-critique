import { ReportHeader } from "@/components/report/ReportHeader";
import { ImagePreview } from "@/components/report/ImagePreview";
import { CritiqueCard } from "@/components/report/CritiqueCard";
import { ExifDetails } from "@/components/report/ExifDetails";
import { ReportActions } from "@/components/report/ReportActions";

interface ReportPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = await params;
  // In real app, this would fetch data based on params.id from Vercel KV
  // For now, using mock data
  const reportData = {
    image: "/placeholder.svg?height=400&width=600",
    technical:
      "• ピントは被写体の目にしっかりと合っており、シャープネスも適切です\n• 露出は全体的にバランスが取れており、ハイライトの飛びやシャドウの潰れもありません\n• ISO感度の設定も適切で、ノイズは最小限に抑えられています",
    composition:
      "• 三分割法の交点に被写体を配置し、安定感のある構図になっています\n• 前景・中景・背景の奥行き感が効果的に表現されています\n• 視線の流れが自然で、被写体への注目を促す構成です",
    color:
      "• 補色関係が効果的に活用され、被写体が際立っています\n• 全体的な色調は統一感があり、温かみのある印象を与えます\n• 彩度とコントラストのバランスが良く、自然な仕上がりです",
    exif: {
      fNumber: "f/2.8",
      exposureTime: "1/250s",
      iso: "200",
      focalLength: "35mm",
      lens: "Sony FE 24-70mm F2.8 GM",
      camera: "Sony α7R V",
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200 shadow-xl">
          <ReportHeader />

          <ImagePreview src={reportData.image} />

          <div className="space-y-6 mb-8">
            <CritiqueCard
              title="技術面"
              icon="技"
              content={reportData.technical}
            />
            <CritiqueCard
              title="構図"
              icon="構"
              content={reportData.composition}
            />
            <CritiqueCard title="色彩" icon="色" content={reportData.color} />
          </div>

          <ExifDetails exif={reportData.exif} />

          <ReportActions reportId={id} />
        </div>
      </div>
    </div>
  );
}
