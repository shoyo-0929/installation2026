'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { type PhraseResponse } from '@/lib/api';
import { SafeZoneDialogs } from '@/components/main/SafeZoneDialogs';
import { TraceStage } from '@/components/canvas/TraceStage';
import { TracePreviewDialog } from '@/components/main/TracePreviewDialog';
import { SubmitSuccessAnimation } from '@/components/end/SubmitSuccessAnimation';
import { CompletionScreen } from '@/components/end/CompletionScreen';
import { TraceIntroDialog } from '@/components/main/TraceIntroDialog';
import { BackgroundChangeButton } from '@/components/main/BackgroundChangeButton';
import { RedoButton } from '@/components/main/RedoButton';
import { BackButton } from '@/components/main/BackButton';
import { DebugControls } from '@/components/main/DebugControls';
import type { TraceCanvasHandle } from '@/components/canvas/TraceCanvas';
import type { Bodai } from '@/types/bodai';
import { branchList } from '@/data/branchList';
import {
  BASE_CANVAS_SIZE,
  SAFE_ZONE_PADDING,
  SAFE_ZONE_WARN_RADIUS_RATIO,
  SAFE_ZONE_RESET_RADIUS_RATIO,
  TRACE_STROKE_WIDTH,
  type SafeZoneInfo,
  getSafeZoneDistanceRatio,
} from '@/lib/trace-utils';
import type { SafeZoneDebug } from '@/components/canvas/SafeZoneDebugOverlay';
import { generateTraceImage } from '@/lib/image-generation';
import { useTraceLogic } from '@/hooks/useTraceLogic';
import { useCutoutUpload } from '@/hooks/useCutoutUpload';
import { preloadSounds, playRaiseSound } from '@/lib/sound';

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
 * - 菩提（背景・図形）の切り替え
 * - トレーシング機能（キャンバス）
 * - 画像生成とアップロード
 * - 成功アニメーションと完了画面の制御
 */
export function Main({
  phraseData,
  bodai,
  mid,
  spot,
  showDebugControls = false,
}: AfterLoginScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { myPhrase } = phraseData;

  // DOM要素への参照（画像生成時に使用）
  const traceRef = useRef<TraceCanvasHandle | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const textGroupRef = useRef<HTMLDivElement | null>(null);
  const iconRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLParagraphElement | null>(null);
  const nameRef = useRef<HTMLDivElement | null>(null);
  const branchRef = useRef<HTMLDivElement | null>(null);

  // 状態管理
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  ); // 生成された画像のURL
  const [isGenerating, setIsGenerating] = useState(false); // 画像生成中フラグ

  // 背景画像のインデックス（0開始）
  const [bgImageIndex, setBgImageIndex] = useState<number>(0);

  // 表示する菩提IDを管理するステート（初期値はユーザーの菩提ID）
  const [displayBodaiId, setDisplayBodaiId] = useState<number>(
    Number(myPhrase.bodai)
  );

  // 初回マウント時にランダムな背景を設定（Hydrationエラー回避）
  useEffect(() => {
    setBgImageIndex(Math.floor(Math.random() * 3));
  }, []);

  // ユーザーデータ（菩提ID）が変更された場合にステートを同期し、背景をランダムにリセット
  useEffect(() => {
    setDisplayBodaiId(Number(myPhrase.bodai));
    setBgImageIndex(Math.floor(Math.random() * 3));
  }, [myPhrase.bodai]);

  // 音声のプリロード
  useEffect(() => {
    preloadSounds();
  }, []);

  // 現在表示中の菩提データ
  const currentBodai = bodai.find((b) => b.id === displayBodaiId);

  /**
   * 背景チェンジボタンのハンドラ
   * 現在の菩提で使用可能な背景画像を循環させる
   */
  const handleBackgroundChange = () => {
    if (!currentBodai) return;
    setBgImageIndex((prev) => (prev + 1) % currentBodai.bgImg.length);
  };

  /**
   * 生成された画像URLを更新する（以前のURLはRevokeしてメモリ解放）
   */
  const updateGeneratedImageUrl = useCallback((url: string) => {
    setGeneratedImageUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }
      return url;
    });
  }, []);

  /**
   * 生成された画像をクリアする
   */
  const clearGeneratedImageUrl = useCallback(() => {
    setGeneratedImageUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }
      return null;
    });
  }, []);

  // 投稿テキストを行ごとの配列に変換（空行削除）
  const phraseLines = useMemo(() => {
    if (!myPhrase.text1) return [];
    return myPhrase.text1
      .split(/\r\n|\n|\r/)
      .filter((line) => line.trim() !== '');
  }, [myPhrase.text1]);

  /**
   * 安全領域（Safe Zone）の情報をDOMから取得する関数
   * テキストグループの矩形をもとに判定基準を作成
   */
  const getSafeZoneInfo = useCallback((): SafeZoneInfo | null => {
    const container = canvasContainerRef.current;
    const textGroup = textGroupRef.current;
    if (!container || !textGroup) return null;

    const containerRect = container.getBoundingClientRect();
    if (!containerRect.width || !containerRect.height) return null;

    // コンテナのサイズを基準に座標変換（正方形前提）
    const containerSize = Math.min(containerRect.width, containerRect.height);
    const scale = BASE_CANVAS_SIZE / containerSize;

    // 画面上の Rect を基準座標系に変換
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

  // トレーシングロジックのカスタムフック
  const {
    safeZoneWarningRatio, // 警告表示用の距離比率（null以外なら警告中）
    setSafeZoneWarningRatio,
    safeZoneResetOpen, // リセット確認ダイアログの開閉
    setSafeZoneResetOpen,
    safeZoneUnclosedOpen, // 閉じていない警告ダイアログの開閉
    setSafeZoneUnclosedOpen,
    traceReady, // トレース完了状態
    setTraceReady,
    previewOpen, // プレビュー画面の開閉
    setPreviewOpen,
    handleTraceEnd, // トレース終了時の処理（TraceCanvasに渡す）
    resetTraceState, // 状態のリセット
  } = useTraceLogic({
    getSafeZoneInfo,
    resetGeneratedImage: clearGeneratedImageUrl,
  });

  // デバッグ用の安全領域情報を計算
  const [safeZoneDebug, setSafeZoneDebug] = useState<SafeZoneDebug | null>(
    null
  );

  useEffect(() => {
    if (!showDebugControls) {
      setSafeZoneDebug(null);
      return;
    }
    // 少し遅延させてDOM計算が確定してから取得
    const timer = setTimeout(() => {
      const info = getSafeZoneInfo();
      if (!info) return;
      const radius = Math.min(info.safeZoneWidth, info.safeZoneHeight) / 2;
      const centerX = (info.safeZoneX + info.safeZoneWidth / 2) / info.scale;
      const centerY = (info.safeZoneY + info.safeZoneHeight / 2) / info.scale;
      const warnRadius = (radius * SAFE_ZONE_WARN_RADIUS_RATIO) / info.scale;
      const resetRadius = (radius * SAFE_ZONE_RESET_RADIUS_RATIO) / info.scale;
      setSafeZoneDebug({ centerX, centerY, warnRadius, resetRadius });
    }, 100);
    return () => clearTimeout(timer);
  }, [showDebugControls, getSafeZoneInfo]);

  // 生成された画像のクリーンアップ
  useEffect(() => {
    return () => {
      if (generatedImageUrl) {
        URL.revokeObjectURL(generatedImageUrl);
      }
    };
  }, [generatedImageUrl]);

  // トレースのやり直し処理
  const handleRestartTrace = useCallback(() => {
    traceRef.current?.clear();
    resetTraceState();
  }, [resetTraceState]);

  /**
   * 画像生成処理
   * DOM要素をCanvasに描画し、合成画像を作成する
   */
  const handleGenerateImage = useCallback(
    async (options?: { allowUnsafe?: boolean }) => {
      const allowUnsafe = options?.allowUnsafe ?? false;
      if (!currentBodai || isGenerating) return;

      const safeZoneInfo = getSafeZoneInfo();
      if (!safeZoneInfo) return;

      try {
        const points = traceRef.current?.getPoints() ?? [];

        // allowUnsafeでない場合、再度安全領域チェックを行う（手動実行時など）
        if (!allowUnsafe) {
          const distanceRatio = getSafeZoneDistanceRatio(points, safeZoneInfo);
          if (
            distanceRatio !== null &&
            distanceRatio <= SAFE_ZONE_WARN_RADIUS_RATIO
          ) {
            // 安全領域違反がある場合、警告を表示して生成中断
            setSafeZoneWarningRatio(distanceRatio);
            setSafeZoneUnclosedOpen(false);
            setSafeZoneResetOpen(false);
            setTraceReady(false);
            return;
          }
        }

        setIsGenerating(true);

        // 画像生成ユーティリティ呼び出し
        const url = await generateTraceImage({
          currentBodai,
          bgImageIndex,
          points,
          phraseLines,
          myPhrase: { name: myPhrase.name, branch: Number(myPhrase.branch) },
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
      setSafeZoneUnclosedOpen,
      setSafeZoneResetOpen,
    ]
  );

  // トレース完了時などにプレビューを表示し、画像を生成するエフェクト
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

  // 警告を無視して続行する場合のハンドラ
  const handleContinueUnsafe = useCallback(() => {
    setSafeZoneWarningRatio(null);
    setTraceReady(true); // trueにしてプレビューを表示
    handleGenerateImage({ allowUnsafe: true });
  }, [handleGenerateImage, setSafeZoneWarningRatio, setTraceReady]);

  // リセット確認後の処理
  const handleConfirmReset = useCallback(() => {
    setSafeZoneResetOpen(false);
    handleRestartTrace();
  }, [handleRestartTrace, setSafeZoneResetOpen]);

  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [successImageUrl, setSuccessImageUrl] = useState<string | null>(null);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);

  // 初回説明ダイアログの表示状態
  const [showIntro, setShowIntro] = useState(true);

  // 画像アップロードフック
  const { isUploading, uploadError, startUpload } = useCutoutUpload();

  /**
   * 送信確認ハンドラ
   * 画像をアップロードし、成功したらアニメーションを表示
   */
  const handleConfirmSubmit = useCallback(() => {
    if (!generatedImageUrl || isUploading) return;
    const imageUrl = generatedImageUrl;
    setPreviewOpen(false); // プレビューを閉じて
    setSuccessImageUrl(imageUrl);
    setShowSuccessAnimation(true); // 成功アニメーション開始
    playRaiseSound(); // 上に上がるアニメーションの効果音

    const delayMs = spot && spot !== '0' ? 7000 : 0;
    const runUpload = () => {
      void startUpload({
        mid,
        name: myPhrase.name ?? '',
        bodaiId: displayBodaiId,
        spot,
        generatedImageUrl: imageUrl,
        onSuccess: () => {},
      });
    };

    if (delayMs === 0) {
      runUpload();
      return;
    }

    setTimeout(runUpload, delayMs);
  }, [
    generatedImageUrl,
    isUploading,
    startUpload,
    mid,
    myPhrase.name,
    displayBodaiId,
    spot,
    setPreviewOpen,
  ]);

  // 成功アニメーション完了後の処理
  const handleAnimationComplete = useCallback(() => {
    setShowSuccessAnimation(false);
    setSuccessImageUrl(null);
    setShowCompletionScreen(true); // 完了画面へ遷移
  }, []);

  // トップに戻る処理（セッションクリア）
  const handleBackToTop = useCallback(() => {
    sessionStorage.removeItem('installation2026.phrase');
    sessionStorage.removeItem('installation2026.mid');
    const queryString = searchParams.toString();
    router.push(queryString ? `/?${queryString}` : '/');
  }, [router, searchParams]);

  // データが見つからない場合のフォールバック
  if (!currentBodai) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p>データの読み込みに失敗しました。</p>
      </div>
    );
  }

  // 完了画面の表示
  if (showCompletionScreen) {
    return <CompletionScreen onBackToTop={handleBackToTop} />;
  }

  return (
    <div
      className={`relative min-h-screen ${currentBodai.bgColor} overflow-hidden transition-colors duration-500`}
    >
      <main className="relative z-10 flex flex-col items-center justify-center pt-6 pb-12 min-h-screen w-full max-w-[375px] mx-auto">
        {/* 固定ボタンコンテナ（戻る・やり直す・背景チェンジ） */}
        <div className="flex w-full justify-center pointer-events-none">
          <div className="w-full  max-w-[375px] flex justify-center gap-6 pb-2 pointer-events-auto">
            <BackButton onClick={handleBackToTop} />
            <RedoButton onClick={handleRestartTrace} />
            <BackgroundChangeButton onClick={handleBackgroundChange} />
          </div>
        </div>

        {/* トレースキャンバスを含むメインステージ */}
        <TraceStage
          bodai={currentBodai}
          imageIndex={bgImageIndex}
          bgImage={currentBodai.bgImg[bgImageIndex]}
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

        {/* プレビューダイアログ */}
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

        {/* デバッグコントロール（必要な場合） */}
        {showDebugControls && (
          <DebugControls
            isGenerating={isGenerating}
            onGenerate={() => handleGenerateImage()}
            previewUrl={generatedImageUrl}
            displayBodaiId={displayBodaiId}
          />
        )}

        {/* 初回説明ダイアログ */}
        <TraceIntroDialog
          open={showIntro}
          onClose={() => setShowIntro(false)}
        />

        {/* 各種警告・確認ダイアログ */}
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
