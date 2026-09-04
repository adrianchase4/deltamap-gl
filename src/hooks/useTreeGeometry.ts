/**
 * Rebuilds what depends on sun and viewport: cast shadows, and 3D crowns past
 * the zoom threshold. One cull feeds both. Without `maxViewportTrees` a wide
 * view rebuilds tens of thousands of polygons on every `moveend`.
 */

import { useEffect, type RefObject } from 'react'
import type { Map as MapLibreMap, GeoJSONSource } from 'maplibre-gl'
import { buildCrowns, treesInView, type TreeCollection } from '../crowns'
import { shadowFor, type SunPosition } from '../sun'
import {
  DEFAULT_CROWN_MIN_ZOOM,
  DEFAULT_MAX_VIEWPORT_TREES,
  EMPTY_GEOJSON,
} from '../config'
import { crownSourceId, sourceIdFor } from '../layers'
import type { LonLat } from '../types'

interface Options {
  map: RefObject<MapLibreMap | null>
  ready: boolean
  trees: TreeCollection | null
  sun: SunPosition | null
  /** Layer id of the `trees` spec, used to find its crown source. */
  treesLayerId: string
  /** Layer id of the `shadows` spec. Omit to skip shadow generation. */
  shadowsLayerId?: string
  crownRadiusFor: (props: Record<string, unknown>) => number
  crownMinZoom?: number
  maxViewportTrees?: number
}

export function useTreeGeometry({
  map,
  ready,
  trees,
  sun,
  treesLayerId,
  shadowsLayerId,
  crownRadiusFor,
  crownMinZoom = DEFAULT_CROWN_MIN_ZOOM,
  maxViewportTrees = DEFAULT_MAX_VIEWPORT_TREES,
}: Options) {
  useEffect(() => {
    const instance = map.current
    if (!instance || !ready || !trees) return

    const redraw = () => {
      const inView = treesInView(trees, instance.getBounds(), maxViewportTrees)

      if (shadowsLayerId) {
        const shadows = instance.getSource(sourceIdFor(shadowsLayerId)) as
          | GeoJSONSource
          | undefined
        shadows?.setData({
          type: 'FeatureCollection',
          features: sun ? shadowsFor(inView, sun, crownRadiusFor) : [],
        })
      }

      // Crowns are hidden below the threshold, so skip building thousands of
      // polygons nobody can see.
      const crowns = instance.getSource(crownSourceId(treesLayerId)) as
        | GeoJSONSource
        | undefined
      crowns?.setData(
        instance.getZoom() >= crownMinZoom
          ? buildCrowns(inView, crownRadiusFor)
          : EMPTY_GEOJSON,
      )
    }

    redraw()
    instance.on('moveend', redraw)
    return () => {
      instance.off('moveend', redraw)
    }
  }, [
    map, ready, trees, sun, treesLayerId, shadowsLayerId,
    crownRadiusFor, crownMinZoom, maxViewportTrees,
  ])
}

function shadowsFor(
  inView: ReturnType<typeof treesInView>,
  sun: SunPosition,
  crownRadiusFor: (props: Record<string, unknown>) => number,
): GeoJSON.Feature[] {
  const features: GeoJSON.Feature[] = []
  for (const tree of inView) {
    const shadow = shadowFor(
      tree.geometry.coordinates as LonLat,
      crownRadiusFor(tree.properties ?? {}),
      sun,
    )
    if (shadow) features.push({ type: 'Feature', properties: {}, geometry: shadow })
  }
  return features
}
