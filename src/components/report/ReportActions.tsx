"use client";

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useCritique } from "@/contexts/CritiqueContext";

interface ReportActionsProps {
  reportId: string;
}

export function ReportActions({ reportId }: ReportActionsProps) {
  const { currentCritique } = useCritique();

  const handleShare = async () => {
    try {
      let shareId = reportId;

      // "current"の場合は、まずシェア用IDを生成
      if (reportId === "current" && currentCritique) {
        // 現在の講評データをシェア用に保存
        const response = await fetch("/api/share", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: currentCritique.image,
            critique: currentCritique.critique,
          }),
        });

        if (!response.ok) {
          throw new Error("シェアデータの保存に失敗しました");
        }

        const data = await response.json();
        if (!data.success || !data.shareId) {
          throw new Error(data.error || "シェアIDの生成に失敗しました");
        }

        shareId = data.shareId;
      }

      const shareUrl = `${window.location.origin}/s/${shareId}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("シェア用リンクをコピーしました", {
        description: "SNSやメッセージアプリで共有できます",
        duration: 3000,
      });
    } catch (error) {
      console.error("Share failed:", error);
      toast.error("シェアに失敗しました", {
        description:
          error instanceof Error ? error.message : "再度お試しください",
        duration: 5000,
      });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Button
        onClick={handleShare}
        className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 active:bg-gray-950 text-white min-h-[44px] touch-manipulation active:scale-95 transition-transform"
      >
        <Share2 className="h-4 w-4" data-testid="share-icon" />
        <span className="text-sm sm:text-base">シェア用リンクをコピー</span>
      </Button>
      <Button
        variant="outline"
        asChild
        className="text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100 bg-white min-h-[44px] touch-manipulation active:scale-95 transition-transform"
      >
        <Link href="/" className="flex items-center justify-center">
          <span className="text-sm sm:text-base">別の写真を試す</span>
        </Link>
      </Button>
    </div>
  );
}
