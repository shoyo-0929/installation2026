import { useState, useCallback } from 'react';
import type { TracePoint } from '@/lib/trace-utils';
import {
  type SafeZoneInfo,
  getSafeZoneDistanceRatio,
  getSafeZoneCenter,
  isLoopedPath,
  isPointInsidePath,
  SAFE_ZONE_RESET_RADIUS_RATIO,
  SAFE_ZONE_WARN_RADIUS_RATIO,
} from '@/lib/trace-utils';
import { playDoneSound } from '@/lib/sound';

type UseTraceLogicProps = {
  getSafeZoneInfo: () => SafeZoneInfo | null; // 安全領域情報を取得する関数
  resetGeneratedImage: () => void; // 生成済み画像をリセットする関数
};

/**
 * トレース操作（なぞり書き）に関連するビジネスロジックを管理するフック
 *
 * 機能:
 * - 安全領域（Safe Zone）の判定
 * - 一筆書き、閉じたパスの判定
 * - 警告、リセット、プレビュー等のUI状態管理
 */
export const useTraceLogic = ({
  getSafeZoneInfo,
  resetGeneratedImage,
}: UseTraceLogicProps) => {
  // 安全領域違反時の警告比率（null以外なら警告中）
  const [safeZoneWarningRatio, setSafeZoneWarningRatio] = useState<
    number | null
  >(null);

  // 各種ダイアログの表示状態
  const [safeZoneResetOpen, setSafeZoneResetOpen] = useState(false); // リセット確認
  const [safeZoneUnclosedOpen, setSafeZoneUnclosedOpen] = useState(false); // 閉じてない警告

  // フラグ管理
  const [traceReady, setTraceReady] = useState(false); // トレース完了（画像生成待ち）状態
  const [previewOpen, setPreviewOpen] = useState(false); // プレビューダイアログ表示

  /**
   * トレース状態を完全にリセットする
   * 再挑戦時などに呼ばれる
   */
  const resetTraceState = useCallback(() => {
    setSafeZoneWarningRatio(null);
    setSafeZoneResetOpen(false);
    setSafeZoneUnclosedOpen(false);
    setTraceReady(false);
    setPreviewOpen(false);
    resetGeneratedImage();
  }, [resetGeneratedImage]);

  /**
   * トレース終了時（指を離した時）のハンドラ
   * パスの形状や位置を分析し、次のアクション（警告、完了など）を決定する
   */
  const handleTraceEnd = useCallback(
    (points: TracePoint[], isClosed: boolean) => {
      console.log('handleTraceEnd called, points:', points.length, 'isClosed:', isClosed);
      const safeZoneInfo = getSafeZoneInfo();
      if (!safeZoneInfo) {
        console.log('safeZoneInfo is null');
        return;
      }

      // 1. 安全領域からの距離をチェック
      const distanceRatio = getSafeZoneDistanceRatio(points, safeZoneInfo);
      if (distanceRatio !== null) {
        // テキストにかかりすぎている（リセット推奨レベル）
        if (distanceRatio <= SAFE_ZONE_RESET_RADIUS_RATIO) {
          setSafeZoneWarningRatio(null);
          setSafeZoneUnclosedOpen(false);
          setSafeZoneResetOpen(true);
          setTraceReady(false);
          return;
        }
        // テキストに近い（警告レベル）
        if (distanceRatio <= SAFE_ZONE_WARN_RADIUS_RATIO) {
          setSafeZoneWarningRatio(distanceRatio);
          setSafeZoneUnclosedOpen(false);
          setSafeZoneResetOpen(false);
          setTraceReady(false);
          return;
        }
      }

      // 2. パスが閉じているか、あるいはループしているかチェック
      const isLooped = isClosed || isLoopedPath(points);
      if (!isLooped) {
        // 閉じていない場合は警告などは出さず、ただ完了扱いにもしない（書き足し待ち）
        // ただし、明示的に終了判定をするならここで警告を出すことも可能
        // 現状の仕様では「閉じていない＝未完了」として扱う
        setSafeZoneUnclosedOpen(false);
        setTraceReady(false);
        return;
      }

      // 3. 領域の中心（テキスト）を囲んでいるかチェック
      const center = getSafeZoneCenter(safeZoneInfo);
      const isCenterInside = isPointInsidePath(points, center);

      if (isCenterInside) {
        // 成功パターン：テキストを囲んでいる
        resetGeneratedImage();
        setSafeZoneUnclosedOpen(false);
        setTraceReady(true);
        playDoneSound(); // 確定モーダル表示時の効果音
        // traceReady -> true になると、Mainコンポーネント側のuseEffectでpreviewOpen -> trueになる
        return;
      }

      // テキストを囲めていない場合（外側で円を描いた場合など）
      setSafeZoneWarningRatio(null);
      setSafeZoneResetOpen(false);
      setSafeZoneUnclosedOpen(true); // 「囲めていません」的な警告を表示（変数名はunclosedだが意味合い注意）
      setTraceReady(false);
    },
    [getSafeZoneInfo, resetGeneratedImage]
  );

  return {
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
  };
};
