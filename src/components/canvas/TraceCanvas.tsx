'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import type { PointerEvent } from 'react';

import { type TracePoint } from '@/lib/trace-utils';
import { useTraceSparkles } from '@/hooks/useTraceSparkles';
import { startTouchSound, stopTouchSound } from '@/lib/sound';

// 外部から操作するためのハンドルの型定義
export type TraceCanvasHandle = {
  getPoints: () => TracePoint[]; // 現在の描画点リストを取得
  clear: () => void; // キャンバスをクリア
  setPoints: (points: TracePoint[], isClosed?: boolean) => void; // 外部から点をセット（再現用）
  getCanvasRect: () => DOMRect | null; // キャンバスの矩形情報を取得
};

type TraceCanvasProps = {
  className?: string;
  baseSize?: number; // 内部的な基準サイズ（座標計算用）
  strokeColor?: string; // 線の基本色
  strokeWidth?: number; // 線の太さ
  glowColor?: string; // 光彩の色
  glowBlur?: number; // 光彩のぼかし量
  sparkleColor?: string; // パーティクルの色
  onTraceEnd?: (points: TracePoint[], isClosed: boolean) => void; // 書き終わり時のコールバック
};

// 定数設定
const DEFAULT_BASE_SIZE = 1024; // デフォルトの基準サイズ
const MIN_DISTANCE_BASE = 3; // 点を追加する最小距離（間引き用）
const MAX_POINTS = 2000; // 最大点数（これを超えると間引き処理が強くなる）
const CLOSE_SEGMENTS = 12; // 輪郭を閉じる際に補間するセグメント数
const RESUME_THRESHOLD_BASE = 30; // 書き足しを許容する距離閾値
const CLOSE_THRESHOLD_RATIO = 0.06; // 始点と終点がこの比率以内の距離なら閉じたとみなす
const CLOSE_THRESHOLD_MAX = 60; // 閉じる判定の最大ピクセル距離
const MIN_CLOSE_LENGTH_RATIO = 0.2; // 閉じる判定を行うための最小パス長（誤検知防止）
const MAX_PARTICLES = 110; // 最大パーティクル数（useTraceSparkles側で使用）

export const TraceCanvas = forwardRef<TraceCanvasHandle, TraceCanvasProps>(
  function TraceCanvas(
    {
      className,
      baseSize = DEFAULT_BASE_SIZE,
      strokeColor = '#ffffff',
      strokeWidth = 6,
      glowColor = 'rgba(255,255,255,0.8)',
      glowBlur = 10,
      sparkleColor = 'rgba(255,255,255,0.95)',
      onTraceEnd,
    },
    ref
  ) {
    // DOM参照
    const containerRef = useRef<HTMLDivElement | null>(null);
    const strokeCanvasRef = useRef<HTMLCanvasElement | null>(null); // 線画用キャンバス
    const effectCanvasRef = useRef<HTMLCanvasElement | null>(null); // エフェクト用キャンバス

    // 状態管理（Refを使用し、再レンダリングを抑制）
    const pointsRef = useRef<TracePoint[]>([]); // 描画された点の配列
    const pathLengthRef = useRef(0); // 描画されたパスの総延長
    const closeCandidateIndexRef = useRef<number | null>(null); // 閉じる候補となる点のインデックス

    // UIロジック制御フラグ
    const isDrawingRef = useRef(false); // 描画中かどうか
    const isClosedRef = useRef(false); // パスが閉じられたかどうか

    // ビューポート管理
    const viewScaleRef = useRef(1); // 基準サイズに対する現在の表示倍率
    const viewSizeRef = useRef(0); // 現在の表示サイズ（ピクセル）

    // パーティクル（キラキラ）エフェクトのロジックをフックに委譲
    const { spawnSparkles, resetSparkles, redrawSparkles } = useTraceSparkles({
      effectCanvasRef,
      baseSize,
      sparkleColor,
      viewScaleRef,
      viewSizeRef,
    });

    /**
     * キャンバスのクリア処理
     * 線画用キャンバスをクリアし、エフェクト側もリセット時は別途呼ばれる
     */
    const clearCanvas = useCallback(() => {
      const strokeCanvas = strokeCanvasRef.current;
      if (strokeCanvas) {
        const ctx = strokeCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, viewSizeRef.current, viewSizeRef.current);
        }
      }
      // エフェクト用キャンバスは resetSparkles -> redrawSparkles で処理されるためここでは触らない
    }, []);

    /**
     * ストローク（線）の再描画処理
     * 保存されている pointsRef の点データをもとに、現在のサイズに合わせて線を描画する
     * 3層構造（光彩の外側、光彩の内側、芯線）で発光感を表現
     */
    const redrawStroke = useCallback(() => {
      const canvas = strokeCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const points = pointsRef.current;

      // 描画領域をクリア
      ctx.clearRect(0, 0, viewSizeRef.current, viewSizeRef.current);
      if (points.length < 2) return;

      const viewScale = viewScaleRef.current;
      const scaledGlowBlur = Math.max(0, glowBlur * viewScale);
      const lineWidth = Math.max(1, strokeWidth * viewScale);

      // パスを作成するヘルパー関数
      const path = () => {
        ctx.beginPath();
        points.forEach((point, index) => {
          // 基準座標系から表示座標系へ変換
          const x = point.x * viewScale;
          const y = point.y * viewScale;
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
      };

      // 1層目: 外側の光彩（太く、薄く）
      ctx.save();
      ctx.globalCompositeOperation = 'lighter'; // 加算合成で光を表現
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = lineWidth * 2.4;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = scaledGlowBlur * 1.4;
      path();
      ctx.stroke();
      ctx.restore();

      // 2層目: 内側の光彩（少し細く、濃く）
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = lineWidth * 1.6;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = scaledGlowBlur * 0.8;
      path();
      ctx.stroke();
      ctx.restore();

      // 3層目: 芯線（本来の色でくっきりと）
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      path();
      ctx.stroke();
      ctx.restore();
    }, [strokeColor, strokeWidth, glowColor, glowBlur]);

    /**
     * キャンバスのリサイズ処理
     * 親要素のサイズに合わせてキャンバスの解像度（width/height属性）と表示サイズ（style）を調整
     */
    const resizeCanvas = useCallback(() => {
      const container = containerRef.current;
      const strokeCanvas = strokeCanvasRef.current;
      const effectCanvas = effectCanvasRef.current;
      if (!container || !strokeCanvas || !effectCanvas) return;

      // コンテナの現在サイズを取得
      const rect = container.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height);
      if (!size) return;

      // Retinaディスプレイ対応
      const ratio = window.devicePixelRatio || 1;

      // スケール計算（基準サイズ 1024px に対してどれくらい縮小されているか）
      viewScaleRef.current = size / baseSize;
      viewSizeRef.current = size;

      // 線画用キャンバスの設定
      strokeCanvas.width = size * ratio;
      strokeCanvas.height = size * ratio;
      strokeCanvas.style.width = `${size}px`;
      strokeCanvas.style.height = `${size}px`;

      // エフェクト用キャンバスの設定
      effectCanvas.width = size * ratio;
      effectCanvas.height = size * ratio;
      effectCanvas.style.width = `${size}px`;
      effectCanvas.style.height = `${size}px`;

      // コンテキストのスケール設定（CSSピクセルと物理ピクセルの比率合わせ）
      const strokeCtx = strokeCanvas.getContext('2d');
      if (strokeCtx) {
        strokeCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
      }

      const effectCtx = effectCanvas.getContext('2d');
      if (effectCtx) {
        effectCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
      }

      // サイズ変更に合わせて再描画
      redrawStroke();
      redrawSparkles();
    }, [baseSize, redrawStroke, redrawSparkles]);

    /**
     * 座標変換処理
     * ポインターイベントの座標（クライアント座標）を、基準サイズ（1024x1024）の座標系に変換する
     */
    const toBasePoint = useCallback(
      (event: PointerEvent<HTMLCanvasElement>): TracePoint | null => {
        const container = containerRef.current;
        if (!container) return null;
        const rect = container.getBoundingClientRect();
        if (!rect.width || !rect.height) return null;

        const size = Math.min(rect.width, rect.height);
        const scale = baseSize / size; // 逆数を掛けて元のサイズに戻す

        // コンテナ左上からの相対座標を計算し、スケールを適用
        const rawX = (event.clientX - rect.left) * scale;
        const rawY = (event.clientY - rect.top) * scale;

        // 範囲外に出ないようにクランプ
        const x = Math.max(0, Math.min(baseSize, rawX));
        const y = Math.max(0, Math.min(baseSize, rawY));

        return { x, y, t: Date.now() };
      },
      [baseSize]
    );

    /**
     * 点を追加する処理
     * 最小距離以上離れている場合のみ点を追加し、間引きを行う
     * また、始点に近い場合は「閉じる候補」として判定する
     */
    const appendPoint = useCallback(
      (point: TracePoint) => {
        const points = pointsRef.current;
        const last = points[points.length - 1];

        // 点が多い場合は間引き距離を広げて負荷を下げる
        const threshold =
          points.length >= MAX_POINTS
            ? MIN_DISTANCE_BASE * 2
            : MIN_DISTANCE_BASE;

        // 最初の点の場合
        if (!last) {
          points.push(point);
          spawnSparkles(point); // キラキラ発生
          return;
        }

        // 前回の点との距離を計算
        const distance = Math.hypot(point.x - last.x, point.y - last.y);

        // 閾値以上離れていたら追加
        if (distance >= threshold) {
          pathLengthRef.current += distance; // 総延長を加算
          points.push(point);

          // 閉じる判定の閾値計算
          const closeThreshold = Math.min(
            CLOSE_THRESHOLD_MAX,
            baseSize * CLOSE_THRESHOLD_RATIO
          );

          // 一定以上の長さ書いていて、始点に近い場所に戻ってきたか？
          const canClose =
            pathLengthRef.current >= baseSize * MIN_CLOSE_LENGTH_RATIO;
          const start = points[0];
          if (
            canClose &&
            points.length > 3 &&
            Math.hypot(point.x - start.x, point.y - start.y) <= closeThreshold
          ) {
            // 閉じる候補としてインデックスを記録
            closeCandidateIndexRef.current = points.length - 1;
          }

          spawnSparkles(point); // キラキラ発生
        }
      },
      [baseSize, spawnSparkles]
    );

    /**
     * パスの確定処理（指を離した時など）
     * 閉じる条件を満たしていれば、始点と終点を滑らかに繋いで閉じた形にする
     */
    const finalizePath = useCallback(() => {
      let points = pointsRef.current;
      if (points.length < 2) return;

      // パスが短すぎる場合は閉じる判定をキャンセル
      const minCloseLength = baseSize * MIN_CLOSE_LENGTH_RATIO;
      if (pathLengthRef.current < minCloseLength) {
        closeCandidateIndexRef.current = null;
        isClosedRef.current = false;
        return;
      }

      const closeThreshold = Math.min(
        CLOSE_THRESHOLD_MAX,
        baseSize * CLOSE_THRESHOLD_RATIO
      );
      const start = points[0];
      const end = points[points.length - 1];
      const distanceToStart = Math.hypot(end.x - start.x, end.y - start.y);
      const closeIndex = closeCandidateIndexRef.current;

      // 最終点が始点から遠い場合は閉じない
      if (distanceToStart > closeThreshold) {
        closeCandidateIndexRef.current = null;
        isClosedRef.current = false;
        return;
      }

      // 閉じる処理：候補点以降の余分な点をカット
      if (closeIndex !== null && closeIndex < points.length - 1) {
        points = points.slice(0, closeIndex + 1);
        pointsRef.current = points;
      }

      // 始点と終点をベジェ曲線で滑らかに接続する補間処理
      const closePoint = points[points.length - 1];
      const prev = points[points.length - 2] ?? closePoint;
      const next = points[1] ?? start;
      const endVector = {
        x: closePoint.x - prev.x,
        y: closePoint.y - prev.y,
      };
      const startVector = {
        x: next.x - start.x,
        y: next.y - start.y,
      };
      const normalize = (vector: { x: number; y: number }) => {
        const length = Math.hypot(vector.x, vector.y) || 1;
        return { x: vector.x / length, y: vector.y / length };
      };
      const endDir = normalize(endVector);
      const startDir = normalize(startVector);
      const anchorDistance = Math.hypot(
        closePoint.x - start.x,
        closePoint.y - start.y
      );
      const tangent = Math.min(anchorDistance * 0.5, baseSize * 0.12);

      // 制御点の計算
      const control1 = {
        x: closePoint.x + endDir.x * tangent,
        y: closePoint.y + endDir.y * tangent,
      };
      const control2 = {
        x: start.x - startDir.x * tangent,
        y: start.y - startDir.y * tangent,
      };

      // 補間点を生成して追加
      for (let i = 1; i <= CLOSE_SEGMENTS; i += 1) {
        const t = i / CLOSE_SEGMENTS;
        const mt = 1 - t;
        const x =
          mt * mt * mt * closePoint.x +
          3 * mt * mt * t * control1.x +
          3 * mt * t * t * control2.x +
          t * t * t * start.x;
        const y =
          mt * mt * mt * closePoint.y +
          3 * mt * mt * t * control1.y +
          3 * mt * t * t * control2.y +
          t * t * t * start.y;
        points.push({ x, y, t: end.t });
      }

      closeCandidateIndexRef.current = null;
      isClosedRef.current = true; // 閉じた状態にする
    }, [baseSize]);

    /**
     * パスのリセット処理
     * 全ての点と状態をクリアする
     */
    const resetPath = useCallback(() => {
      pointsRef.current = [];
      pathLengthRef.current = 0;
      closeCandidateIndexRef.current = null;
      isClosedRef.current = false;

      resetSparkles(); // パーティクルもリセット
      clearCanvas();
    }, [clearCanvas, resetSparkles]);

    /**
     * Pointer Down イベントハンドラ
     * 描画開始、または書き足し判定を行う
     */
    const handlePointerDown = useCallback(
      (event: PointerEvent<HTMLCanvasElement>) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        event.preventDefault();
        const point = toBasePoint(event);
        if (!point) return;

        // 既に描画がある場合の処理
        if (pointsRef.current.length > 0) {
          if (isClosedRef.current) {
            resetPath(); // 閉じた後は新規書き直し
          } else {
            // 閉じていない場合、最後の点から近ければ書き足し（続きから）とみなす
            const last = pointsRef.current[pointsRef.current.length - 1];
            const resumeThreshold = Math.min(
              RESUME_THRESHOLD_BASE,
              baseSize * 0.03
            );
            const distance = Math.hypot(point.x - last.x, point.y - last.y);
            // 遠すぎる場合は別ラインとみなしてリセット（一筆書き仕様）
            if (distance > resumeThreshold) {
              resetPath();
            }
          }
        }

        isDrawingRef.current = true;
        event.currentTarget.setPointerCapture(event.pointerId); // ポインターキャプチャで外れても追跡
        appendPoint(point);
        redrawStroke();
        startTouchSound(); // タッチ音開始
      },
      [appendPoint, baseSize, redrawStroke, resetPath, toBasePoint]
    );

    /**
     * Pointer Move イベントハンドラ
     * 描画中の移動処理
     * 始点に近づいたら自動で閉じてプレビューを表示
     */
    const handlePointerMove = useCallback(
      (event: PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current) return;
        event.preventDefault();
        const point = toBasePoint(event);
        if (!point) return;
        appendPoint(point);
        redrawStroke();

        // 始点に近づいたら自動で閉じる
        const points = pointsRef.current;
        const minCloseLength = baseSize * MIN_CLOSE_LENGTH_RATIO;
        if (points.length > 10 && pathLengthRef.current >= minCloseLength) {
          const start = points[0];
          const closeThreshold = Math.min(
            CLOSE_THRESHOLD_MAX,
            baseSize * CLOSE_THRESHOLD_RATIO
          );
          const distanceToStart = Math.hypot(point.x - start.x, point.y - start.y);

          if (distanceToStart <= closeThreshold) {
            // 自動で閉じる
            isDrawingRef.current = false;
            stopTouchSound();
            finalizePath();
            redrawStroke();
            onTraceEnd?.([...pointsRef.current], isClosedRef.current);
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }
      },
      [appendPoint, baseSize, finalizePath, onTraceEnd, redrawStroke, toBasePoint]
    );

    /**
     * Pointer Up イベントハンドラ
     * 描画終了時の処理。閉じる判定などを行う
     */
    const handlePointerUp = useCallback(
      (event: PointerEvent<HTMLCanvasElement>) => {
        console.log('handlePointerUp called, isDrawing:', isDrawingRef.current);
        if (!isDrawingRef.current) return;
        event.preventDefault();
        isDrawingRef.current = false;
        stopTouchSound(); // タッチ音停止
        finalizePath(); // パスの確定・閉じる処理
        redrawStroke();
        console.log('calling onTraceEnd, points:', pointsRef.current.length);
        onTraceEnd?.([...pointsRef.current], isClosedRef.current);
        event.currentTarget.releasePointerCapture(event.pointerId);
      },
      [finalizePath, onTraceEnd, redrawStroke]
    );

    const handlePointerCancel = useCallback(
      (event: PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current) return;
        event.preventDefault();
        isDrawingRef.current = false;
        stopTouchSound(); // タッチ音停止
        finalizePath();
        redrawStroke();
        onTraceEnd?.([...pointsRef.current], isClosedRef.current);
        event.currentTarget.releasePointerCapture(event.pointerId);
      },
      [finalizePath, onTraceEnd, redrawStroke]
    );

    // 外部に公開するメソッド定義
    useImperativeHandle(
      ref,
      () => ({
        getPoints: () => [...pointsRef.current],
        clear: () => resetPath(),
        setPoints: (points: TracePoint[], isClosed = true) => {
          pointsRef.current = points;
          pathLengthRef.current = 0;
          // パス長を再計算
          for (let i = 1; i < points.length; i += 1) {
            const prev = points[i - 1];
            const current = points[i];
            pathLengthRef.current += Math.hypot(
              current.x - prev.x,
              current.y - prev.y
            );
          }
          closeCandidateIndexRef.current = isClosed
            ? Math.max(0, points.length - 1)
            : null;
          isClosedRef.current = isClosed;
          redrawStroke();
        },
        getCanvasRect: () => {
          const container = containerRef.current;
          return container ? container.getBoundingClientRect() : null;
        },
      }),
      [redrawStroke, resetPath]
    );

    // リサイズ監視の設定
    useEffect(() => {
      resizeCanvas();
      const container = containerRef.current;
      if (!container) return;
      const observer = new ResizeObserver(() => {
        resizeCanvas();
      });
      observer.observe(container);
      return () => observer.disconnect();
    }, [resizeCanvas]);

    // Cleanupアニメーションフレームなどはフック側で行うためここでは不要

    const hasPositionClass =
      className?.includes('absolute') ||
      className?.includes('fixed') ||
      className?.includes('relative') ||
      className?.includes('sticky');
    const containerClassName = className
      ? hasPositionClass
        ? className
        : `relative ${className}`
      : 'relative';

    return (
      <div ref={containerRef} className={containerClassName}>
        {/* 線画用キャンバス（背面） */}
        <canvas
          ref={strokeCanvasRef}
          className="absolute top-0 left-0 z-0 pointer-events-none"
          aria-hidden="true"
        />
        {/* エフェクト＆操作用キャンバス（前面） */}
        <canvas
          ref={effectCanvasRef}
          className="absolute top-0 left-0 z-10 touch-none select-none bg-transparent"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          aria-label="なぞりキャンバス"
        />
      </div>
    );
  }
);
