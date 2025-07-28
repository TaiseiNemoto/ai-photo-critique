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
  );
}