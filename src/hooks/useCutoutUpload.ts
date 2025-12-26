import { useState, useCallback } from 'react';
import { uploadCutoutImage } from '@/lib/api';

type UseCutoutUploadProps = {
  mid: string;
  name: string;
  bodaiId: number;
  spot: string;
  generatedImageUrl: string | null;
  onSuccess: (imageUrl: string) => void;
};

export const useCutoutUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const startUpload = useCallback(
    async ({
      mid,
      name,
      bodaiId,
      spot,
      generatedImageUrl,
      onSuccess,
    }: UseCutoutUploadProps) => {
      if (!generatedImageUrl || isUploading) return;

      setIsUploading(true);
      setUploadError(null);

      const uploadData = {
        mid,
        name,
        bodai: String(bodaiId),
        spot,
      };

      console.log('[画像送信] 送信データ:', uploadData);

      try {
        const response = await fetch(generatedImageUrl);
        const imageBlob = await response.blob();
        console.log('[画像送信] 画像サイズ:', imageBlob.size, 'bytes');

        const result = await uploadCutoutImage(imageBlob, uploadData);

        if (result.success) {
          console.log('Upload successful:', result.imageUrl);
          onSuccess(generatedImageUrl);
        } else {
          console.error('Upload failed:', result.error);
          setUploadError(result.error || '送信に失敗しました');
        }
      } catch (error) {
        console.error('Upload error:', error);
        setUploadError('送信中にエラーが発生しました');
      } finally {
        setIsUploading(false);
      }
    },
    [isUploading]
  );

  return {
    isUploading,
    uploadError,
    startUpload,
  };
};
