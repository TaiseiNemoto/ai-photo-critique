import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Camera } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
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
  params: {
    id: string;
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function SharePage({ params }: SharePageProps) {
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
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-8 w-8 text-gray-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                Photo-Critique
              </h1>
            </div>
            <p className="text-lg text-gray-700 mb-2">AI写真講評結果</p>
            <p className="text-sm text-gray-500">
              技術・構図・色彩の3つの観点から分析されました
            </p>
          </div>

          {/* Shared Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium border border-gray-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              シェアされた講評結果
            </div>
          </div>

          {/* Image Preview */}
          <Card className="mb-8 bg-white border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                分析対象画像
              </h3>
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                <Image
                  src={critiqueData.image || "/placeholder.svg"}
                  alt="分析対象の写真"
                  fill
                  className="object-cover"
                />
              </div>
            </CardContent>
          </Card>

          {/* Critique Cards - Read Only */}
          <div className="space-y-6 mb-8">
            <Card className="border-l-4 border-l-gray-400 bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold border border-gray-200">
                    技
                  </span>
                  技術面
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {critiqueData.technical}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-gray-400 bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold border border-gray-200">
                    構
                  </span>
                  構図
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {critiqueData.composition}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-gray-400 bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold border border-gray-200">
                    色
                  </span>
                  色彩
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {critiqueData.color}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* EXIF Details - Read Only */}
          <Card className="mb-8 bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-800">撮影情報</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">絞り値</span>
                  <p className="font-medium text-gray-900">
                    {critiqueData.exif.fNumber}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">シャッター速度</span>
                  <p className="font-medium text-gray-900">
                    {critiqueData.exif.exposureTime}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">ISO感度</span>
                  <p className="font-medium text-gray-900">
                    {critiqueData.exif.iso}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">焦点距離</span>
                  <p className="font-medium text-gray-900">
                    {critiqueData.exif.focalLength}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <strong>レンズ:</strong> {critiqueData.exif.lens}
                  <br />
                  <strong>カメラ:</strong> {critiqueData.exif.camera}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <div className="text-center">
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border border-gray-200 shadow-sm">
                  <Camera className="h-8 w-8 text-gray-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                あなたの写真も講評してみませんか？
              </h3>
              <p className="text-gray-600 mb-6">
                数秒でプロレベルのフィードバックを受け取れます
              </p>
              <Button
                asChild
                size="lg"
                className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 text-lg font-semibold"
              >
                <Link href="/">
                  <Camera className="h-5 w-5 mr-2" />
                  自分も試す
                </Link>
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Powered by{" "}
              <Link
                href="/"
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Photo-Critique
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
