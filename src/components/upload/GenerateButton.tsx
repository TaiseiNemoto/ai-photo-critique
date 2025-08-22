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
  const showSuccess = critiqueStatus === "success";

  const getButtonText = () => {
    if (isProcessing) return "AI講評を生成中...";
    if (showSuccess) return "講評完了！";
    return "講評を生成する";
  };

  const getButtonIcon = () => {
    if (isProcessing) {
      return (
        <div
          className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"
          data-testid="loading-spinner"
        ></div>
      );
    }
    if (showSuccess) {
      return (
        <ArrowRight className="h-5 w-5 mr-2" data-testid="arrow-right-icon" />
      );
    }
    return <Sparkles className="h-5 w-5 mr-2" data-testid="sparkles-icon" />;
  };

  const getStatusMessage = () => {
    if (showError) {
      return (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600 font-medium">
            エラーが発生しました
          </p>
          <p className="text-sm text-red-500 mt-1">{critiqueError}</p>
        </div>
      );
    }
    if (showSuccess) {
      return (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600 font-medium">
            講評が正常に生成されました
          </p>
          <p className="text-sm text-green-500 mt-1">
            結果ページに移動します...
          </p>
        </div>
      );
    }
    if (isProcessing) {
      return (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">
            AI講評を生成しています
          </p>
          <p className="text-sm text-blue-500 mt-1">
            技術・構図・色彩を分析中...
          </p>
        </div>
      );
    }
    return <p className="text-sm text-gray-500 mt-3">通常2-3秒で完了します</p>;
  };

  return (
    <div className="text-center">
      <Button
        size="lg"
        onClick={onGenerate}
        disabled={isProcessing || disabled || showSuccess}
        aria-describedby="generate-status"
        aria-live={isProcessing ? "polite" : undefined}
        className={`
          px-6 sm:px-8 py-4 sm:py-3 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl 
          transition-all duration-200 border-0 w-full sm:w-auto min-h-[44px] active:scale-95 touch-manipulation
          ${
            showSuccess
              ? "bg-green-600 text-white hover:bg-green-700 active:bg-green-800"
              : showError
                ? "bg-red-600 text-white hover:bg-red-700 active:bg-red-800"
                : "bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-950"
          }
        `}
      >
        {getButtonIcon()}
        {getButtonText()}
        {!isProcessing && !showSuccess && (
          <ArrowRight className="h-5 w-5 ml-2" />
        )}
      </Button>

      <div id="generate-status">{getStatusMessage()}</div>
    </div>
  );
}
