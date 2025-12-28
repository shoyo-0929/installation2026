import { isPointInsidePolygon, type Point } from '@/lib/geometry';

export interface TracePoint {
  x: number;
  y: number;
  t: number;
}

/** 基準となるキャンバスサイズ（座標計算の正規化に使用） */
export const BASE_CANVAS_SIZE = 1024;
/** 安全領域の内側パディング */
export const SAFE_ZONE_PADDING = 30;
/** 安全領域警告を出す距離の比率（0.7 = 70%以内ならOK、それより近いと警告） */
export const SAFE_ZONE_WARN_RADIUS_RATIO = 0.8;
/** 強制リセットを促す距離の比率（0.5 = 50%より近い場合） */
export const SAFE_ZONE_RESET_RADIUS_RATIO = 0.6;
/** トレース線の太さ（基準サイズ換算） */
export const TRACE_STROKE_WIDTH = 8;
/** 中心点判定の許容誤差 */
export const SAFE_ZONE_CENTER_TOLERANCE = 12;
/** パスが閉じているとみなす距離（キャンバスサイズに対する比率） */
export const LOOP_CLOSE_THRESHOLD_RATIO = 0.06;
/** パスが閉じているとみなす距離（最大ピクセル値） */
export const LOOP_CLOSE_THRESHOLD_MAX = 60;
/** 有効なパスとみなす最小の長さ比率 */
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

/**
 * 安全領域の中心座標を取得する
 */
export const getSafeZoneCenter = (info: SafeZoneInfo) => ({
  x: info.safeZoneX + info.safeZoneWidth / 2,
  y: info.safeZoneY + info.safeZoneHeight / 2,
});

/**
 * 描画された点群と安全領域中心との最短距離の比率を計算する
 * @returns 0〜1の値（1が境界線、小さいほど中心に近い）
 */
export const getSafeZoneDistanceRatio = (
  points: TracePoint[],
  info: SafeZoneInfo
) => {
  if (points.length === 0) return null;
  // 安全領域の半径（短い方の寸法を基準）
  const radius = Math.min(info.safeZoneWidth, info.safeZoneHeight) / 2;
  if (!radius) return null;

  const { x: centerX, y: centerY } = getSafeZoneCenter(info);
  let minDistance = Number.POSITIVE_INFINITY;

  // 点群の中で中心に最も近い点を探す
  points.forEach((point) => {
    const distance = Math.hypot(point.x - centerX, point.y - centerY);
    if (distance < minDistance) minDistance = distance;
  });

  // 半径に対する比率を返す
  return minDistance / radius;
};

/**
 * 指定された点がパスの内側に含まれているかを判定する
 * 複数のサンプリング点を用いて判定精度を高めている
 */
export const isPointInsidePath = (
  points: Point[],
  point: Point,
  hitTestCanvas?: HTMLCanvasElement
): boolean => {
  if (points.length < 3) return false;
  const tolerance = SAFE_ZONE_CENTER_TOLERANCE;
  // 中心点とその周辺の点をサンプリング
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
      // CanvasのisPointInPath (evenoddルール) を使用して正確な内外判定を行う
      // evenoddは自己交差するパスに対しても堅牢
      return samplePoints.some((sample) =>
        ctx.isPointInPath(path, sample.x, sample.y, 'evenodd')
      );
    }
  }
  // フォールバック: 幾何計算による判定
  return samplePoints.some((sample) => isPointInsidePolygon(sample, points));
};

/**
 * パスがループ（一筆書きで閉じている）しているかを判定する
 */
export const isLoopedPath = (points: Point[]) => {
  if (points.length < 3) return false;
  const start = points[0];
  const end = points[points.length - 1];

  // 始点と終点の距離が閾値以下かチェック
  const closeThreshold = Math.min(
    LOOP_CLOSE_THRESHOLD_MAX,
    BASE_CANVAS_SIZE * LOOP_CLOSE_THRESHOLD_RATIO
  );
  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  if (distance > closeThreshold) return false;

  // パスの全長が一定以上あるかチェック（微小な点は除外）
  let totalLength = 0;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const current = points[i];
    totalLength += Math.hypot(current.x - prev.x, current.y - prev.y);
  }
  return totalLength >= BASE_CANVAS_SIZE * LOOP_MIN_LENGTH_RATIO;
};
