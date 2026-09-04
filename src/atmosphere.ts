/**
 * Sky, fog and lighting. Without them a pitched 3D map reads as grey boxes on
 * a flat plate: nothing to stand against at the horizon, no aerial perspective.
 */

import type { Map as MapLibreMap } from 'maplibre-gl'
import { DEFAULT_SKY } from './config'
import type { SunPosition } from './sun'
import type { SkySpec } from './types'

export function applySky(map: MapLibreMap, sky: SkySpec | boolean): void {
  if (!sky) return
  const s = { ...DEFAULT_SKY, ...(sky === true ? {} : sky) }
  // setSky landed in MapLibre 5. On 4 it simply does not exist, and a map
  // without a sky is a cosmetic loss rather than a broken one.
  if (typeof (map as { setSky?: unknown }).setSky !== 'function') return
  map.setSky({
    'sky-color': s.skyColor,
    'horizon-color': s.horizonColor,
    'fog-color': s.fogColor,
    'sky-horizon-blend': s.horizonBlend,
    'horizon-fog-blend': 0.5,
    'fog-ground-blend': s.fogGroundBlend,
    'atmosphere-blend': [
      // Fade the atmosphere out as the camera flattens: at zero pitch you are
      // looking straight down and a horizon glow would just wash the map out.
      'interpolate', ['linear'], ['zoom'], 0, 1, 12, 1, 17, 0.4,
    ],
  } as Parameters<MapLibreMap['setSky']>[0])
}

/**
 * Point the map's light where the sun is.
 *
 * MapLibre takes `[radial, azimuthal, polar]`: azimuthal is degrees clockwise
 * from due north, polar is degrees down from straight overhead. `SunPosition`
 * carries the bearing the *shadow* falls along, so the sun itself is the
 * opposite bearing.
 *
 * Intensity drops with the sun: a low sun lights facades weakly and side-on,
 * which is what makes late-afternoon geometry read as three-dimensional.
 */
export function applySunLight(map: MapLibreMap, sun: SunPosition | null): void {
  if (!sun) return
  const sunBearing = (sun.shadowBearing + 180) % 360
  const polar = Math.max(0, Math.min(90, 90 - sun.altitudeDeg))
  const daylight = Math.max(0, Math.min(1, sun.altitudeDeg / 45))

  map.setLight({
    anchor: 'map',
    position: [1.5, sunBearing, polar],
    color: '#ffffff',
    intensity: 0.15 + 0.35 * daylight,
  })
}
