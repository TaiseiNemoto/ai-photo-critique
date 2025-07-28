import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import Link from "next/link";

export function ShareCallToAction() {
  return (
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
  );
}
