import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCritique } from '@/contexts/CritiqueContext';
import { uploadImageWithCritique } from '@/app/actions';
import type { UploadedImage } from '@/types/upload';
import type { UploadState } from './useUploadState';

// 定数化
const TIMING = {
  TOAST_SUCCESS_DURATION: 1500,
  TOAST_INFO_DURATION: 2000,
  TOAST_ERROR_DURATION: 3000,
  NAVIGATION_DELAY: 1500,
} as const;

const MESSAGES = {
  CRITIQUE_LOADING: 'AI講評を生成中...',
  CRITIQUE_LOADING_DESC: '技術・構図・色彩を分析しています',
  CRITIQUE_SUCCESS: '講評が完了しました',
  CRITIQUE_SUCCESS_DESC: '結果ページに移動します',
  CRITIQUE_ERROR: '講評生成に失敗しました',
  CRITIQUE_NETWORK_ERROR: 'ネットワークエラーが発生しました',
  CRITIQUE_NETWORK_DESC: 'ネットワーク接続を確認してください',
} as const;

export function useCritiqueGeneration() {
  const router = useRouter();
  const { setCritiqueData } = useCritique();

  const generateCritique = async (
    uploadedImage: UploadedImage,
    formDataRef: React.RefObject<FormData | null>,
    onProcessingChange: (processing: boolean) => void,
    onCritiqueStateChange: (state: UploadState['critique']) => void,
  ) => {
    onProcessingChange(true);
    onCritiqueStateChange({ status: 'loading' });

    const loadingToastId = toast.loading(MESSAGES.CRITIQUE_LOADING, {
      description: MESSAGES.CRITIQUE_LOADING_DESC,
    });

    try {
      const formData = formDataRef.current || createFallbackFormData(uploadedImage);
      const result = await uploadImageWithCritique(formData);

      toast.dismiss(loadingToastId);

      if (result.critique.success && result.critique.data) {
        onCritiqueStateChange({
          status: 'success',
          data: result.critique.data,
        });

        toast.success(MESSAGES.CRITIQUE_SUCCESS, {
          description: MESSAGES.CRITIQUE_SUCCESS_DESC,
          duration: TIMING.TOAST_SUCCESS_DURATION,
        });

        setTimeout(() => {
          setCritiqueData({
            image: uploadedImage,
            critique: result.critique.data!,
          });
          router.push('/report/current');
        }, TIMING.NAVIGATION_DELAY);
      } else {
        handleCritiqueError(result.critique.error, onCritiqueStateChange);
      }
    } catch (error) {
      console.error('Critique generation error:', error);
      toast.dismiss(loadingToastId);
      handleNetworkError(onCritiqueStateChange);
    } finally {
      onProcessingChange(false);
    }
  };

  return { generateCritique };
}

function createFallbackFormData(uploadedImage: UploadedImage): FormData {
  const formData = new FormData();
  formData.append('image', uploadedImage.file);
  if (uploadedImage.exif) {
    formData.append('exifData', JSON.stringify(uploadedImage.exif));
  }
  return formData;
}

function handleCritiqueError(error: string | undefined, onCritiqueStateChange: (state: UploadState['critique']) => void) {
  onCritiqueStateChange({
    status: 'error',
    error: error || MESSAGES.CRITIQUE_ERROR,
  });

  toast.error(MESSAGES.CRITIQUE_ERROR, {
    description: error || '再度お試しください',
    duration: TIMING.TOAST_ERROR_DURATION,
  });
}

function handleNetworkError(onCritiqueStateChange: (state: UploadState['critique']) => void) {
  onCritiqueStateChange({
    status: 'error',
    error: MESSAGES.CRITIQUE_NETWORK_ERROR,
  });

  toast.error('エラーが発生しました', {
    description: MESSAGES.CRITIQUE_NETWORK_DESC,
    duration: TIMING.TOAST_ERROR_DURATION,
  });
}