/**
 * A raster manifest -> layer specs and matching legends.
 *
 * A colour-mapped raster is useless without the scale that produced it, so the
 * two ship in one file and arrive together. Hand-copying a ramp lets it drift
 * from the image.
 */

import { useMemo } from 'react'
import { useRemoteJson } from './useRemoteJson'
import type { ImageCorners, RasterSpec } from '../types'
import type { LegendSpec } from '../ui/context'

export interface RasterManifestLayer {
  file: string
  label: string
  unit?: string
  range: [number, number]
  /** Ramp positions are 0-1 across `range`, not data values. */
  ramp: [number, string][]
  /**
   * Classes rather than a continuous scale. The legend then shows the class
   * names from `legend_labels` instead of interpolated numbers, which would be
   * meaningless -- "0.5" is not halfway between built and open.
   */
  categorical?: boolean
  legend_labels?: string[]
  /** A qualification that must travel with the layer, shown next to it. */
  caveat?: string
}

export interface RasterManifest {
  corners: ImageCorners
  layers: Record<string, RasterManifestLayer>
  year?: number
  scenes?: number
}

export interface RasterLayers {
  specs: RasterSpec[]
  legends: Record<string, LegendSpec>
  /** Per-layer qualifications, keyed the same way as `legends`. */
  caveats: Record<string, string>
  manifest: RasterManifest | null
  loading: boolean
  error: string | null
}

/**
 * @param url      manifest location, e.g. `/raster/bounds.json`
 * @param baseUrl  directory the image files sit in. Defaults to the manifest's own.
 * @param hidden   layer keys that start switched off
 * @param opacity  applied to every surface. Keep it well under 1 if anything is
 *                 drawn on top: a fully opaque surface hides the city under it.
 */
export function useRasterManifest(
  url: string | null,
  { baseUrl, hidden = [], opacity }:
    { baseUrl?: string; hidden?: string[]; opacity?: number } = {},
): RasterLayers {
  const { data, loading, error } = useRemoteJson<RasterManifest>(url)

  return useMemo(() => {
    if (!data) {
      return { specs: [], legends: {}, caveats: {}, manifest: null, loading, error }
    }

    const base = baseUrl ?? (url ? url.slice(0, url.lastIndexOf('/') + 1) : '')
    const specs: RasterSpec[] = []
    const legends: Record<string, LegendSpec> = {}
    const caveats: Record<string, string> = {}

    for (const [key, layer] of Object.entries(data.layers)) {
      specs.push({
        kind: 'raster',
        id: key,
        url: `${base}${layer.file}`,
        corners: data.corners,
        hidden: hidden.includes(key),
        ...(opacity === undefined ? {} : { opacity }),
      })

      if (layer.caveat) caveats[key] = layer.caveat

      const title = data.year ? `${layer.label} · ${data.year}` : layer.label

      if (layer.categorical) {
        legends[key] = {
          title,
          ramp: layer.ramp,
          labels: layer.legend_labels ?? layer.ramp.map((_, i) => String(i)),
        }
        continue
      }

      // Ramp stops are fractions of the range; the legend wants real values so
      // its tick labels read in degrees rather than in 0-1.
      const [lo, hi] = layer.range
      legends[key] = {
        title,
        note: layer.unit ? `${layer.unit}, ${lo}–${hi}` : `${lo}–${hi}`,
        ramp: layer.ramp.map(([p, color]) => [lo + p * (hi - lo), color]),
        labels: layer.ramp.map(([p]) => (lo + p * (hi - lo)).toFixed(hi - lo < 3 ? 2 : 0)),
      }
    }
    return { specs, legends, caveats, manifest: data, loading, error }
  }, [data, loading, error, url, baseUrl, opacity, hidden.join(',')])
}
