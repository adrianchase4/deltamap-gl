/**
 * Defaults, all overridable through `UrbanMapConfig`. Deliberately no location
 * constant: a package that hardcodes a city is not a package.
 */

import type { CameraSpec } from './types'

export const DEFAULT_CAMERA: CameraSpec = {
  zoom: 15.6,
  pitch: 58,
  bearing: -22,
  maxPitch: 80,
}

/** CARTO Positron: OpenStreetMap vector tiles, no API key, no account. */
export const DEFAULT_BASEMAP =
  'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

/**
 * Zoom at which trees swap render mode.
 *
 *   below    -> flat ground discs, cheap enough for a whole precinct
 *   at/above -> extruded trunk + crown, correct occlusion against buildings
 *
 * Crowns are drawn at their true size in metres, so they do not grow with zoom;
 * they simply get closer. Only the disc radius scales, and only so dots stay
 * visible when zoomed out.
 */
export const DEFAULT_CROWN_MIN_ZOOM = 16

/** Cap on trees processed per viewport pass. */
export const DEFAULT_MAX_VIEWPORT_TREES = 900

/** Degrees per rotate-button press, and per-frame spin while orbiting. */
export const ROTATE_STEP_DEG = 45
export const ORBIT_SPEED_DEG = 0.08

/** Basemaps ship their own flat building footprints; hide them by default. */
export const DEFAULT_HIDDEN_SOURCE_LAYERS = ['building']

export const EMPTY_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
}

/** Neutral stone ramp for building heights, in metres. */
export const DEFAULT_BUILDING_RAMP: [number, string][] = [
  [0, '#e7e4dd'],
  [25, '#dcd8cf'],
  [80, '#cdc8bd'],
  [200, '#bab4a7'],
]

/** Neutral daylight atmosphere. Warm near the horizon, cool overhead. */
export const DEFAULT_SKY = {
  skyColor: '#a8c4dc',
  horizonColor: '#e6ddd0',
  fogColor: '#e9e5dd',
  horizonBlend: 0.6,
  fogGroundBlend: 0.72,
} as const
