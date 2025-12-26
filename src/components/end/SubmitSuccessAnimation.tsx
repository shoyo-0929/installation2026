'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import NextImage from 'next/image';

type AnimationPhase = 'idle' | 'fadeIn' | 'waiting' | 'flyAway' | 'done';

type SubmitSuccessAnimationProps = {
  open: boolean;
  imageUrl: string | null;
  onComplete: () => void;
};

type Sparkle = {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
};

const FADE_IN_DURATION = 2000;
const WAIT_DURATION = 1500;
const FLY_AWAY_DURATION = 4000;
const SPARKLE_COUNT = 20;

function generateSparkles(): Sparkle[] {
  return Array.from({ length: SPARKLE_COUNT }, (_, i) => ({
    id: i,
    // 画面全体にランダム配置（0〜100%）
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 10 + 6, // 6〜16px
    delay: Math.random() * 2, // 0〜2秒
    duration: Math.random() * 1 + 1, // 1〜2秒
  }));
}

export function SubmitSuccessAnimation({
  open,
  imageUrl,
  onComplete,
}: SubmitSuccessAnimationProps) {
  const [phase, setPhase] = useState<AnimationPhase>('idle');

  // キラキラの位置をメモ化（openが変わるたびに再生成）
  const sparkles = useMemo(() => generateSparkles(), [open]);

  const startAnimation = useCallback(() => {
    setPhase('fadeIn');

    // フェードイン完了後 → 待機
    setTimeout(() => {
      setPhase('waiting');

      // 待機後 → 飛んでいく
      setTimeout(() => {
        setPhase('flyAway');

        // 飛んでいくアニメーション完了後 → 完了
        setTimeout(() => {
          setPhase('done');
          onComplete();
        }, FLY_AWAY_DURATION);
      }, WAIT_DURATION);
    }, FADE_IN_DURATION);
  }, [onComplete]);

  useEffect(() => {
    if (open && imageUrl && phase === 'idle') {
      startAnimation();
    }
    if (!open) {
      setPhase('idle');
    }
  }, [open, imageUrl, phase, startAnimation]);

  if (!open || phase === 'idle' || phase === 'done') return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black">
      {/* 背景全体のキラキラエフェクト */}
      {(phase === 'fadeIn' || phase === 'waiting' || phase === 'flyAway') &&
        sparkles.map((sparkle) => (
          <div
            key={sparkle.id}
            className="fixed animate-sparkle pointer-events-none"
            style={{
              left: `${sparkle.x}%`,
              top: `${sparkle.y}%`,
              width: sparkle.size,
              height: sparkle.size,
              animationDelay: `${sparkle.delay}s`,
              animationDuration: `${sparkle.duration}s`,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-full h-full"
            >
              <path
                d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"
                fill="white"
              />
            </svg>
          </div>
        ))}

      {/* 画像コンテナ */}
      <div
        className={`
          relative w-64 h-64 rounded-2xl overflow-hidden shadow-2xl
          ${phase === 'fadeIn' ? 'animate-submit-fade-in' : ''}
          ${phase === 'waiting' ? 'opacity-100' : ''}
          ${phase === 'flyAway' ? 'animate-submit-fly-away' : ''}
        `}
      >
        {imageUrl && (
          <NextImage
            src={imageUrl}
            alt="送信画像"
            fill
            sizes="256px"
            className="object-contain"
            unoptimized
          />
        )}
      </div>

      {/* 送信中のテキスト */}
      <p
        className={`
          absolute bottom-24 text-white text-lg font-bold
          ${phase === 'fadeIn' ? 'animate-submit-fade-in' : ''}
          ${phase === 'flyAway' ? 'animate-submit-text-fade-out' : ''}
        `}
      >
        アートスペースに送信しています...
      </p>
    </div>
  );
}
