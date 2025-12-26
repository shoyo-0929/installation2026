export type Point = {
  x: number
  y: number
}

type Intersection = {
  point: Point
  t: number
  u: number
  i: number
  j: number
}

const EPSILON = 1e-6

export const isPointInsidePolygon = (point: Point, polygon: Point[]) => {
  if (polygon.length < 3) return false
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y
    const intersects =
      (yi > point.y) !== (yj > point.y) &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
    if (intersects) inside = !inside
  }
  return inside
}

const cross = (a: Point, b: Point) => a.x * b.y - a.y * b.x

const segmentIntersection = (
  a: Point,
  b: Point,
  c: Point,
  d: Point
): { point: Point; t: number; u: number } | null => {
  const r = { x: b.x - a.x, y: b.y - a.y }
  const s = { x: d.x - c.x, y: d.y - c.y }
  const denom = cross(r, s)
  if (Math.abs(denom) < EPSILON) return null
  const cMinusA = { x: c.x - a.x, y: c.y - a.y }
  const t = cross(cMinusA, s) / denom
  const u = cross(cMinusA, r) / denom
  if (t < -EPSILON || t > 1 + EPSILON || u < -EPSILON || u > 1 + EPSILON) {
    return null
  }
  return {
    point: { x: a.x + t * r.x, y: a.y + t * r.y },
    t,
    u,
  }
}

const normalizeLoop = (points: Point[]) => {
  if (points.length < 2) return points
  const first = points[0]
  const last = points[points.length - 1]
  const dx = first.x - last.x
  const dy = first.y - last.y
  if (Math.hypot(dx, dy) < 0.01) {
    return points.slice(0, -1)
  }
  return points
}

const buildLoopsFromIntersection = (
  points: Point[],
  intersection: Intersection
) => {
  const { point, i, j } = intersection
  const augmented: Point[] = []
  let iIndex = -1
  let jIndex = -1

  for (let idx = 0; idx < points.length; idx += 1) {
    augmented.push(points[idx])
    if (idx === i) {
      augmented.push(point)
      iIndex = augmented.length - 1
    }
    if (idx === j) {
      augmented.push(point)
      jIndex = augmented.length - 1
    }
  }

  if (iIndex === -1 || jIndex === -1) {
    return []
  }

  const forward =
    iIndex <= jIndex
      ? augmented.slice(iIndex, jIndex + 1)
      : [...augmented.slice(iIndex), ...augmented.slice(0, jIndex + 1)]
  const backward =
    jIndex <= iIndex
      ? augmented.slice(jIndex, iIndex + 1)
      : [...augmented.slice(jIndex), ...augmented.slice(0, iIndex + 1)]

  return [normalizeLoop(forward), normalizeLoop(backward)]
}

export const extractLoops = (points: Point[]) => {
  const intersections: Intersection[] = []
  if (points.length < 4) return []
  for (let i = 0; i < points.length - 2; i += 1) {
    const a = points[i]
    const b = points[i + 1]
    for (let j = i + 2; j < points.length - 1; j += 1) {
      if (i === 0 && j === points.length - 2) continue
      if (j === i + 1) continue
      const c = points[j]
      const d = points[j + 1]
      const result = segmentIntersection(a, b, c, d)
      if (!result) continue
      if (
        (result.t <= EPSILON || result.t >= 1 - EPSILON) &&
        (result.u <= EPSILON || result.u >= 1 - EPSILON)
      ) {
        continue
      }
      intersections.push({
        ...result,
        i,
        j,
      })
    }
  }
  const builtLoops = intersections.flatMap((intersection) =>
    buildLoopsFromIntersection(points, intersection)
  )
  return builtLoops.filter((loop) => loop.length >= 3)
}

export const polygonArea = (points: Point[]) => {
  if (points.length < 3) return 0
  let area = 0
  for (let i = 0; i < points.length; i += 1) {
    const j = (i + 1) % points.length
    area += points[i].x * points[j].y - points[j].x * points[i].y
  }
  return area / 2
}
