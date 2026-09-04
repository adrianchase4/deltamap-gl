/**
 * Auto-orbit: spins the bearing until the user touches the map.
 */

import { useEffect, type RefObject } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { ORBIT_SPEED_DEG } from '../config'

/** Any of these means the user wants control back. */
const INTERRUPTS = ['dragstart', 'mousedown', 'wheel'] as const

export function useOrbit(
  map: RefObject<MapLibreMap | null>,
  orbiting: boolean,
  stop: () => void,
  speedDeg = ORBIT_SPEED_DEG,
) {
  useEffect(() => {
    const instance = map.current
    if (!instance || !orbiting) return

    let frame = requestAnimationFrame(function spin() {
      instance.setBearing(instance.getBearing() + speedDeg)
      frame = requestAnimationFrame(spin)
    })

    // Without this the loop fights the drag and the view judders.
    for (const event of INTERRUPTS) instance.on(event, stop)

    return () => {
      cancelAnimationFrame(frame)
      for (const event of INTERRUPTS) instance.off(event, stop)
    }
  }, [map, orbiting, stop, speedDeg])
}
