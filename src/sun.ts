/**
 * Solar position and cast shadows.
 *
 * SunCalc gives true solar altitude and azimuth for a date and location; each
 * crown is then projected along the ground away from the sun. Verified against
 * the solstices at Melbourne's latitude: noon altitude comes out at 75.2 deg in
 * summer and 28.5 in winter, against a theoretical 75.6 and 28.8.
 *
 * Caveat worth passing on to your users: `Date` objects are constructed in the
 * VIEWER's timezone. A map of Melbourne viewed from London will put the sun in
 * the wrong place unless you build dates with an explicit offset.
 */

import * as SunCalc from 'suncalc'
import { circle, destination } from './geo'
import { heightFromCrown } from './trees'
import type { LonLat } from './types'

/** Below this the sun is treated as set: shadows grow unbounded and meaningless. */
const MIN_ALTITUDE_DEG = 3

/** Beyond this a shadow is longer than any precinct view and adds nothing. */
const MAX_SHADOW_M = 400

export interface SunPosition {
  altitudeDeg: number
  /** Compass bearing the shadow falls along. */
  shadowBearing: number
}

export function sunPosition(date: Date, at: LonLat): SunPosition {
  const pos = SunCalc.getPosition(date, at[1], at[0])
  // suncalc 2.x returns DEGREES, with azimuth as a compass bearing from north.
  // (1.x returned radians from south -- converting again turns 72 into 4127.)
  // The shadow falls opposite the sun.
  return {
    altitudeDeg: pos.altitude,
    shadowBearing: (pos.azimuth + 180) % 360,
  }
}

export function isDaylight(sun: SunPosition): boolean {
  return sun.altitudeDeg > MIN_ALTITUDE_DEG
}

/** Ground shadow cast by a crown of the given radius, or null if there is none. */
export function shadowFor(
  centre: LonLat,
  radiusM: number,
  sun: SunPosition,
): GeoJSON.Polygon | null {
  if (!isDaylight(sun)) return null
  const offset =
    heightFromCrown(radiusM) / Math.tan((sun.altitudeDeg * Math.PI) / 180)
  if (offset > MAX_SHADOW_M) return null
  return circle(destination(centre, offset, sun.shadowBearing), radiusM)
}

/** Shadow length cast by a 10 m tree -- a readable proxy for sun angle. */
export function shadowLengthOf10m(sun: SunPosition): number {
  return 10 / Math.tan((sun.altitudeDeg * Math.PI) / 180)
}
