/**
 * ログイン成功後の画面コンポーネント
 *
 * ユーザーの投稿内容を表示し、点線をなぞって「稲穂の心」を
 * アートスペースに送る画面。
 */
'use client';

import { sizeClamp } from '@/lib/css';
import NextImage from 'next/image';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { uploadCutoutImage, type PhraseResponse } from '@/lib/api';
import iconOperation from '@/assets/img/icon_operation.svg';
import changeIcon from '@/assets/img/icon_change.svg';
import type { SafeZoneDebug } from '@/components/SafeZoneDebugOverlay';
import { SafeZoneDialogs } from '@/components/SafeZoneDialogs';
import { TraceStage } from '@/components/TraceStage';
import { TracePreviewDialog } from '@/components/TracePreviewDialog';
import { SubmitSuccessAnimation } from '@/components/SubmitSuccessAnimation';
import { CompletionScreen } from '@/components/CompletionScreen';
import type { TraceCanvasHandle, TracePoint } from '@/components/TraceCanvas';
import type { Bodai } from '@/types/bodai';
import { branchList } from '@/data/branchList';
import {
  BASE_CANVAS_SIZE,
  SAFE_ZONE_PADDING,
  SAFE_ZONE_WARN_RADIUS_RATIO,
  SAFE_ZONE_RESET_RADIUS_RATIO,
  SAFE_ZONE_CENTER_TOLERANCE,
  TRACE_STROKE_WIDTH,
  type SafeZoneInfo,
  getSafeZoneCenter,
  getSafeZoneDistanceRatio,
  isLoopedPath,
  isPointInsidePath,
  LOOP_CLOSE_THRESHOLD_RATIO,
  LOOP_CLOSE_THRESHOLD_MAX,
  LOOP_MIN_LENGTH_RATIO,
} from '@/lib/trace-utils';
import { generateTraceImage } from '@/lib/image-generation';
import { useTraceLogic } from '@/hooks/useTraceLogic';

export interface AfterLoginScreenProps {
  /** 会員の投稿情報 */
  phraseData: PhraseResponse;
  /** 菩提（ぼだい）リスト */
  bodai: Bodai[];
  /** 会員番号（CA番号） */
  mid: string;
  /** 場所コード（中京=51など） */
  spot: string;
  /** デバッグ用コントロールの表示 */
  showDebugControls?: boolean;
}

/**
 * ログイン成功後のメイン画面
 *
 * 機能:
 * - 投稿内容の表示
 * - 稲穂のアイコン表示
 * - 背景チェンジボタン
 * - 点線のトレース領域
 */
export function Main({
  phraseData,
  bodai,
  mid,
  spot,
  showDebugControls = false,
}: AfterLoginScreenProps) {
  const router = useRouter();
  const { myPhrase } = phraseData;
  const traceRef = useRef<TraceCanvasHandle | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const textGroupRef = useRef<HTMLDivElement | null>(null);
  const iconRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLParagraphElement | null>(null);
  const nameRef = useRef<HTMLDivElement | null>(null);
  const branchRef = useRef<HTMLDivElement | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [safeZoneDebug, setSafeZoneDebug] = useState<SafeZoneDebug | null>(
    null
  );

  const [bgImageIndex, setBgImageIndex] = useState<number>(0);

  // 表示する菩提IDを管理するステート（初期値はユーザーの菩提ID）
  const [displayBodaiId, setDisplayBodaiId] = useState<number>(
    Number(myPhrase.bodai)
  ); // 念のため型変換

  // ユーザーデータが変更された場合にステートを更新
  useEffect(() => {
    setDisplayBodaiId(Number(myPhrase.bodai));
    setBgImageIndex(0); // 念のためリセット
  }, [myPhrase.bodai]);

  // 投稿データの bodai 番号に一致するデータを取得
  const currentBodai = bodai.find((b) => b.id === displayBodaiId);
  console.log(currentBodai);

  // 背景チェンジボタンのハンドラ
  const handleBackgroundChange = () => {
    if (!currentBodai) return;
    setBgImageIndex((prev) => (prev + 1) % currentBodai.bgImg.length);
  };

  const updateGeneratedImageUrl = useCallback((url: string) => {
    setGeneratedImageUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }
      return url;
    });
  }, []);

  const clearGeneratedImageUrl = useCallback(() => {
    setGeneratedImageUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }
      return null;
    });
  }, []);

  const phraseLines = useMemo(() => {
    if (!myPhrase.text1) return [];
    return myPhrase.text1
      .split(/\r\n|\n|\r/)
      .filter((line) => line.trim() !== '');
  }, [myPhrase.text1]);

  const getSafeZoneInfo = useCallback((): SafeZoneInfo | null => {
    const container = canvasContainerRef.current;
    const textGroup = textGroupRef.current;
    if (!container || !textGroup) return null;

    const containerRect = container.getBoundingClientRect();
    if (!containerRect.width || !containerRect.height) return null;

    // コンテナのサイズを基準に座標変換（正方形前提）
    const containerSize = Math.min(containerRect.width, containerRect.height);
    const scale = BASE_CANVAS_SIZE / containerSize;

    const toBaseRect = (rect: DOMRect) => ({
      x: (rect.left - containerRect.left) * scale,
      y: (rect.top - containerRect.top) * scale,
      width: rect.width * scale,
      height: rect.height * scale,
    });

    const groupRect = toBaseRect(textGroup.getBoundingClientRect());
    const safeZoneX = Math.max(0, groupRect.x - SAFE_ZONE_PADDING);
    const safeZoneY = Math.max(0, groupRect.y - SAFE_ZONE_PADDING);
    const safeZoneWidth = Math.min(
      BASE_CANVAS_SIZE - safeZoneX,
      groupRect.width + SAFE_ZONE_PADDING * 2
    );
    const safeZoneHeight = Math.min(
      BASE_CANVAS_SIZE - safeZoneY,
      groupRect.height + SAFE_ZONE_PADDING * 2
    );

    return {
      scale,
      toBaseRect,
      safeZoneX,
      safeZoneY,
      safeZoneWidth,
      safeZoneHeight,
    };
  }, []);

  const {
    safeZoneWarningRatio,
    setSafeZoneWarningRatio,
    safeZoneResetOpen,
    setSafeZoneResetOpen,
    safeZoneUnclosedOpen,
    setSafeZoneUnclosedOpen,
    traceReady,
    setTraceReady,
    previewOpen,
    setPreviewOpen,
    handleTraceEnd,
    resetTraceState,
  } = useTraceLogic({
    getSafeZoneInfo,
    resetGeneratedImage: clearGeneratedImageUrl,
  });

  const updateSafeZoneDebug = useCallback(() => {
    const safeZoneInfo = getSafeZoneInfo();
    if (!safeZoneInfo) {
      setSafeZoneDebug(null);
      return;
    }
    const radius =
      Math.min(safeZoneInfo.safeZoneWidth, safeZoneInfo.safeZoneHeight) / 2;
    if (!radius || !safeZoneInfo.scale) {
      setSafeZoneDebug(null);
      return;
    }
    const { x: centerX, y: centerY } = getSafeZoneCenter(safeZoneInfo);
    const toView = (value: number) => value / safeZoneInfo.scale;
    setSafeZoneDebug({
      centerX: toView(centerX),
      centerY: toView(centerY),
      warnRadius: toView(radius * SAFE_ZONE_WARN_RADIUS_RATIO),
      resetRadius: toView(radius * SAFE_ZONE_RESET_RADIUS_RATIO),
    });
  }, [getSafeZoneInfo]);

  useEffect(() => {
    return () => {
      if (generatedImageUrl) {
        URL.revokeObjectURL(generatedImageUrl);
      }
    };
  }, [generatedImageUrl]);

  useEffect(() => {
    updateSafeZoneDebug();
    const container = canvasContainerRef.current;
    const textGroup = textGroupRef.current;
    if (!container || !textGroup) return;
    const observer = new ResizeObserver(() => {
      updateSafeZoneDebug();
    });
    observer.observe(container);
    observer.observe(textGroup);
    return () => observer.disconnect();
  }, [updateSafeZoneDebug]);

  const handleRestartTrace = useCallback(() => {
    traceRef.current?.clear();
    resetTraceState();
  }, [resetTraceState]);

  const handleGenerateImage = useCallback(
    async (options?: { allowUnsafe?: boolean }) => {
      const allowUnsafe = options?.allowUnsafe ?? false;
      if (!currentBodai || isGenerating) return;

      const safeZoneInfo = getSafeZoneInfo();
      if (!safeZoneInfo) return;

      try {
        const points = traceRef.current?.getPoints() ?? [];

        // 再検証（安全のため、および手動実行時のため）
        if (!allowUnsafe) {
          const distanceRatio = getSafeZoneDistanceRatio(points, safeZoneInfo);
          if (
            distanceRatio !== null &&
            distanceRatio <= SAFE_ZONE_WARN_RADIUS_RATIO
          ) {
            setSafeZoneWarningRatio(distanceRatio);
            setTraceReady(false);
            return;
          }
        }

        setIsGenerating(true);

        const url = await generateTraceImage({
          currentBodai,
          bgImageIndex,
          points,
          phraseLines,
          myPhrase: { name: myPhrase.name, branch: myPhrase.branch },
          iconElement: iconRef.current,
          bodyElement: bodyRef.current,
          nameElement: nameRef.current,
          branchElement: branchRef.current,
          scale: safeZoneInfo.scale,
          toBaseRect: safeZoneInfo.toBaseRect,
        });

        updateGeneratedImageUrl(url);
      } catch (error) {
        console.error('画像生成に失敗しました', error);
      } finally {
        setIsGenerating(false);
      }
    },
    [
      currentBodai,
      bgImageIndex,
      isGenerating,
      phraseLines,
      myPhrase.name,
      myPhrase.branch,
      updateGeneratedImageUrl,
      getSafeZoneInfo,
      setSafeZoneWarningRatio,
      setTraceReady,
    ]
  );

  useEffect(() => {
    if (
      !traceReady ||
      safeZoneWarningRatio !== null ||
      safeZoneResetOpen ||
      safeZoneUnclosedOpen
    ) {
      setPreviewOpen(false);
      return;
    }
    setPreviewOpen(true);
    if (!generatedImageUrl && !isGenerating) {
      handleGenerateImage();
    }
  }, [
    traceReady,
    safeZoneWarningRatio,
    safeZoneResetOpen,
    safeZoneUnclosedOpen,
    generatedImageUrl,
    isGenerating,
    handleGenerateImage,
    setPreviewOpen,
  ]);

  const handleContinueUnsafe = useCallback(() => {
    setSafeZoneWarningRatio(null);
    setTraceReady(false);
    setPreviewOpen(false);
    handleGenerateImage({ allowUnsafe: true });
  }, [
    handleGenerateImage,
    setSafeZoneWarningRatio,
    setTraceReady,
    setPreviewOpen,
  ]);

  const handleConfirmReset = useCallback(() => {
    setSafeZoneResetOpen(false);
    handleRestartTrace();
  }, [handleRestartTrace, setSafeZoneResetOpen]);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [successImageUrl, setSuccessImageUrl] = useState<string | null>(null);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);

  const handleConfirmSubmit = useCallback(async () => {
    if (!generatedImageUrl || isUploading) return;

    setIsUploading(true);
    setUploadError(null);

    // 送信データをコンソールに出力
    const uploadData = {
      mid,
      name: myPhrase.name ?? '',
      bodai: String(displayBodaiId),
      spot,
    };
    console.log('[画像送信] 送信データ:', uploadData);

    try {
      // Blob URL から実際の Blob を取得
      const response = await fetch(generatedImageUrl);
      const imageBlob = await response.blob();
      console.log('[画像送信] 画像サイズ:', imageBlob.size, 'bytes');

      // サーバーにアップロード
      const result = await uploadCutoutImage(imageBlob, uploadData);

      if (result.success) {
        console.log('Upload successful:', result.imageUrl);
        // プレビューダイアログを閉じてアニメーションを開始
        setPreviewOpen(false);
        setSuccessImageUrl(generatedImageUrl);
        setShowSuccessAnimation(true);
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
  }, [
    generatedImageUrl,
    isUploading,
    mid,
    myPhrase.name,
    displayBodaiId,
    spot,
    setPreviewOpen,
  ]);

  const handleAnimationComplete = useCallback(() => {
    setShowSuccessAnimation(false);
    setSuccessImageUrl(null);
    setShowCompletionScreen(true);
  }, []);

  const handleBackToTop = useCallback(() => {
    // セッションをクリアしてトップへ戻る
    sessionStorage.removeItem('installation2026.phrase');
    sessionStorage.removeItem('installation2026.mid');
    router.push('/');
  }, [router]);

  // データが見つからない場合のフォールバック（通常はあり得ないが安全のため）
  if (!currentBodai) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p>データの読み込みに失敗しました。</p>
      </div>
    );
  }

  // 完了画面を表示
  if (showCompletionScreen) {
    return <CompletionScreen onBackToTop={handleBackToTop} />;
  }

  return (
    <div
      className={`relative min-h-screen ${currentBodai.bgColor} overflow-hidden transition-colors duration-500`}
    >
      {/* 背景画像 */}
      <div className="absolute inset-0 z-0">
        <NextImage
          key={`${currentBodai.id}-${bgImageIndex}`}
          src={currentBodai.bgImg[bgImageIndex]}
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-100"
          priority
        />
      </div>

      <main className="relative z-10 flex flex-col items-center pt-6 pb-12 min-h-screen w-full max-w-[375px] mx-auto">
        {/* 上部のメッセージボックス */}
        <div className="bg-[rgba(255,244,98,0.6)] rounded-[13px] py-4 mb-6 w-[95%]">
          <p
            style={{ fontSize: sizeClamp(16, 18, 390, 1206) }}
            className="text-center font-medium text-black"
          >
            「{currentBodai.name}の心」を育む中で、頂いた功徳を
            <br />
            アートスペースに送りましょう！
          </p>
        </div>

        {/* スマートフォンと指示テキスト */}
        <div className="flex items-center gap-3 mb-8 w-full px-4">
          <p className="font-bold text-[18px] text-black leading-normal flex-1">
            想いを込めて、功徳をぐるっと囲う形を描いてみましょう。あなたの功徳が、描いた形で型取られ、アートスペースに送られます！
          </p>
          <div className="relative w-[103px] h-[120px] shrink-0">
            <NextImage
              src={iconOperation}
              alt="操作説明"
              fill
              sizes="103px"
              className="object-contain"
            />
          </div>
        </div>

        <TraceStage
          bodai={currentBodai}
          imageIndex={bgImageIndex}
          phraseLines={phraseLines}
          name={myPhrase.name ?? ''}
          branchName={branchList[Number(myPhrase.branch)]}
          baseSize={BASE_CANVAS_SIZE}
          canvasContainerRef={canvasContainerRef}
          textGroupRef={textGroupRef}
          iconRef={iconRef}
          bodyRef={bodyRef}
          nameRef={nameRef}
          branchRef={branchRef}
          traceRef={traceRef}
          safeZoneDebug={safeZoneDebug}
          onTraceEnd={handleTraceEnd}
          strokeWidth={TRACE_STROKE_WIDTH}
        />
        <TracePreviewDialog
          open={previewOpen}
          previewUrl={generatedImageUrl}
          isGenerating={isGenerating}
          isUploading={isUploading}
          uploadError={uploadError}
          onConfirm={handleConfirmSubmit}
          onRedo={handleRestartTrace}
        />
        <SubmitSuccessAnimation
          open={showSuccessAnimation}
          imageUrl={successImageUrl}
          onComplete={handleAnimationComplete}
        />

        {/* 背景チェンジボタン */}
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={handleBackgroundChange}
            className="transition-transform hover:scale-105 active:scale-95 flex flex-col items-center gap-1"
            aria-label="背景を変更"
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center ">
              <NextImage
                src={changeIcon}
                alt=""
                className="max-w-full max-h-full"
              />
            </div>
            <span className="text-[15px] font-bold text-black">
              背景チェンジ
            </span>
          </button>
        </div>
        {showDebugControls && (
          <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-2">
            <button
              onClick={() => handleGenerateImage()}
              disabled={isGenerating}
              className="rounded-md bg-white/90 px-3 py-2 text-sm font-bold text-black shadow disabled:opacity-50"
            >
              {isGenerating ? '生成中...' : 'PNG生成'}
            </button>
            {generatedImageUrl && (
              <div className="flex flex-col items-start gap-2">
                <a
                  href={generatedImageUrl}
                  download={`phrase-${displayBodaiId}.png`}
                  className="rounded-md bg-white/90 px-3 py-1 text-xs font-bold text-black shadow"
                >
                  ダウンロード
                </a>
                <div className="relative h-20 w-20 overflow-hidden rounded-md border border-white/70">
                  <NextImage
                    src={generatedImageUrl}
                    alt="生成プレビュー"
                    fill
                    sizes="80px"
                    className="object-contain"
                    unoptimized
                  />
                </div>
              </div>
            )}
          </div>
        )}
        <SafeZoneDialogs
          warningRatio={safeZoneWarningRatio}
          resetOpen={safeZoneResetOpen}
          unclosedOpen={safeZoneUnclosedOpen}
          onRestart={handleRestartTrace}
          onContinueUnsafe={handleContinueUnsafe}
          onConfirmReset={handleConfirmReset}
        />
      </main>
    </div>
  );
}
