'use client';

import NextImage from 'next/image';
import React from 'react';
import {
  TraceCanvas,
  type TraceCanvasHandle,
  type TracePoint,
} from '@/components/canvas/TraceCanvas';
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

export function TraceStage({
  bodai,
  phraseLines,
  name,
  branchName,
  imageIndex = 0,
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
      {bodai.guide && bodai.guide[imageIndex] && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
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

      <SafeZoneDebugOverlay debug={safeZoneDebug} />

      <div className="relative z-20 flex flex-col items-center justify-center p-6 w-full h-full pointer-events-none">
        <div ref={textGroupRef} className="flex flex-col items-center">
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
            <div className="text-center mb-3 w-full max-w-[240px]">
              <p
                ref={bodyRef}
                className={`text-[18px] font-bold leading-normal ${bodai.textColor}`}
              >
                {phraseLines.map((line, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <br />}
                    {line}
                  </React.Fragment>
                ))}
              </p>
            </div>

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

      <div className="absolute inset-0 z-30 pointer-events-none">
        <div className="absolute top-0 left-0 w-[81px] h-1 bg-[#ef7314]" />
        <div className="absolute top-0 left-0 w-1 h-[81px] bg-[#ef7314]" />
        <div className="absolute top-0 right-0 w-[81px] h-1 bg-[#ef7314]" />
        <div className="absolute top-0 right-0 w-1 h-[81px] bg-[#ef7314]" />
        <div className="absolute bottom-0 left-0 w-[81px] h-1 bg-[#ef7314]" />
        <div className="absolute bottom-0 left-0 w-1 h-[81px] bg-[#ef7314]" />
        <div className="absolute bottom-0 right-0 w-[81px] h-1 bg-[#ef7314]" />
        <div className="absolute bottom-0 right-0 w-1 h-[81px] bg-[#ef7314]" />
      </div>
    </div>
  );
}
