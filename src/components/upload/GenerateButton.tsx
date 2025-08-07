"use client";

import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";

interface GenerateButtonProps {
  isProcessing: boolean;
  onGenerate: () => void;
  disabled?: boolean;
  critiqueStatus?: "idle" | "loading" | "success" | "error";
  critiqueError?: string;
}

export default function GenerateButton({
  isProcessing,
  onGenerate,
  disabled,
  critiqueStatus = "idle",
  critiqueError,
}: GenerateButtonProps) {
  const showError = critiqueStatus === "error" && critiqueError;

  return (
    <div className="text-center">
      <Button
        size="lg"
        onClick={onGenerate}
        disabled={isProcessing || disabled}
        className="bg-gray-900 text-white hover:bg-gray-800 px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 border-0"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
            AI講評を生成中...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5 mr-2" />
            講評を生成する
            <ArrowRight className="h-5 w-5 ml-2" />
          </>
        )}
      </Button>

      {showError ? (
        <p className="text-sm text-red-500 mt-3">エラー: {critiqueError}</p>
      ) : (
        <p className="text-sm text-gray-500 mt-3">通常2-3秒で完了します</p>
      )}
    </div>
  );
}
