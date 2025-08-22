"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCritique } from "@/contexts/CritiqueContext";
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

export default function ReportPage({ params }: ReportPageProps) {
  const router = useRouter();
  const { currentCritique, hasCritiqueData } = useCritique();
  const [id, setId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getParams() {
      const resolvedParams = await params;
      setId(resolvedParams.id);

      // idが"current"の場合はContext APIからデータを取得
      if (resolvedParams.id === "current") {
        if (!hasCritiqueData) {
          // Context APIにデータがない場合はメインページにリダイレクト
          router.push("/");
          return;
        }
      }
      setIsLoading(false);
    }

    getParams();
  }, [params, hasCritiqueData, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center" role="status" aria-live="polite">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"
            aria-hidden="true"
          ></div>
          <p className="text-gray-600">講評データを読み込み中...</p>
        </div>
      </div>
    );
  }

  // idが"current"の場合はContext APIからデータを使用
  if (id === "current" && currentCritique) {
    const { image, critique } = currentCritique;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <main
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200 shadow-xl"
            role="main"
          >
            <ReportHeader />

            <ImagePreview src={image.preview} />

            <div className="space-y-6 mb-8">
              <CritiqueCard
                title="技術面"
                icon="技"
                content={critique.technique}
              />
              <CritiqueCard
                title="構図"
                icon="構"
                content={critique.composition}
              />
              <CritiqueCard title="色彩" icon="色" content={critique.color} />
            </div>

            {image.exif && <ExifDetails exif={image.exif} />}

            <ReportActions reportId="current" />
          </main>
        </div>
      </div>
    );
  }

  // その他のidの場合は従来のモックデータを使用（将来的にはVercel KVから取得）
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
        <main
          className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200 shadow-xl"
          role="main"
        >
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
        </main>
      </div>
    </div>
  );
}
