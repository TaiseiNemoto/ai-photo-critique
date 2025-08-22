"use client";

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface ReportActionsProps {
  reportId: string;
}

export function ReportActions({ reportId }: ReportActionsProps) {
  const handleShare = async () => {
    // Context API版では一時的なデータのため、シェア機能は制限
    if (reportId === "current") {
      toast.error("シェア機能は準備中です", {
        description: "現在の講評結果は一時的なもののため、シェアできません",
        duration: 3000,
      });
      return;
    }

    try {
      const shareUrl = `${window.location.origin}/s/${reportId}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("シェア用リンクをコピーしました", {
        description: "SNSやメッセージアプリで共有できます",
        duration: 3000,
      });
    } catch (error) {
      console.error("Clipboard API failed:", error);
      toast.error("コピーに失敗しました", {
        description: "手動でURLをコピーしてください",
        duration: 5000,
      });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Button
        onClick={handleShare}
        className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 active:bg-gray-950 text-white min-h-[44px] touch-manipulation active:scale-95 transition-transform"
        disabled={reportId === "current"}
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
