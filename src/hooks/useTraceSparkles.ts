import { useCallback, useEffect, useRef } from 'react';
import type { TracePoint } from '@/lib/trace-utils';

const MAX_PARTICLES = 110; // 最大パーティクル数

// パーティクル1粒子の定義
type SparkleParticle = {
  x: number; // 座標X（基準サイズ基準）
  y: number; // 座標Y
  vx: number; // 速度X
  vy: number; // 速度Y
  life: number; // 現在の生存時間
  ttl: number; // 寿命（Time To Live）
  size: number; // 基本サイズ
  phase: number; // 点滅アニメーションの位相オフセット
  twinkle: number; // 点滅速度
};

type UseTraceSparklesProps = {
  effectCanvasRef: React.RefObject<HTMLCanvasElement | null>; // エフェクト描画用キャンバス
  baseSize: number; // 基準サイズ（座標計算用）
  sparkleColor?: string; // 基本色
  viewScaleRef: React.MutableRefObject<number>; // 現在の表示スケール
  viewSizeRef: React.MutableRefObject<number>; // 現在の表示ピクセルサイズ
};

/**
 * 軌跡描画時のキラキラ（パーティクル）エフェクトを管理するフック
 *
 * 機能:
 * - パーティクルの生成（spawn）
 * - アニメーションループの管理（requestAnimationFrame）
 * - 物理演算（ようなもの）による位置更新
 * - キャンバスへのレンダリング
 */
export function useTraceSparkles({
  effectCanvasRef,
  baseSize,
  sparkleColor = 'rgba(255,255,255,0.95)',
  viewScaleRef,
  viewSizeRef,
}: UseTraceSparklesProps) {
  const particlesRef = useRef<SparkleParticle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  /**
   * パーティクルの再描画処理
   * 全てのパーティクルを現在の位置と状態に基づいて描画する
   */
  const redrawParticles = useCallback(() => {
    const canvas = effectCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const particles = particlesRef.current;

    // 描画領域をクリア
    ctx.clearRect(0, 0, viewSizeRef.current, viewSizeRef.current);
    if (particles.length === 0) return;

    const viewScale = viewScaleRef.current;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter'; // 加算合成できれいに光らせる
    const lineThickness = Math.max(0.5, viewScale * 0.7);

    particles.forEach((particle) => {
      // 寿命の進行度 (0.0 -> 1.0)
      const progress = particle.life / particle.ttl;
      if (progress >= 1) return;

      // 点滅計算: 正弦波を使って明滅させる
      const twinkle =
        0.6 + 0.4 * Math.sin(particle.phase + particle.life * particle.twinkle);

      // フェードアウト処理
      const alpha = (1 - progress) * (0.5 + twinkle * 0.5);
      const radius = particle.size * (0.6 + twinkle * 0.6) * viewScale;
      // 座標変換
      const x = particle.x * viewScale;
      const y = particle.y * viewScale;

      // 本体（光の玉）描画
      ctx.shadowColor = sparkleColor;
      ctx.shadowBlur = Math.max(6, radius * 6);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // 十字のきらめき線（クロスフィルタ風）描画
      ctx.shadowBlur = Math.max(4, radius * 4);
      ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.8})`;
      ctx.lineWidth = lineThickness;
      ctx.beginPath();
      ctx.moveTo(x - radius * 2.4, y);
      ctx.lineTo(x + radius * 2.4, y);
      ctx.moveTo(x, y - radius * 2.4);
      ctx.lineTo(x, y + radius * 2.4);
      ctx.stroke();
    });
    ctx.restore();
  }, [sparkleColor, effectCanvasRef, viewScaleRef, viewSizeRef]);

  /**
   * パーティクルの状態更新
   * 位置を速度に応じて更新し、寿命を迎えたものを削除する
   */
  const updateParticles = useCallback((deltaMs: number) => {
    if (deltaMs <= 0) return;
    const particles = particlesRef.current;
    if (particles.length === 0) return;

    const next: SparkleParticle[] = [];
    for (const particle of particles) {
      const life = particle.life + deltaMs;
      // 寿命内であれば位置を更新して次フレームに引き継ぐ
      if (life < particle.ttl) {
        next.push({
          ...particle,
          life,
          x: particle.x + particle.vx * deltaMs,
          y: particle.y + particle.vy * deltaMs,
        });
      }
    }
    particlesRef.current = next;
  }, []);

  /**
   * アニメーションループの開始
   * requestAnimationFrameを使用してループさせる
   * パーティクルが存在しなくなるまでループは続く
   */
  const startAnimationLoop = useCallback(() => {
    if (animationFrameRef.current !== null) return;

    const step = (time: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
      }
      const deltaMs = time - lastTimeRef.current;

      // フレームレート制限（約30FPS以上で動作するように）
      if (deltaMs < 33) {
        animationFrameRef.current = window.requestAnimationFrame(step);
        return;
      }

      // 経過時間のキャップ（タブ切り替え復帰時などの飛び跳ね防止）
      const delta = Math.min(48, deltaMs);
      lastTimeRef.current = time;

      updateParticles(delta);
      redrawParticles();

      // 生きているパーティクルがいればループ継続、いなければ停止
      if (particlesRef.current.length > 0) {
        animationFrameRef.current = window.requestAnimationFrame(step);
      } else {
        animationFrameRef.current = null;
        lastTimeRef.current = null;
      }
    };
    animationFrameRef.current = window.requestAnimationFrame(step);
  }, [redrawParticles, updateParticles]);

  /**
   * 新しいパーティクルを発生させる
   * 描画点周辺にランダムに散らす
   */
  const spawnSparkles = useCallback(
    (point: TracePoint) => {
      const spawnCount = 2; // 一度に追加する数
      for (let i = 0; i < spawnCount; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.02 + Math.random() * 0.04; // 速度のランダム性
        const ttl = 260 + Math.random() * 280; // 寿命のランダム性
        const size = 1.9 + Math.random() * 2.2; // サイズのランダム性

        particlesRef.current.push({
          x: point.x + (Math.random() - 0.5) * 6, // 発生位置のばらつき
          y: point.y + (Math.random() - 0.5) * 6,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.012, // 少し上に浮き上がる重力補正
          life: 0,
          ttl,
          size,
          phase: Math.random() * Math.PI * 2,
          twinkle: 0.018 + Math.random() * 0.02,
        });
      }
      // 最大数を超えたら古いものから削除
      if (particlesRef.current.length > MAX_PARTICLES) {
        particlesRef.current.splice(
          0,
          particlesRef.current.length - MAX_PARTICLES
        );
      }
      // アニメーションループが止まっていたら再開
      startAnimationLoop();
    },
    [startAnimationLoop]
  );

  /**
   * パーティクルのリセット処理
   * 即座にすべて消去し、ループを停止する
   */
  const resetSparkles = useCallback(() => {
    particlesRef.current = [];
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      lastTimeRef.current = null;
    }
    redrawParticles(); // 画面クリアのために呼び出す
  }, [redrawParticles]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    spawnSparkles,
    resetSparkles,
    redrawSparkles: redrawParticles,
  };
}
