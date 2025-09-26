"use client";

import { useUploadService } from "@/services/upload-service";
import AppHeader from "@/components/common/AppHeader";
import UploadZone from "@/components/upload/UploadZone";
import ImagePreview from "@/components/upload/ImagePreview";
import GenerateButton from "@/components/upload/GenerateButton";

export default function UploadPage() {
  const uploadService = useUploadService();

  return (
    <div className="mobile-viewport bg-gray-50 scroll-smooth">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-4xl">
        <main
          className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-gray-200 shadow-xl gpu-accelerated tap-highlight-none"
          role="main"
        >
          <AppHeader />

          {!uploadService.state.uploadedImage ? (
            <UploadZone onImageUploaded={uploadService.uploadImage} />
          ) : (
            <div className="space-y-6">
              <ImagePreview
                uploadedImage={uploadService.state.uploadedImage}
                onReset={uploadService.resetUpload}
              />
              <GenerateButton
                isProcessing={uploadService.state.isProcessing}
                onGenerate={uploadService.generateCritique}
                disabled={!uploadService.state.uploadedImage}
                critiqueStatus={uploadService.state.critique.status}
                critiqueError={uploadService.state.critique.error}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
