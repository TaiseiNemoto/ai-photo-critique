import { ImagePreview } from "@/components/report/ImagePreview";
import { ShareHeader } from "@/components/share/ShareHeader";
import { ShareBadge } from "@/components/share/ShareBadge";
import { ShareCritiqueCards } from "@/components/share/ShareCritiqueCards";
import { ShareExifDetails } from "@/components/share/ShareExifDetails";
import { ShareCallToAction } from "@/components/share/ShareCallToAction";
import { ShareFooter } from "@/components/share/ShareFooter";
import type { Metadata } from "next";
import Link from "next/link";

// 動的メタデータ生成
export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    // データAPIから共有データを取得
    const response = await fetch(
      `${process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : "http://localhost:3000"}/api/data/${id}`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      // デフォルトメタデータを返す
      return {
        title: "AI写真講評結果 - Photo-Critique",
        description:
          "技術・構図・色彩の3つの観点からAIが分析した写真講評結果をご覧ください。",
      };
    }

    const { data: critiqueData } = await response.json();

    if (!critiqueData) {
      return {
        title: "AI写真講評結果 - Photo-Critique",
        description:
          "技術・構図・色彩の3つの観点からAIが分析した写真講評結果をご覧ください。",
      };
    }

    // EXIF情報から動的にタイトルを生成
    const camera = critiqueData.exif?.camera || "カメラ";
    const lens = critiqueData.exif?.lens || "レンズ";
    const title = `${camera}で撮影した写真のAI講評結果 - Photo-Critique`;
    const description = `${camera}、${lens}で撮影された写真を技術・構図・色彩の3つの観点からAIが分析しました。`;

    // OGP画像URLを動的に生成
    const ogpImageUrl = `/api/ogp?id=${id}`;
    const ogpDetailImageUrl = `/api/ogp?id=${id}&detail=true`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [
          {
            url: ogpImageUrl,
            width: 1200,
            height: 630,
            alt: `${camera}で撮影した写真のAI講評結果`,
          },
          {
            url: ogpDetailImageUrl,
            width: 1200,
            height: 630,
            alt: `${camera}で撮影した写真の詳細AI講評結果`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogpImageUrl],
      },
    };
  } catch (error) {
    console.error("Metadata generation error:", error);

    // エラー時はデフォルトメタデータを返す
    return {
      title: "AI写真講評結果 - Photo-Critique",
      description:
        "技術・構図・色彩の3つの観点からAIが分析した写真講評結果をご覧ください。",
    };
  }
}

interface SharePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const { id } = await params;

  try {
    // データAPIから共有データを取得
    const response = await fetch(
      `${process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : "http://localhost:3000"}/api/data/${id}`,
      {
        cache: "no-store", // 常に最新データを取得
      },
    );

    if (!response.ok) {
      // エラーページを表示
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-4xl">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-gray-200 shadow-xl text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">
                データが見つかりません
              </h1>
              <p className="text-gray-600 mb-6">
                {response.status === 410
                  ? "このデータは期限切れです"
                  : "指定された共有データが見つかりませんでした"}
              </p>
              <Link
                href="/"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                新しい写真を分析する
              </Link>
            </div>
          </div>
        </div>
      );
    }

    const { data: critiqueData } = await response.json();

    if (!critiqueData) {
      throw new Error("Invalid data format");
    }

    return (
      <div className="mobile-viewport bg-gray-50 scroll-smooth">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-4xl safe-area-inset">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-gray-200 shadow-xl gpu-accelerated tap-highlight-none">
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
  } catch (error) {
    console.error("Share page error:", error);

    // エラーページを表示
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-4xl">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-gray-200 shadow-xl text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              エラーが発生しました
            </h1>
            <p className="text-gray-600 mb-6">
              データの取得中にエラーが発生しました。時間をおいて再度お試しください。
            </p>
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              新しい写真を分析する
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
