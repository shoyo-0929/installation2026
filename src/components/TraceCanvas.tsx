'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'
import type { PointerEvent } from 'react'

export type TracePoint = {
  x: number
  y: number
  t: number
}

export type TraceCanvasHandle = {
  getPoints: () => TracePoint[]
  clear: () => void
}

type TraceCanvasProps = {
  className?: string
  baseSize?: number
  strokeColor?: string
  strokeWidth?: number
  glowColor?: string
  glowBlur?: number
}

const DEFAULT_BASE_SIZE = 1024
const MIN_DISTANCE_BASE = 3
const MAX_POINTS = 2000
const CLOSE_SEGMENTS = 12
const RESUME_THRESHOLD_BASE = 30
const CLOSE_THRESHOLD_RATIO = 0.06
const CLOSE_THRESHOLD_MAX = 60

export const TraceCanvas = forwardRef<TraceCanvasHandle, TraceCanvasProps>(
  function TraceCanvas(
    {
      className,
      baseSize = DEFAULT_BASE_SIZE,
      strokeColor = '#ffffff',
      strokeWidth = 6,
      glowColor = 'rgba(255,255,255,0.8)',
      glowBlur = 10,
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const pointsRef = useRef<TracePoint[]>([])
    const closeCandidateIndexRef = useRef<number | null>(null)
    const isDrawingRef = useRef(false)
    const isClosedRef = useRef(false)
    const viewScaleRef = useRef(1)
    const viewSizeRef = useRef(0)

    const clearCanvas = useCallback(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, viewSizeRef.current, viewSizeRef.current)
    }, [])

    const redraw = useCallback(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const points = pointsRef.current
      ctx.clearRect(0, 0, viewSizeRef.current, viewSizeRef.current)
      if (points.length < 2) return

      const viewScale = viewScaleRef.current
      const scaledGlowBlur = Math.max(0, glowBlur * viewScale)
      const lineWidth = Math.max(1, strokeWidth * viewScale)
      const path = () => {
        ctx.beginPath()
        points.forEach((point, index) => {
          const x = point.x * viewScale
          const y = point.y * viewScale
          if (index === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        })
      }

      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      ctx.globalAlpha = 0.6
      ctx.strokeStyle = glowColor
      ctx.lineWidth = lineWidth * 2.4
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.shadowColor = glowColor
      ctx.shadowBlur = scaledGlowBlur * 1.4
      path()
      ctx.stroke()
      ctx.restore()

      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      ctx.globalAlpha = 0.85
      ctx.strokeStyle = glowColor
      ctx.lineWidth = lineWidth * 1.6
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.shadowColor = glowColor
      ctx.shadowBlur = scaledGlowBlur * 0.8
      path()
      ctx.stroke()
      ctx.restore()

      ctx.save()
      ctx.globalAlpha = 1
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = lineWidth
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      path()
      ctx.stroke()
      ctx.restore()
    }, [strokeColor, strokeWidth, glowColor, glowBlur])

    const resizeCanvas = useCallback(() => {
      const container = containerRef.current
      const canvas = canvasRef.current
      if (!container || !canvas) return
      const rect = container.getBoundingClientRect()
      const size = Math.min(rect.width, rect.height)
      if (!size) return

      const ratio = window.devicePixelRatio || 1
      viewScaleRef.current = size / baseSize
      viewSizeRef.current = size

      canvas.width = size * ratio
      canvas.height = size * ratio
      canvas.style.width = `${size}px`
      canvas.style.height = `${size}px`

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      }

      redraw()
    }, [baseSize, redraw])

    const toBasePoint = useCallback(
      (event: PointerEvent<HTMLCanvasElement>): TracePoint | null => {
        const canvas = canvasRef.current
        if (!canvas) return null
        const rect = canvas.getBoundingClientRect()
        if (!rect.width) return null
        const scale = baseSize / rect.width
        const rawX = (event.clientX - rect.left) * scale
        const rawY = (event.clientY - rect.top) * scale
        const x = Math.max(0, Math.min(baseSize, rawX))
        const y = Math.max(0, Math.min(baseSize, rawY))
        return { x, y, t: Date.now() }
      },
      [baseSize]
    )

    const appendPoint = useCallback(
      (point: TracePoint) => {
        const points = pointsRef.current
        const last = points[points.length - 1]
        const threshold =
          points.length >= MAX_POINTS
            ? MIN_DISTANCE_BASE * 2
            : MIN_DISTANCE_BASE

        if (!last) {
          points.push(point)
          return
        }

        const distance = Math.hypot(point.x - last.x, point.y - last.y)
        if (distance >= threshold) {
          points.push(point)
          const closeThreshold = Math.min(
            CLOSE_THRESHOLD_MAX,
            baseSize * CLOSE_THRESHOLD_RATIO
          )
          const start = points[0]
          if (
            closeCandidateIndexRef.current === null &&
            points.length > 3 &&
            Math.hypot(point.x - start.x, point.y - start.y) <= closeThreshold
          ) {
            closeCandidateIndexRef.current = points.length - 1
          }
        }
      },
      [baseSize]
    )

    const finalizePath = useCallback(() => {
      let points = pointsRef.current
      if (points.length < 2) return
      const closeThreshold = Math.min(
        CLOSE_THRESHOLD_MAX,
        baseSize * CLOSE_THRESHOLD_RATIO
      )
      const start = points[0]
      const end = points[points.length - 1]
      const distanceToStart = Math.hypot(end.x - start.x, end.y - start.y)
      const closeIndex = closeCandidateIndexRef.current

      if (distanceToStart > closeThreshold && closeIndex === null) {
        isClosedRef.current = false
        return
      }

      if (closeIndex !== null && closeIndex < points.length - 1) {
        points = points.slice(0, closeIndex + 1)
        pointsRef.current = points
      }

      const closePoint = points[points.length - 1]
      const prev = points[points.length - 2] ?? closePoint
      const next = points[1] ?? start
      const endVector = {
        x: closePoint.x - prev.x,
        y: closePoint.y - prev.y,
      }
      const startVector = {
        x: next.x - start.x,
        y: next.y - start.y,
      }
      const normalize = (vector: { x: number; y: number }) => {
        const length = Math.hypot(vector.x, vector.y) || 1
        return { x: vector.x / length, y: vector.y / length }
      }
      const endDir = normalize(endVector)
      const startDir = normalize(startVector)
      const anchorDistance = Math.hypot(
        closePoint.x - start.x,
        closePoint.y - start.y
      )
      const tangent = Math.min(anchorDistance * 0.5, baseSize * 0.12)
      const control1 = {
        x: closePoint.x + endDir.x * tangent,
        y: closePoint.y + endDir.y * tangent,
      }
      const control2 = {
        x: start.x - startDir.x * tangent,
        y: start.y - startDir.y * tangent,
      }
      for (let i = 1; i <= CLOSE_SEGMENTS; i += 1) {
        const t = i / CLOSE_SEGMENTS
        const mt = 1 - t
        const x =
          mt * mt * mt * closePoint.x +
          3 * mt * mt * t * control1.x +
          3 * mt * t * t * control2.x +
          t * t * t * start.x
        const y =
          mt * mt * mt * closePoint.y +
          3 * mt * mt * t * control1.y +
          3 * mt * t * t * control2.y +
          t * t * t * start.y
        points.push({ x, y, t: end.t })
      }

      closeCandidateIndexRef.current = null
      isClosedRef.current = true
    }, [baseSize])

    const resetPath = useCallback(() => {
      pointsRef.current = []
      closeCandidateIndexRef.current = null
      isClosedRef.current = false
      clearCanvas()
    }, [clearCanvas])

    const handlePointerDown = useCallback(
      (event: PointerEvent<HTMLCanvasElement>) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return
        event.preventDefault()
        const point = toBasePoint(event)
        if (!point) return
        if (pointsRef.current.length > 0) {
          if (isClosedRef.current) {
            resetPath()
          } else {
            const last = pointsRef.current[pointsRef.current.length - 1]
            const resumeThreshold = Math.min(
              RESUME_THRESHOLD_BASE,
              baseSize * 0.03
            )
            const distance = Math.hypot(point.x - last.x, point.y - last.y)
            if (distance > resumeThreshold) {
              resetPath()
            }
          }
        }
        isDrawingRef.current = true
        event.currentTarget.setPointerCapture(event.pointerId)
        appendPoint(point)
        redraw()
      },
      [appendPoint, redraw, resetPath, toBasePoint]
    )

    const handlePointerMove = useCallback(
      (event: PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current) return
        event.preventDefault()
        const point = toBasePoint(event)
        if (!point) return
        appendPoint(point)
        redraw()
      },
      [appendPoint, redraw, toBasePoint]
    )

    const handlePointerUp = useCallback(
      (event: PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current) return
        event.preventDefault()
        isDrawingRef.current = false
        finalizePath()
        redraw()
        event.currentTarget.releasePointerCapture(event.pointerId)
      },
      [finalizePath, redraw]
    )

    const handlePointerCancel = useCallback(
      (event: PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current) return
        event.preventDefault()
        isDrawingRef.current = false
        finalizePath()
        redraw()
        event.currentTarget.releasePointerCapture(event.pointerId)
      },
      [finalizePath, redraw]
    )

    useImperativeHandle(
      ref,
      () => ({
        getPoints: () => [...pointsRef.current],
        clear: () => resetPath(),
      }),
      [resetPath]
    )

    useEffect(() => {
      resizeCanvas()
      const container = containerRef.current
      if (!container) return
      const observer = new ResizeObserver(() => {
        resizeCanvas()
      })
      observer.observe(container)
      return () => observer.disconnect()
    }, [resizeCanvas])

    const hasPositionClass =
      className?.includes('absolute') ||
      className?.includes('fixed') ||
      className?.includes('relative') ||
      className?.includes('sticky')
    const containerClassName = className
      ? hasPositionClass
        ? className
        : `relative ${className}`
      : 'relative'

    return (
      <div ref={containerRef} className={containerClassName}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full touch-none select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          aria-label="なぞりキャンバス"
        />
      </div>
    )
  }
)
