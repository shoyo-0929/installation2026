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

/**
 * 切り抜き画像のアップロード処理を管理するフック
 */
export const useCutoutUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  /**
   * 画像送信処理を開始する
   * Blob変換 -> API送信 -> 成功時のコールバック実行
   */
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
        // Blob URLから実際の画像データを取得
        const response = await fetch(generatedImageUrl);
        const imageBlob = await response.blob();
        console.log('[画像送信] 画像サイズ:', imageBlob.size, 'bytes');

        // API経由でサーバーへ送信
        const result = await uploadCutoutImage(imageBlob, uploadData);

        if (result.success) {
          console.log('[画像送信] 送信成功:', result.imageUrl);
          onSuccess(generatedImageUrl);
        } else {
          console.error('[画像送信] 送信失敗:', result.error);
          setUploadError(result.error || '画像の送信に失敗しました');
        }
      } catch (error) {
        console.error('[画像送信] エラー:', error);
        setUploadError('画像の送信中にエラーが発生しました');
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
