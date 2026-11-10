import { useCallback, useEffect, useState, type PointerEvent as ReactPointerEvent } from 'react'

/**
 * Pointer effects (tilt, magnet, spotlight) only make sense with a mouse or
 * trackpad, and never under reduced motion. Server render and first client
 * render both say "off", so markup always matches; it switches on after mount.
 */
export function usePointerEffects(): boolean {
  const [enabled, setEnabled] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)')
    const sync = () => setEnabled(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])
  return enabled
}

/** Pointer position inside the element, 0..1 on each axis. */
function relative(event: ReactPointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect()
  return { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height }
}

interface PointerBindings {
  onPointerMove?: (event: ReactPointerEvent<HTMLElement>) => void
  onPointerLeave?: () => void
}

/** 3D tilt + a light-sheen angle. Spread `bind` on the card, `style` on the tilting layer. */
export function useTilt(maxDegrees = 8) {
  const enabled = usePointerEffects()
  const [angle, setAngle] = useState({ x: 0, y: 0 })
  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const p = relative(event)
      setAngle({ x: (0.5 - p.y) * maxDegrees * 1.5, y: (p.x - 0.5) * maxDegrees * 1.5 })
    },
    [maxDegrees],
  )
  const onPointerLeave = useCallback(() => setAngle({ x: 0, y: 0 }), [])
  const active = angle.x !== 0 || angle.y !== 0
  return {
    bind: (enabled ? { onPointerMove, onPointerLeave } : {}) satisfies PointerBindings,
    active,
    style: {
      transform: `perspective(900px) rotateX(${angle.x.toFixed(1)}deg) rotateY(${angle.y.toFixed(1)}deg)${active ? ' scale(1.02)' : ''}`,
    },
    sheenAngle: Math.round(115 + angle.y * 6),
  }
}

/** Magnetic button: drifts up to `max` px toward the pointer. */
export function useMagnetic(max = 12) {
  const enabled = usePointerEffects()
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const p = relative(event)
      setOffset({ x: (p.x - 0.5) * max * 2, y: (p.y - 0.5) * max })
    },
    [max],
  )
  const onPointerLeave = useCallback(() => setOffset({ x: 0, y: 0 }), [])
  return {
    bind: (enabled ? { onPointerMove, onPointerLeave } : {}) satisfies PointerBindings,
    style: { transform: `translate(${offset.x.toFixed(1)}px, ${offset.y.toFixed(1)}px)` },
  }
}

/** Cursor spotlight: a soft radial glow that follows the pointer. */
export function useSpotlight(color = 'rgb(125 211 160 / 0.22)') {
  const enabled = usePointerEffects()
  const [at, setAt] = useState<{ x: number; y: number } | null>(null)
  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const p = relative(event)
    setAt({ x: p.x * 100, y: p.y * 100 })
  }, [])
  const onPointerLeave = useCallback(() => setAt(null), [])
  return {
    bind: (enabled ? { onPointerMove, onPointerLeave } : {}) satisfies PointerBindings,
    /** Background for an absolutely positioned overlay; transparent when idle. */
    background: at
      ? `radial-gradient(260px circle at ${Math.round(at.x)}% ${Math.round(at.y)}%, ${color}, transparent 70%)`
      : 'transparent',
  }
}
