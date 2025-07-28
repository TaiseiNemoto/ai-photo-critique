import { Sparkles } from "lucide-react";

export function ShareHeader() {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center gap-2 mb-4">
        <Sparkles className="h-8 w-8 text-gray-600" />
        <h1 className="text-3xl font-bold text-gray-900">Photo-Critique</h1>
      </div>
      <p className="text-lg text-gray-700 mb-2">AI写真講評結果</p>
      <p className="text-sm text-gray-500">
        技術・構図・色彩の3つの観点から分析されました
      </p>
    </div>
  );
}
