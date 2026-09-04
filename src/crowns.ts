/**
 * Viewport culling and 3D tree geometry.
 *
 * A MapLibre `circle` is a screen-space billboard that never depth-tests
 * against extrusions, so zoomed-in dots float through towers. Real extruded
 * geometry sits in the same depth pass as the buildings.
 */

import { circle } from './geo'
import { heightFromCrown } from './trees'
import type { LonLat } from './types'

export type TreeFeature = GeoJSON.Feature<GeoJSON.Point, Record<string, unknown>>
export type TreeCollection = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  Record<string, unknown>
>

/** Vertices per crown ring. Ten is plenty at a 5-10 m radius. */
const CROWN_STEPS = 10
/** Trunk radius as a fraction of the crown radius. */
const TRUNK_RATIO = 0.12
/** Clear trunk height below the crown, as a fraction of crown radius. */
const TRUNK_HEIGHT_RATIO = 0.9

/** The part of a MapLibre `LngLatBounds` this module needs. */
export interface Bounds {
  getWest(): number
  getEast(): number
  getSouth(): number
  getNorth(): number
}

/**
 * Trees inside the current viewport, capped so a wide view cannot stall the
 * frame. One pass, shared by the shadow and crown layers.
 */
export function treesInView(
  trees: TreeCollection,
  bounds: Bounds,
  cap: number,
): TreeFeature[] {
  const west = bounds.getWest()
  const east = bounds.getEast()
  const south = bounds.getSouth()
  const north = bounds.getNorth()

  const found: TreeFeature[] = []
  for (const tree of trees.features) {
    const [lon, lat] = tree.geometry.coordinates
    if (lon < west || lon > east || lat < south || lat > north) continue
    found.push(tree)
    if (found.length >= cap) break
  }
  return found
}

/**
 * Trunk and crown polygons for the given trees.
 *
 * The trunk is not decoration: a crown alone has a raised
 * `fill-extrusion-base` with nothing beneath it, which reads as a green blob
 * hovering in mid-air.
 */
export function buildCrowns(
  trees: TreeFeature[],
  crownRadiusFor: (props: Record<string, unknown>) => number,
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = []

  for (const tree of trees) {
    const centre = tree.geometry.coordinates as LonLat
    const radius = crownRadiusFor(tree.properties ?? {})
    const trunkTop = radius * TRUNK_HEIGHT_RATIO

    features.push({
      type: 'Feature',
      properties: { kind: 'trunk', base: 0, height: trunkTop },
      geometry: circle(centre, radius * TRUNK_RATIO, 6),
    })
    features.push({
      type: 'Feature',
      properties: {
        kind: 'crown',
        base: trunkTop,
        height: heightFromCrown(radius),
      },
      geometry: circle(centre, radius, CROWN_STEPS),
    })
  }

  return { type: 'FeatureCollection', features }
}
