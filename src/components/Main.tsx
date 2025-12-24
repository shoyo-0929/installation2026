/**
 * ログイン成功後の画面コンポーネント
 *
 * ユーザーの投稿内容を表示し、点線をなぞって「稲穂の心」を
 * アートスペースに送る画面。
 */
'use client';

import { sizeClamp } from '@/lib/css';
import NextImage from 'next/image';
import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import type { PhraseResponse } from '@/lib/api';
import iconOperation from '@/assets/img/icon_operation.svg';
import changeIcon from '@/assets/img/icon_change.svg';
import { TraceCanvas, type TraceCanvasHandle } from '@/components/TraceCanvas';
import type { Bodai } from '@/types/bodai';
import { branchList } from '@/data/branchList';

const BASE_CANVAS_SIZE = 1024;
const SAFE_ZONE_PADDING = 40;

export interface AfterLoginScreenProps {
  /** 会員の投稿情報 */
  phraseData: PhraseResponse;
  /** 菩提（ぼだい）リスト */
  bodai: Bodai[];
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
  showDebugControls = false,
}: AfterLoginScreenProps) {
  const { myPhrase } = phraseData;
  const traceRef = useRef<TraceCanvasHandle | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const textGroupRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLParagraphElement | null>(null);
  const nameRef = useRef<HTMLDivElement | null>(null);
  const branchRef = useRef<HTMLDivElement | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const phraseLines = useMemo(() => {
    if (!myPhrase.text1) return [];
    return myPhrase.text1
      .split(/\r\n|\n|\r/)
      .filter((line) => line.trim() !== '');
  }, [myPhrase.text1]);
  // 表示する菩提IDを管理するステート（初期値はユーザーの菩提ID）
  const [displayBodaiId, setDisplayBodaiId] = useState<number>(
    Number(myPhrase.bodai)
  ); // 念のため型変換

  // ユーザーデータが変更された場合にステートを更新
  useEffect(() => {
    setDisplayBodaiId(Number(myPhrase.bodai));
  }, [myPhrase.bodai]);

  // 投稿データの bodai 番号に一致するデータを取得
  const currentBodai = bodai.find((b) => b.id === displayBodaiId);

  // 背景チェンジボタンのハンドラ
  const handleBackgroundChange = () => {
    // 現在のIDのインデックスを探す
    const currentIndex = bodai.findIndex((b) => b.id === displayBodaiId);
    // 次のインデックス（最後なら最初に戻る）
    const nextIndex = (currentIndex + 1) % bodai.length;
    setDisplayBodaiId(bodai[nextIndex].id);
  };

  const updateGeneratedImageUrl = useCallback((url: string) => {
    setGeneratedImageUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }
      return url;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (generatedImageUrl) {
        URL.revokeObjectURL(generatedImageUrl);
      }
    };
  }, [generatedImageUrl]);

  const handleGenerateImage = useCallback(async () => {
    if (!currentBodai || isGenerating) return;
    const container = canvasContainerRef.current;
    const textGroup = textGroupRef.current;
    if (!container || !textGroup) return;

    const containerRect = container.getBoundingClientRect();
    if (!containerRect.width) return;

    setIsGenerating(true);

    try {
      const scale = BASE_CANVAS_SIZE / containerRect.width;
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

      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = BASE_CANVAS_SIZE;
      maskCanvas.height = BASE_CANVAS_SIZE;
      const maskCtx = maskCanvas.getContext('2d');
      if (!maskCtx) return;

      maskCtx.fillStyle = '#000';
      const points = traceRef.current?.getPoints() ?? [];
      if (points.length > 2) {
        maskCtx.beginPath();
        points.forEach((point, index) => {
          if (index === 0) {
            maskCtx.moveTo(point.x, point.y);
          } else {
            maskCtx.lineTo(point.x, point.y);
          }
        });
        maskCtx.closePath();
        maskCtx.fill('evenodd');
      }

      maskCtx.fillRect(safeZoneX, safeZoneY, safeZoneWidth, safeZoneHeight);

      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = BASE_CANVAS_SIZE;
      outputCanvas.height = BASE_CANVAS_SIZE;
      const outputCtx = outputCanvas.getContext('2d');
      if (!outputCtx) return;

      const loadImage = (src: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new window.Image();
          image.onload = () => resolve(image);
          image.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
          image.src = src;
        });

      const backgroundImage = await loadImage(currentBodai.bgImg.src);
      outputCtx.clearRect(0, 0, BASE_CANVAS_SIZE, BASE_CANVAS_SIZE);
      outputCtx.drawImage(
        backgroundImage,
        0,
        0,
        BASE_CANVAS_SIZE,
        BASE_CANVAS_SIZE
      );
      outputCtx.globalCompositeOperation = 'destination-in';
      outputCtx.drawImage(maskCanvas, 0, 0);
      outputCtx.globalCompositeOperation = 'source-over';

      const drawLines = (element: HTMLElement | null, lines: string[]) => {
        if (!element || lines.length === 0) return;
        const rect = toBaseRect(element.getBoundingClientRect());
        const style = window.getComputedStyle(element);
        const fontSize = parseFloat(style.fontSize) || 18;
        const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.5;
        const fontWeight = style.fontWeight || '700';
        const fontFamily = style.fontFamily || 'Noto Sans JP';

        outputCtx.fillStyle = style.color;
        outputCtx.font = `${fontWeight} ${fontSize * scale}px ${fontFamily}`;
        outputCtx.textAlign = 'center';
        outputCtx.textBaseline = 'top';

        const x = rect.x + rect.width / 2;
        const y = rect.y;
        const scaledLineHeight = lineHeight * scale;

        lines.forEach((line, index) => {
          outputCtx.fillText(line, x, y + scaledLineHeight * index);
        });
      };

      const drawSingleLine = (element: HTMLElement | null, text: string) => {
        if (!element || !text) return;
        const rect = toBaseRect(element.getBoundingClientRect());
        const style = window.getComputedStyle(element);
        const fontSize = parseFloat(style.fontSize) || 18;
        const fontWeight = style.fontWeight || '700';
        const fontFamily = style.fontFamily || 'Noto Sans JP';

        outputCtx.fillStyle = style.color;
        outputCtx.font = `${fontWeight} ${fontSize * scale}px ${fontFamily}`;
        outputCtx.textAlign = 'center';
        outputCtx.textBaseline = 'top';

        const x = rect.x + rect.width / 2;
        outputCtx.fillText(text, x, rect.y);
      };

      drawLines(bodyRef.current, phraseLines);
      drawSingleLine(nameRef.current, myPhrase.name ?? '');
      drawSingleLine(
        branchRef.current,
        branchList[myPhrase.branch] ?? ''
      );

      const blob = await new Promise<Blob | null>((resolve) => {
        outputCanvas.toBlob(resolve, 'image/png');
      });

      if (!blob) return;
      updateGeneratedImageUrl(URL.createObjectURL(blob));
    } catch (error) {
      console.error('画像生成に失敗しました', error);
    } finally {
      setIsGenerating(false);
    }
  }, [
    currentBodai,
    isGenerating,
    phraseLines,
    myPhrase.name,
    myPhrase.branch,
    updateGeneratedImageUrl,
  ]);

  // データが見つからない場合のフォールバック（通常はあり得ないが安全のため）

  // データが見つからない場合のフォールバック（通常はあり得ないが安全のため）
  if (!currentBodai) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p>データの読み込みに失敗しました。</p>
      </div>
    );
  }

  return (
    <div
      className={`relative min-h-screen ${currentBodai.bgColor} overflow-hidden transition-colors duration-500`}
    >
      {/* 背景画像 */}
      <div className="absolute inset-0 z-0">
        <NextImage
          key={currentBodai.id}
          src={currentBodai.bgImg}
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-100"
          priority
        />
      </div>

      <main className="relative z-10 flex flex-col items-center pt-6 pb-8 min-h-screen w-full max-w-[375px] mx-auto">
        {/* 上部のメッセージボックス */}
        <div className="bg-[rgba(255,244,98,0.6)] rounded-[13px] py-4 mb-6 w-full mx-4">
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

        {/* メインキャンバスエリア（オレンジ枠） */}
        <div
          ref={canvasContainerRef}
          className="relative w-full aspect-square flex items-center justify-center mb-auto"
        >
          {/* ガイド線（白い点線） */}
          {currentBodai.guide && currentBodai.guide[0] && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-[340px] h-[340px]">
                <NextImage
                  src={currentBodai.guide[0]}
                  alt=""
                  fill
                  sizes="340px"
                  className="object-contain"
                />
              </div>
            </div>
          )}

          <TraceCanvas
            ref={traceRef}
            className="absolute inset-0 z-10"
            baseSize={BASE_CANVAS_SIZE}
            strokeColor="rgba(255,255,255,1)"
            strokeWidth={8}
            glowColor="rgba(255,255,255,1)"
            glowBlur={34}
          />

          {/* 枠内のコンテンツ */}
          <div className="relative z-20 flex flex-col items-center justify-center p-6 w-full h-full pointer-events-none">
            {/* 菩提アイコン */}
            <div className="relative w-[60px] h-[60px] mb-4">
              <NextImage
                src={currentBodai.img}
                alt={currentBodai.name}
                fill
                sizes="60px"
                className="object-contain"
              />
            </div>

            <div ref={textGroupRef} className="flex flex-col items-center">
              {/* 投稿テキスト */}
              <div className="text-center mb-4 w-full max-w-[240px]">
                <p
                  ref={bodyRef}
                  className={`text-[18px] font-bold leading-normal ${currentBodai.textColor}`}
                >
                  {phraseLines.map((line, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && <br />}
                      {line}
                    </React.Fragment>
                  ))}
                </p>
              </div>

              {/* 名前 & 支部 */}
              <div className="text-[#262626] font-bold text-center">
                <div ref={nameRef} className="text-[22px] mb-1">
                  {myPhrase.name}
                </div>
                {branchList[myPhrase.branch] && (
                  <div ref={branchRef} className="text-[18px]">
                    {branchList[myPhrase.branch]}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* オレンジ色のL字型フレーム */}
          <div className="absolute inset-0 z-30 pointer-events-none">
            {/* 左上 */}
            <div className="absolute top-0 left-0 w-[81px] h-1 bg-[#ef7314]" />
            <div className="absolute top-0 left-0 w-1 h-[81px] bg-[#ef7314]" />
            {/* 右上 */}
            <div className="absolute top-0 right-0 w-[81px] h-1 bg-[#ef7314]" />
            <div className="absolute top-0 right-0 w-1 h-[81px] bg-[#ef7314]" />
            {/* 左下 */}
            <div className="absolute bottom-0 left-0 w-[81px] h-1 bg-[#ef7314]" />
            <div className="absolute bottom-0 left-0 w-1 h-[81px] bg-[#ef7314]" />
            {/* 右下 */}
            <div className="absolute bottom-0 right-0 w-[81px] h-1 bg-[#ef7314]" />
            <div className="absolute bottom-0 right-0 w-1 h-[81px] bg-[#ef7314]" />
          </div>
        </div>

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
              onClick={handleGenerateImage}
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
                <img
                  src={generatedImageUrl}
                  alt="生成プレビュー"
                  className="h-20 w-20 rounded-md border border-white/70 object-contain"
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
