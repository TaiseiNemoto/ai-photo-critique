import { toast } from 'sonner';
import { useUploadState } from './useUploadState';
import { useCritiqueGeneration } from './useCritiqueGeneration';
import type { UploadedImageWithFormData } from '@/types/upload';

export function useUploadFlow() {
  const {
    state,
    formDataRef,
    setUploadedImage,
    setProcessing,
    setCritiqueState,
    resetState,
  } = useUploadState();

  const { generateCritique } = useCritiqueGeneration();

  const handleImageUploaded = (image: UploadedImageWithFormData) => {
    const uploadedImage = {
      file: image.file,
      preview: image.preview,
      exif: image.exif,
    };

    setUploadedImage(uploadedImage);
    setCritiqueState({ status: 'idle' });

    toast.success('画像をアップロードしました', {
      description: 'EXIF情報を解析中...',
      duration: 2000,
    });

    formDataRef.current = image.formData;
  };

  const handleGenerateCritique = async () => {
    if (!state.uploadedImage) return;

    await generateCritique(
      state.uploadedImage,
      formDataRef,
      setProcessing,
      setCritiqueState,
    );
  };

  const resetUpload = () => {
    resetState();
    toast('画像をリセットしました', {
      description: '新しい画像を選択してください',
      duration: 2000,
    });
  };

  return {
    state,
    handleImageUploaded,
    handleGenerateCritique,
    resetUpload,
  };
}