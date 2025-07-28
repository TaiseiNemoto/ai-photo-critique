import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

export function ReportHeader() {
  return (
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
  );
}
