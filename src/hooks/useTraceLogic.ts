import { useState, useCallback } from 'react';
import type { TracePoint } from '@/components/canvas/TraceCanvas';
import {
  type SafeZoneInfo,
  getSafeZoneDistanceRatio,
  getSafeZoneCenter,
  isLoopedPath,
  isPointInsidePath,
  SAFE_ZONE_RESET_RADIUS_RATIO,
  SAFE_ZONE_WARN_RADIUS_RATIO,
} from '@/lib/trace-utils';

type UseTraceLogicProps = {
  getSafeZoneInfo: () => SafeZoneInfo | null;
  resetGeneratedImage: () => void;
};

export const useTraceLogic = ({
  getSafeZoneInfo,
  resetGeneratedImage,
}: UseTraceLogicProps) => {
  const [safeZoneWarningRatio, setSafeZoneWarningRatio] = useState<
    number | null
  >(null);
  const [safeZoneResetOpen, setSafeZoneResetOpen] = useState(false);
  const [safeZoneUnclosedOpen, setSafeZoneUnclosedOpen] = useState(false);
  const [traceReady, setTraceReady] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const resetTraceState = useCallback(() => {
    setSafeZoneWarningRatio(null);
    setSafeZoneResetOpen(false);
    setSafeZoneUnclosedOpen(false);
    setTraceReady(false);
    setPreviewOpen(false);
    resetGeneratedImage();
  }, [resetGeneratedImage]);

  const handleTraceEnd = useCallback(
    (points: TracePoint[], isClosed: boolean) => {
      const safeZoneInfo = getSafeZoneInfo();
      if (!safeZoneInfo) return;

      const distanceRatio = getSafeZoneDistanceRatio(points, safeZoneInfo);
      if (distanceRatio !== null) {
        if (distanceRatio <= SAFE_ZONE_RESET_RADIUS_RATIO) {
          setSafeZoneWarningRatio(null);
          setSafeZoneUnclosedOpen(false);
          setSafeZoneResetOpen(true);
          setTraceReady(false);
          return;
        }
        if (distanceRatio <= SAFE_ZONE_WARN_RADIUS_RATIO) {
          setSafeZoneWarningRatio(distanceRatio);
          setSafeZoneUnclosedOpen(false);
          setSafeZoneResetOpen(false);
          setTraceReady(false);
          return;
        }
      }

      const isLooped = isClosed || isLoopedPath(points);
      if (!isLooped) {
        setSafeZoneUnclosedOpen(false);
        setTraceReady(false);
        return;
      }

      const center = getSafeZoneCenter(safeZoneInfo);

      // Note: isPointInsidePath logic for canvas path checking
      // For hook usage, we assume canvas is not easily accessible here or we pass it?
      // Main.tsx used hitTestCanvasRef.
      // We can use the simple polygon check for now or move hitTest logic here if we pass a canvas creator?
      // For simplicity in decoupling, trace-utils's isPointInsidePath creates its own canvas if needed.
      const isCenterInside = isPointInsidePath(points, center);

      if (isCenterInside) {
        resetGeneratedImage();
        setSafeZoneUnclosedOpen(false);
        setTraceReady(true);
        // We don't setPreviewOpen(true) here immediately?
        // In original code: setTraceReady(true) -> useEffect triggers -> setPreviewOpen(true).
        // Let's keep that pattern or simplify?
        // We'll let the consumer handle the side effect or do it here?
        // Let's stick to state updates here.
        return;
      }

      setSafeZoneWarningRatio(null);
      setSafeZoneResetOpen(false);
      setSafeZoneUnclosedOpen(true);
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
