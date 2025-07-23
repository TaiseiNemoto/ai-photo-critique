"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { UploadedImage } from "@/types/upload"
import AppHeader from "@/components/common/AppHeader"
import UploadZone from "@/components/upload/UploadZone"
import ImagePreview from "@/components/upload/ImagePreview"
import GenerateButton from "@/components/upload/GenerateButton"
import FeatureCards from "@/components/common/FeatureCards"

export default function UploadPage() {
  const router = useRouter()
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleImageUploaded = (image: UploadedImage) => {
    setUploadedImage(image)
  }

  const handleGenerateCritique = async () => {
    if (!uploadedImage) return

    setIsProcessing(true)
    // In real app, this would call the critique API
    setTimeout(() => {
      // Generate random ID for the report (in real app, this would come from API)
      const reportId = Math.random().toString(36).substring(2, 10)
      // Navigate to report page using dynamic route
      router.push(`/report/${reportId}`)
    }, 2000)
  }

  const resetUpload = () => {
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage.preview)
    }
    setUploadedImage(null)
  }

  // メモリリーク対策：コンポーネントアンマウント時にURL.revokeObjectURL実行
  useEffect(() => {
    return () => {
      if (uploadedImage) {
        URL.revokeObjectURL(uploadedImage.preview)
      }
    }
  }, [uploadedImage])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200 shadow-xl">
          <AppHeader />

          {!uploadedImage ? (
            <UploadZone onImageUploaded={handleImageUploaded} />
          ) : (
            <div className="space-y-6">
              <ImagePreview uploadedImage={uploadedImage} onReset={resetUpload} />
              <GenerateButton 
                isProcessing={isProcessing}
                onGenerate={handleGenerateCritique}
                disabled={!uploadedImage}
              />
            </div>
          )}

          <FeatureCards />
        </div>
      </div>
    </div>
  )
}
