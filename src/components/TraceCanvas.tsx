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
  setPoints: (points: TracePoint[], isClosed?: boolean) => void
  getCanvasRect: () => DOMRect | null
}

type TraceCanvasProps = {
  className?: string
  baseSize?: number
  strokeColor?: string
  strokeWidth?: number
  glowColor?: string
  glowBlur?: number
  sparkleColor?: string
  onTraceEnd?: (points: TracePoint[], isClosed: boolean) => void
}

const DEFAULT_BASE_SIZE = 1024
const MIN_DISTANCE_BASE = 3
const MAX_POINTS = 2000
const CLOSE_SEGMENTS = 12
const RESUME_THRESHOLD_BASE = 30
const CLOSE_THRESHOLD_RATIO = 0.06
const CLOSE_THRESHOLD_MAX = 60
const MIN_CLOSE_LENGTH_RATIO = 0.2
const MAX_PARTICLES = 110

type SparkleParticle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  ttl: number
  size: number
  phase: number
  twinkle: number
}

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
    const containerRef = useRef<HTMLDivElement | null>(null)
    const strokeCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const effectCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const pointsRef = useRef<TracePoint[]>([])
    const pathLengthRef = useRef(0)
    const closeCandidateIndexRef = useRef<number | null>(null)
    const particlesRef = useRef<SparkleParticle[]>([])
    const animationFrameRef = useRef<number | null>(null)
    const lastTimeRef = useRef<number | null>(null)
    const isDrawingRef = useRef(false)
    const isClosedRef = useRef(false)
    const viewScaleRef = useRef(1)
    const viewSizeRef = useRef(0)

    const clearCanvas = useCallback(() => {
      const strokeCanvas = strokeCanvasRef.current
      if (strokeCanvas) {
        const ctx = strokeCanvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, viewSizeRef.current, viewSizeRef.current)
        }
      }
      const effectCanvas = effectCanvasRef.current
      if (effectCanvas) {
        const ctx = effectCanvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, viewSizeRef.current, viewSizeRef.current)
        }
      }
    }, [])

    const redrawStroke = useCallback(() => {
      const canvas = strokeCanvasRef.current
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

    const redrawParticles = useCallback(() => {
      const canvas = effectCanvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const particles = particlesRef.current
      ctx.clearRect(0, 0, viewSizeRef.current, viewSizeRef.current)
      if (particles.length === 0) return

      const viewScale = viewScaleRef.current
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      const lineThickness = Math.max(0.5, viewScale * 0.7)
      particles.forEach((particle) => {
        const progress = particle.life / particle.ttl
        if (progress >= 1) return
        const twinkle =
          0.6 + 0.4 * Math.sin(particle.phase + particle.life * particle.twinkle)
        const alpha = (1 - progress) * (0.5 + twinkle * 0.5)
        const radius = particle.size * (0.6 + twinkle * 0.6) * viewScale
        const x = particle.x * viewScale
        const y = particle.y * viewScale

        ctx.shadowColor = sparkleColor
        ctx.shadowBlur = Math.max(6, radius * 6)
        ctx.fillStyle = `rgba(255,255,255,${alpha})`
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()

        ctx.shadowBlur = Math.max(4, radius * 4)
        ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.8})`
        ctx.lineWidth = lineThickness
        ctx.beginPath()
        ctx.moveTo(x - radius * 2.4, y)
        ctx.lineTo(x + radius * 2.4, y)
        ctx.moveTo(x, y - radius * 2.4)
        ctx.lineTo(x, y + radius * 2.4)
        ctx.stroke()
      })
      ctx.restore()
    }, [sparkleColor])

    const updateParticles = useCallback((deltaMs: number) => {
      if (deltaMs <= 0) return
      const particles = particlesRef.current
      if (particles.length === 0) return
      const next: SparkleParticle[] = []
      for (const particle of particles) {
        const life = particle.life + deltaMs
        if (life < particle.ttl) {
          next.push({
            ...particle,
            life,
            x: particle.x + particle.vx * deltaMs,
            y: particle.y + particle.vy * deltaMs,
          })
        }
      }
      particlesRef.current = next
    }, [])

    const startAnimationLoop = useCallback(() => {
      if (animationFrameRef.current !== null) return
      const step = (time: number) => {
        if (lastTimeRef.current === null) {
          lastTimeRef.current = time
        }
        const deltaMs = time - lastTimeRef.current
        if (deltaMs < 33) {
          animationFrameRef.current = window.requestAnimationFrame(step)
          return
        }
        const delta = Math.min(48, deltaMs)
        lastTimeRef.current = time
        updateParticles(delta)
        redrawParticles()
        if (particlesRef.current.length > 0) {
          animationFrameRef.current = window.requestAnimationFrame(step)
        } else {
          animationFrameRef.current = null
          lastTimeRef.current = null
        }
      }
      animationFrameRef.current = window.requestAnimationFrame(step)
    }, [redrawParticles, updateParticles])

    const spawnSparkles = useCallback(
      (point: TracePoint) => {
        const spawnCount = 2
        for (let i = 0; i < spawnCount; i += 1) {
          const angle = Math.random() * Math.PI * 2
          const speed = 0.02 + Math.random() * 0.04
          const ttl = 260 + Math.random() * 280
          const size = 1.9 + Math.random() * 2.2
          particlesRef.current.push({
            x: point.x + (Math.random() - 0.5) * 6,
            y: point.y + (Math.random() - 0.5) * 6,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.012,
            life: 0,
            ttl,
            size,
            phase: Math.random() * Math.PI * 2,
            twinkle: 0.018 + Math.random() * 0.02,
          })
        }
        if (particlesRef.current.length > MAX_PARTICLES) {
          particlesRef.current.splice(
            0,
            particlesRef.current.length - MAX_PARTICLES
          )
        }
        startAnimationLoop()
      },
      [startAnimationLoop]
    )

    const resizeCanvas = useCallback(() => {
      const container = containerRef.current
      const strokeCanvas = strokeCanvasRef.current
      const effectCanvas = effectCanvasRef.current
      if (!container || !strokeCanvas || !effectCanvas) return
      const rect = container.getBoundingClientRect()
      const size = Math.min(rect.width, rect.height)
      if (!size) return

      const ratio = window.devicePixelRatio || 1
      viewScaleRef.current = size / baseSize
      viewSizeRef.current = size

      strokeCanvas.width = size * ratio
      strokeCanvas.height = size * ratio
      strokeCanvas.style.width = `${size}px`
      strokeCanvas.style.height = `${size}px`

      effectCanvas.width = size * ratio
      effectCanvas.height = size * ratio
      effectCanvas.style.width = `${size}px`
      effectCanvas.style.height = `${size}px`

      const strokeCtx = strokeCanvas.getContext('2d')
      if (strokeCtx) {
        strokeCtx.setTransform(ratio, 0, 0, ratio, 0, 0)
      }

      const effectCtx = effectCanvas.getContext('2d')
      if (effectCtx) {
        effectCtx.setTransform(ratio, 0, 0, ratio, 0, 0)
      }

      redrawStroke()
      redrawParticles()
    }, [baseSize, redrawStroke, redrawParticles])

    const toBasePoint = useCallback(
      (event: PointerEvent<HTMLCanvasElement>): TracePoint | null => {
        // containerRef を基準に座標変換（Main.tsx と同じ基準）
        const container = containerRef.current
        if (!container) return null
        const rect = container.getBoundingClientRect()
        if (!rect.width || !rect.height) return null
        // 正方形前提で小さい方を使用
        const size = Math.min(rect.width, rect.height)
        const scale = baseSize / size
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
          spawnSparkles(point)
          return
        }

        const distance = Math.hypot(point.x - last.x, point.y - last.y)
        if (distance >= threshold) {
          pathLengthRef.current += distance
          points.push(point)
          const closeThreshold = Math.min(
            CLOSE_THRESHOLD_MAX,
            baseSize * CLOSE_THRESHOLD_RATIO
          )
          const canClose =
            pathLengthRef.current >= baseSize * MIN_CLOSE_LENGTH_RATIO
          const start = points[0]
          if (
            canClose &&
            points.length > 3 &&
            Math.hypot(point.x - start.x, point.y - start.y) <= closeThreshold
          ) {
            closeCandidateIndexRef.current = points.length - 1
          }
          spawnSparkles(point)
        }
      },
      [baseSize, spawnSparkles]
    )

    const finalizePath = useCallback(() => {
      let points = pointsRef.current
      if (points.length < 2) return
      const minCloseLength = baseSize * MIN_CLOSE_LENGTH_RATIO
      if (pathLengthRef.current < minCloseLength) {
        closeCandidateIndexRef.current = null
        isClosedRef.current = false
        return
      }
      const closeThreshold = Math.min(
        CLOSE_THRESHOLD_MAX,
        baseSize * CLOSE_THRESHOLD_RATIO
      )
      const start = points[0]
      const end = points[points.length - 1]
      const distanceToStart = Math.hypot(end.x - start.x, end.y - start.y)
      const closeIndex = closeCandidateIndexRef.current

      if (distanceToStart > closeThreshold) {
        closeCandidateIndexRef.current = null
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
      pathLengthRef.current = 0
      closeCandidateIndexRef.current = null
      particlesRef.current = []
      isClosedRef.current = false
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
        lastTimeRef.current = null
      }
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
        redrawStroke()
      },
      [appendPoint, baseSize, redrawStroke, resetPath, toBasePoint]
    )

    const handlePointerMove = useCallback(
      (event: PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current) return
        event.preventDefault()
        const point = toBasePoint(event)
        if (!point) return
        appendPoint(point)
        redrawStroke()
      },
      [appendPoint, redrawStroke, toBasePoint]
    )

    const handlePointerUp = useCallback(
      (event: PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current) return
        event.preventDefault()
        isDrawingRef.current = false
        finalizePath()
        redrawStroke()
        onTraceEnd?.([...pointsRef.current], isClosedRef.current)
        event.currentTarget.releasePointerCapture(event.pointerId)
      },
      [finalizePath, onTraceEnd, redrawStroke]
    )

    const handlePointerCancel = useCallback(
      (event: PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current) return
        event.preventDefault()
        isDrawingRef.current = false
        finalizePath()
        redrawStroke()
        onTraceEnd?.([...pointsRef.current], isClosedRef.current)
        event.currentTarget.releasePointerCapture(event.pointerId)
      },
      [finalizePath, onTraceEnd, redrawStroke]
    )

    useImperativeHandle(
      ref,
      () => ({
        getPoints: () => [...pointsRef.current],
        clear: () => resetPath(),
        setPoints: (points: TracePoint[], isClosed = true) => {
          pointsRef.current = points
          pathLengthRef.current = 0
          for (let i = 1; i < points.length; i += 1) {
            const prev = points[i - 1]
            const current = points[i]
            pathLengthRef.current += Math.hypot(
              current.x - prev.x,
              current.y - prev.y
            )
          }
          closeCandidateIndexRef.current = isClosed
            ? Math.max(0, points.length - 1)
            : null
          isClosedRef.current = isClosed
          redrawStroke()
        },
        getCanvasRect: () => {
          // containerRef を返す（座標変換と同じ基準）
          const container = containerRef.current
          return container ? container.getBoundingClientRect() : null
        },
      }),
      [redrawStroke, resetPath]
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

    useEffect(() => {
      return () => {
        if (animationFrameRef.current !== null) {
          window.cancelAnimationFrame(animationFrameRef.current)
        }
      }
    }, [])

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
          ref={strokeCanvasRef}
          className="absolute top-0 left-0 z-0 pointer-events-none"
          aria-hidden="true"
        />
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
    )
  }
)
