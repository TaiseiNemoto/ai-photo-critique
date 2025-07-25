"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

interface ReportPageProps {
  params: {
    id: string;
  };
}

export default function ReportPage({ params }: ReportPageProps) {
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

  const handleShare = async () => {
    try {
      // Generate share URL using the report ID
      const shareUrl = `${window.location.origin}/s/${params.id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("シェア用リンクをコピーしました", {
        description: "SNSやメッセージアプリで共有できます",
        duration: 3000,
      });
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      toast.error("コピーに失敗しました", {
        description: "手動でURLをコピーしてください",
        duration: 5000,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Link
              href="/"
              className="flex items-center text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-gray-600" />
              <span className="font-bold text-gray-900">Photo-Critique</span>
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
                  src={reportData.image}
                  alt="分析対象の写真"
                  fill
                  className="object-cover"
                />
              </div>
            </CardContent>
          </Card>

          {/* Critique Cards */}
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
                  {reportData.technical}
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
                  {reportData.composition}
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
                  {reportData.color}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* EXIF Details */}
          <Card className="mb-8 bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-800">撮影情報</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">絞り値</span>
                  <p className="font-medium text-gray-900">
                    {reportData.exif.fNumber}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">シャッター速度</span>
                  <p className="font-medium text-gray-900">
                    {reportData.exif.exposureTime}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">ISO感度</span>
                  <p className="font-medium text-gray-900">
                    {reportData.exif.iso}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">焦点距離</span>
                  <p className="font-medium text-gray-900">
                    {reportData.exif.focalLength}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <strong>レンズ:</strong> {reportData.exif.lens}
                  <br />
                  <strong>カメラ:</strong> {reportData.exif.camera}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleShare}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white"
            >
              <Share2 className="h-4 w-4" />
              シェア用リンクをコピー
            </Button>
            <Button
              variant="outline"
              asChild
              className="text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900 bg-white"
            >
              <Link href="/">別の写真を試す</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
