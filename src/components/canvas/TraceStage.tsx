'use client';

import NextImage, { type StaticImageData } from 'next/image';
import React from 'react';
import {
  TraceCanvas,
  type TraceCanvasHandle,
} from '@/components/canvas/TraceCanvas';
import { type TracePoint } from '@/lib/trace-utils';
import {
  SafeZoneDebugOverlay,
  type SafeZoneDebug,
} from '@/components/canvas/SafeZoneDebugOverlay';
import type { Bodai } from '@/types/bodai';

type TraceStageProps = {
  bodai: Bodai;
  phraseLines: string[];
  name: string;
  branchName?: string;
  imageIndex?: number;
  bgImage?: StaticImageData;
  baseSize: number;
  strokeWidth?: number;
  canvasContainerRef: React.RefObject<HTMLDivElement | null>;
  textGroupRef: React.RefObject<HTMLDivElement | null>;
  iconRef: React.RefObject<HTMLDivElement | null>;
  bodyRef: React.RefObject<HTMLParagraphElement | null>;
  nameRef: React.RefObject<HTMLDivElement | null>;
  branchRef: React.RefObject<HTMLDivElement | null>;
  traceRef: React.RefObject<TraceCanvasHandle | null>;
  safeZoneDebug: SafeZoneDebug | null;
  onTraceEnd: (points: TracePoint[], isClosed: boolean) => void;
};

/**
 * トレース（なぞり書き）を行うメインステージコンポーネント
 *
 * 構造:
 * - レイヤー1 (最背面): ガイド画像（線画）
 * - レイヤー2: トレーシングCanvas（描画エリア）
 * - レイヤー3: 安全領域デバッグ表示（開発時のみ）
 * - レイヤー4: 中央のテキストコンテンツ（投稿内容）
 * - レイヤー5 (最前面): 四隅の装飾フレーム
 */
export function TraceStage({
  bodai,
  phraseLines,
  name,
  branchName,
  imageIndex = 0,
  bgImage,
  baseSize,
  strokeWidth = 8,
  canvasContainerRef,
  textGroupRef,
  iconRef,
  bodyRef,
  nameRef,
  branchRef,
  traceRef,
  safeZoneDebug,
  onTraceEnd,
}: TraceStageProps) {
  return (
    <div
      ref={canvasContainerRef}
      className="relative w-full aspect-square flex mb-16 items-center justify-center"
    >
      {/* 背景画像 */}
      {bgImage && (
        <div className="absolute inset-0 z-0">
          <NextImage
            src={bgImage}
            alt=""
            fill
            sizes="100%"
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* ガイド画像（なぞる対象の線画） */}
      {bodai.guide && bodai.guide[imageIndex] && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* コンテナサイズを固定して、SVGのアスペクト比維持と配置ズレを防ぐための方策 */}
          <div className="relative w-[340px] h-[340px]">
            <NextImage
              src={bodai.guide[imageIndex]}
              alt=""
              fill
              sizes="340px"
              className="object-contain"
            />
          </div>
        </div>
      )}

      {/* 描画用キャンバス */}
      <TraceCanvas
        ref={traceRef}
        className="absolute inset-0 z-10"
        baseSize={baseSize}
        strokeColor="rgba(255,255,255,1)"
        strokeWidth={strokeWidth}
        glowColor="rgba(255,255,255,1)"
        glowBlur={34}
        onTraceEnd={onTraceEnd}
      />

      {/* 安全領域のデバッグ表示（通常は非表示） */}
      <SafeZoneDebugOverlay debug={safeZoneDebug} />

      {/* 中央のテキストコンテンツ（なぞり書きの対象物＝囲む対象） */}
      <div className="relative z-20 flex flex-col items-center justify-center p-6 w-full h-full pointer-events-none">
        <div ref={textGroupRef} className="flex flex-col items-center">
          {/* アイコン（稲穂など） */}
          <div ref={iconRef} className="relative w-[60px] h-[60px] mb-4">
            <NextImage
              src={bodai.img}
              alt={bodai.name}
              fill
              sizes="60px"
              className="object-contain"
            />
          </div>

          <div className="flex flex-col items-center">
            {/* 投稿本文 */}
            <div className="text-center mb-3 w-full max-w-60">
              <p
                ref={bodyRef}
                className={`text-[18px] font-bold leading-normal break-all ${bodai.textColor}`}
              >
                {phraseLines.map((line, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <br />}
                    {line}
                  </React.Fragment>
                ))}
              </p>
            </div>

            {/* 氏名・支部名 */}
            <div className="text-[#262626] font-bold text-center">
              <div ref={nameRef} className="text-[18px] mb-1">
                {name}
              </div>
              {branchName && (
                <div ref={branchRef} className="text-[16px]">
                  {branchName}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
