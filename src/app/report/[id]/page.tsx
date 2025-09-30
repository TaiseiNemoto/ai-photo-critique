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

  // idが"current"以外の場合はメインページにリダイレクト
  // 共有ページは /s/[id] を使用
  if (id !== "current") {
    router.push("/");
    return null;
  }

  // currentCritiqueがない場合はメインページにリダイレクト
  if (!currentCritique) {
    router.push("/");
    return null;
  }

  const { image, critique } = currentCritique;

  return (
    <div className="mobile-viewport bg-gray-50 scroll-smooth">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-4xl">
        <main
          className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-gray-200 shadow-xl gpu-accelerated"
          role="main"
        >
          <ReportHeader />

          <ImagePreview src={image.preview} />

          <div className="space-y-6 mb-8 swipe-indicator">
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
