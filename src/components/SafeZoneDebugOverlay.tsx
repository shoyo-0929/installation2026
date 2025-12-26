'use client'

export type SafeZoneDebug = {
  centerX: number
  centerY: number
  warnRadius: number
  resetRadius: number
}

type SafeZoneDebugOverlayProps = {
  debug: SafeZoneDebug | null
}

export function SafeZoneDebugOverlay({ debug }: SafeZoneDebugOverlayProps) {
  if (!debug) return null

  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      <div
        className="absolute rounded-full border-2 border-dashed"
        style={{
          left: `${debug.centerX - debug.warnRadius}px`,
          top: `${debug.centerY - debug.warnRadius}px`,
          width: `${debug.warnRadius * 2}px`,
          height: `${debug.warnRadius * 2}px`,
          borderColor: 'rgba(255, 198, 56, 0.9)',
        }}
      />
      <div
        className="absolute rounded-full border-2"
        style={{
          left: `${debug.centerX - debug.resetRadius}px`,
          top: `${debug.centerY - debug.resetRadius}px`,
          width: `${debug.resetRadius * 2}px`,
          height: `${debug.resetRadius * 2}px`,
          borderColor: 'rgba(255, 83, 120, 0.9)',
        }}
      />
    </div>
  )
}
