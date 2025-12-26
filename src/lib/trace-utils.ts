import { isPointInsidePolygon, type Point } from '@/lib/geometry';
import type { TracePoint } from '@/components/TraceCanvas';

export const BASE_CANVAS_SIZE = 1024;
export const SAFE_ZONE_PADDING = 40;
export const SAFE_ZONE_WARN_RADIUS_RATIO = 0.9;
export const SAFE_ZONE_RESET_RADIUS_RATIO = 0.7;
export const TRACE_STROKE_WIDTH = 8;
export const SAFE_ZONE_CENTER_TOLERANCE = 12;
export const LOOP_CLOSE_THRESHOLD_RATIO = 0.06;
export const LOOP_CLOSE_THRESHOLD_MAX = 60;
export const LOOP_MIN_LENGTH_RATIO = 0.05;

export type SafeZoneInfo = {
  scale: number;
  toBaseRect: (rect: DOMRect) => {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  safeZoneX: number;
  safeZoneY: number;
  safeZoneWidth: number;
  safeZoneHeight: number;
};

export const getSafeZoneCenter = (info: SafeZoneInfo) => ({
  x: info.safeZoneX + info.safeZoneWidth / 2,
  y: info.safeZoneY + info.safeZoneHeight / 2,
});

export const getSafeZoneDistanceRatio = (
  points: TracePoint[],
  info: SafeZoneInfo
) => {
  if (points.length === 0) return null;
  const radius = Math.min(info.safeZoneWidth, info.safeZoneHeight) / 2;
  if (!radius) return null;
  const { x: centerX, y: centerY } = getSafeZoneCenter(info);
  let minDistance = Number.POSITIVE_INFINITY;
  points.forEach((point) => {
    const distance = Math.hypot(point.x - centerX, point.y - centerY);
    if (distance < minDistance) minDistance = distance;
  });
  return minDistance / radius;
};

export const isPointInsidePath = (
  points: Point[],
  point: Point,
  hitTestCanvas?: HTMLCanvasElement
): boolean => {
  if (points.length < 3) return false;
  const tolerance = SAFE_ZONE_CENTER_TOLERANCE;
  const samplePoints = [
    point,
    { x: point.x + tolerance, y: point.y },
    { x: point.x - tolerance, y: point.y },
    { x: point.x, y: point.y + tolerance },
    { x: point.x, y: point.y - tolerance },
    { x: point.x + tolerance * 0.7, y: point.y + tolerance * 0.7 },
    { x: point.x - tolerance * 0.7, y: point.y + tolerance * 0.7 },
    { x: point.x + tolerance * 0.7, y: point.y - tolerance * 0.7 },
    { x: point.x - tolerance * 0.7, y: point.y - tolerance * 0.7 },
  ];

  if (typeof document !== 'undefined') {
    const canvas = hitTestCanvas ?? document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const path = new Path2D();
      points.forEach((pointItem, index) => {
        if (index === 0) {
          path.moveTo(pointItem.x, pointItem.y);
        } else {
          path.lineTo(pointItem.x, pointItem.y);
        }
      });
      path.closePath();
      // evenodd rule is robust for self-intersecting loops
      return samplePoints.some((sample) =>
        ctx.isPointInPath(path, sample.x, sample.y, 'evenodd')
      );
    }
  }
  // Fallback to geometry util
  return samplePoints.some((sample) => isPointInsidePolygon(sample, points));
};

export const isLoopedPath = (points: Point[]) => {
  if (points.length < 3) return false;
  const start = points[0];
  const end = points[points.length - 1];
  const closeThreshold = Math.min(
    LOOP_CLOSE_THRESHOLD_MAX,
    BASE_CANVAS_SIZE * LOOP_CLOSE_THRESHOLD_RATIO
  );
  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  if (distance > closeThreshold) return false;
  let totalLength = 0;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const current = points[i];
    totalLength += Math.hypot(current.x - prev.x, current.y - prev.y);
  }
  return totalLength >= BASE_CANVAS_SIZE * LOOP_MIN_LENGTH_RATIO;
};
