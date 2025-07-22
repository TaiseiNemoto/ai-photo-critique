import { Sparkles } from "lucide-react"

export default function AppHeader() {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center gap-2 mb-4">
        <Sparkles className="h-8 w-8 text-gray-600" />
        <h1 className="text-3xl font-bold text-gray-900">Photo-Critique</h1>
      </div>
      <p className="text-lg text-gray-700 mb-2">あなたの写真を数秒でAI講評</p>
      <p className="text-sm text-gray-500">
        技術・構図・色彩の3つの観点から、プロレベルのフィードバックを瞬時に取得
      </p>
    </div>
  )
}