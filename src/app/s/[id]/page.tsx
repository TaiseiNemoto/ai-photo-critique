import { ImagePreview } from "@/components/report/ImagePreview";
import { ShareHeader } from "@/components/share/ShareHeader";
import { ShareBadge } from "@/components/share/ShareBadge";
import { ShareCritiqueCards } from "@/components/share/ShareCritiqueCards";
import { ShareExifDetails } from "@/components/share/ShareExifDetails";
import { ShareCallToAction } from "@/components/share/ShareCallToAction";
import { ShareFooter } from "@/components/share/ShareFooter";
import type { Metadata } from "next";

// OGP metadata for social sharing
export const metadata: Metadata = {
  title: "AI写真講評結果 - Photo-Critique",
  description:
    "技術・構図・色彩の3つの観点からAIが分析した写真講評結果をご覧ください。",
  openGraph: {
    title: "AI写真講評結果 - Photo-Critique",
    description: "技術・構図・色彩の3つの観点からAIが分析した写真講評結果",
    images: [
      {
        url: "/api/ogp?id=demo", // This would be dynamic in real app
        width: 1200,
        height: 630,
        alt: "Photo-Critique AI講評結果",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI写真講評結果 - Photo-Critique",
    description: "技術・構図・色彩の3つの観点からAIが分析した写真講評結果",
    images: ["/api/ogp?id=demo"],
  },
};

interface SharePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SharePage({ params }: SharePageProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id } = await params;
  // In real app, this would fetch data based on params.id
  const critiqueData = {
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
          <ShareHeader />

          <ShareBadge />

          <ImagePreview
            src={critiqueData.image || "/placeholder.svg"}
            alt="分析対象の写真"
          />

          <ShareCritiqueCards critiqueData={critiqueData} />

          <ShareExifDetails exif={critiqueData.exif} />

          <ShareCallToAction />

          <ShareFooter />
        </div>
      </div>
    </div>
  );
}
