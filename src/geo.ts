/**
 * Small-scale geometry helpers.
 *
 * Equirectangular maths rather than a projection library. Across a few
 * kilometres the error is well under the survey accuracy of typical city
 * data, and it keeps per-frame shadow generation cheap. Do not use these
 * helpers across tens of kilometres or near the poles.
 */

import type { LonLat } from './types'

const METRES_PER_DEGREE_LAT = 111_320

/** Point `metres` away from `origin` along a compass bearing. */
export function destination(
  [lon, lat]: LonLat,
  metres: number,
  bearingDeg: number,
): LonLat {
  const rad = (bearingDeg * Math.PI) / 180
  const dLat = (metres * Math.cos(rad)) / METRES_PER_DEGREE_LAT
  const dLon =
    (metres * Math.sin(rad)) /
    (METRES_PER_DEGREE_LAT * Math.cos((lat * Math.PI) / 180))
  return [lon + dLon, lat + dLat]
}

/** Closed ring approximating a circle, as a GeoJSON Polygon geometry. */
export function circle(
  centre: LonLat,
  radiusM: number,
  steps = 18,
): GeoJSON.Polygon {
  const ring: LonLat[] = []
  for (let i = 0; i <= steps; i += 1) {
    ring.push(destination(centre, radiusM, (i / steps) * 360))
  }
  return { type: 'Polygon', coordinates: [ring] }
}

export function metresBetween(a: LonLat, b: LonLat): number {
  const dx =
    (a[0] - b[0]) * METRES_PER_DEGREE_LAT * Math.cos((a[1] * Math.PI) / 180)
  const dy = (a[1] - b[1]) * METRES_PER_DEGREE_LAT
  return Math.hypot(dx, dy)
}
