/**
 * Layer specs -> MapLibre sources and layers.
 *
 * Specs are applied in order and MapLibre draws in insertion order, so put
 * shadows before whatever casts them. Every 3D layer is `fill-extrusion` so
 * they share one depth pass; see types.ts for why that matters.
 */

import type { ExpressionSpecification, Map as MapLibreMap } from 'maplibre-gl'
import { DEFAULT_BUILDING_RAMP, DEFAULT_CROWN_MIN_ZOOM, EMPTY_GEOJSON } from './config'
import type {
  BuildingsSpec, ChoroplethSpec, FieldMap, FillSpec, LayerSpec, LineSpec,
  PointsSpec, RampStop, RasterSpec, RingSpec, ShadowsSpec, SourceData, TreesSpec,
} from './types'

export const sourceIdFor = (layerId: string) => `${layerId}-src`
export const crownSourceId = (layerId: string) => `${layerId}-crowns`

type Expr = ExpressionSpecification
type AnyLayer = Parameters<MapLibreMap['addLayer']>[0]
type Spec = { id: string; hidden?: boolean; sourceId?: string }

/** `style.load` fires again on a style change, so every add must be idempotent. */
function add(map: MapLibreMap, layer: AnyLayer) {
  if (!map.getLayer(layer.id)) map.addLayer(layer)
}

function source(map: MapLibreMap, spec: Spec, data: SourceData): string {
  const id = spec.sourceId ?? sourceIdFor(spec.id)
  if (!map.getSource(id)) map.addSource(id, { type: 'geojson', data: data ?? EMPTY_GEOJSON })
  return id
}

const vis = (spec: Spec) =>
  ({ visibility: spec.hidden ? ('none' as const) : ('visible' as const) })

export function rampExpression(field: string, stops: RampStop[]) {
  return ['interpolate', ['linear'], ['get', field], ...stops.flat()] as unknown as Expr
}

/** Extruded to surveyed heights, falling back to a podium height then a default. */
function buildings(map: MapLibreMap, spec: BuildingsSpec, fields: FieldMap) {
  add(map, {
    id: spec.id, type: 'fill-extrusion', source: source(map, spec, spec.data), layout: vis(spec),
    paint: {
      'fill-extrusion-height': ['coalesce', ['get', fields.buildingHeight],
        ['get', fields.buildingFallbackHeight], 4] as unknown as Expr,
      'fill-extrusion-base': 0,
      'fill-extrusion-color': ['interpolate', ['linear'],
        ['coalesce', ['get', fields.buildingHeight], 4],
        ...(spec.ramp ?? DEFAULT_BUILDING_RAMP).flat()] as unknown as Expr,
      'fill-extrusion-opacity': spec.opacity ?? 0.95,
      'fill-extrusion-vertical-gradient': true,
    },
  })
}

/** Flat discs zoomed out, extruded trunk and crown zoomed in. */
function trees(map: MapLibreMap, spec: TreesSpec) {
  const minzoom = spec.crownMinZoom ?? DEFAULT_CROWN_MIN_ZOOM
  add(map, {
    id: spec.id, type: 'circle', source: source(map, spec, spec.data),
    maxzoom: minzoom, layout: vis(spec),
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 14, 1.6, 16, 4.5] as unknown as Expr,
      'circle-color': spec.crownColor ?? '#4a7c59',
      'circle-opacity': 0.9,
      // Lie the discs on the ground rather than facing the camera.
      'circle-pitch-alignment': 'map',
      'circle-pitch-scale': 'map',
    },
  })

  // Filled by useTreeGeometry: the geometry depends on viewport and sun.
  const crowns = crownSourceId(spec.id)
  if (!map.getSource(crowns)) map.addSource(crowns, { type: 'geojson', data: EMPTY_GEOJSON })

  // The trunk is not decoration: a crown alone has a raised base with nothing
  // beneath it, which reads as a green blob hovering in mid-air.
  for (const [suffix, kind, color, opacity] of [
    ['trunk', 'trunk', spec.trunkColor ?? '#6b5545', 1],
    ['crown', 'crown', spec.crownColor ?? '#4a7c59', 0.9],
  ] as const) {
    add(map, {
      id: `${spec.id}-${suffix}`, type: 'fill-extrusion', source: crowns,
      minzoom, filter: ['==', ['get', 'kind'], kind], layout: vis(spec),
      paint: {
        'fill-extrusion-color': color,
        'fill-extrusion-height': ['get', 'height'] as unknown as Expr,
        'fill-extrusion-base': ['get', 'base'] as unknown as Expr,
        'fill-extrusion-opacity': opacity,
        'fill-extrusion-vertical-gradient': true,
      },
    })
  }
}

/**
 * A 0.4 m extrusion, not a flat fill: flat layers draw after the extrusion pass
 * and ignore its depth, so shadows painted across roofs no tree could shade.
 */
function shadows(map: MapLibreMap, spec: ShadowsSpec) {
  add(map, {
    id: spec.id, type: 'fill-extrusion', source: source(map, spec, null), layout: vis(spec),
    paint: {
      'fill-extrusion-color': spec.color ?? '#1c1b19',
      'fill-extrusion-height': 0.4,
      'fill-extrusion-base': 0,
      'fill-extrusion-opacity': spec.opacity ?? 0.18,
    },
  })
}

function fill(map: MapLibreMap, spec: FillSpec) {
  add(map, {
    id: spec.id, type: 'fill', source: source(map, spec, spec.data), layout: vis(spec),
    paint: {
      'fill-color': spec.color,
      'fill-opacity': spec.opacity ?? 0.35,
      ...(spec.outlineColor ? { 'fill-outline-color': spec.outlineColor } : {}),
    },
  })
}

/** Exact-match colours for a class field, with a fallback for the rest. */
export function matchExpression(
  field: string,
  categories: Record<string, string>,
  fallback: string,
) {
  return ['match', ['get', field], ...Object.entries(categories).flat(), fallback] as unknown as Expr
}

function choropleth(map: MapLibreMap, spec: ChoroplethSpec) {
  const src = source(map, spec, spec.data)
  add(map, {
    id: spec.id, type: 'fill', source: src, layout: vis(spec),
    paint: {
      'fill-color': spec.categories
        ? matchExpression(spec.field, spec.categories, spec.fallbackColor ?? '#cccccc')
        : rampExpression(spec.field, spec.ramp ?? []),
      'fill-opacity': spec.opacity ?? 0.85,
    },
  })
  if (spec.outline) {
    add(map, {
      id: `${spec.id}-line`, type: 'line', source: src,
      paint: { 'line-color': spec.outline.color, 'line-width': spec.outline.width ?? 1 },
    })
  }
}

function raster(map: MapLibreMap, spec: RasterSpec) {
  const src = spec.sourceId ?? sourceIdFor(spec.id)
  if (!map.getSource(src)) {
    map.addSource(src, { type: 'image', url: spec.url, coordinates: spec.corners })
  }
  add(map, {
    id: spec.id, type: 'raster', source: src, layout: vis(spec),
    paint: {
      'raster-opacity': spec.opacity ?? 0.75,
      // Nearest keeps the cells honest: smoothing invents detail the
      // underlying measurement does not have.
      'raster-resampling': 'nearest',
    },
  })
}

function ring(map: MapLibreMap, spec: RingSpec) {
  add(map, {
    id: spec.id, type: 'line', source: source(map, spec, null), layout: vis(spec),
    paint: {
      'line-color': spec.color ?? '#17513a',
      'line-width': spec.width ?? 1.6,
      'line-dasharray': [2, 2],
    },
  })
}

/**
 * Flat colour, interpolated ramp, or exact-match categories — whichever the
 * spec asked for. Shared so the three data-driven layers cannot drift apart.
 */
function colorFor(spec: LineSpec | PointsSpec, fallback = '#2b6cb0') {
  if (!spec.field) return spec.color ?? fallback
  if (spec.categories) {
    return matchExpression(spec.field, spec.categories, spec.fallbackColor ?? fallback)
  }
  return spec.ramp ? rampExpression(spec.field, spec.ramp) : (spec.color ?? fallback)
}

function line(map: MapLibreMap, spec: LineSpec) {
  add(map, {
    id: spec.id, type: 'line', source: source(map, spec, spec.data), layout: vis(spec),
    paint: {
      'line-color': colorFor(spec),
      'line-width': spec.width ?? 1.4,
      'line-opacity': spec.opacity ?? 0.9,
    },
  })
}

function points(map: MapLibreMap, spec: PointsSpec) {
  add(map, {
    id: spec.id, type: 'circle', source: source(map, spec, spec.data), layout: vis(spec),
    paint: {
      'circle-color': colorFor(spec),
      // Grow with zoom, or a city-wide dot map is unreadable at both ends.
      'circle-radius': ['interpolate', ['linear'], ['zoom'],
        10, (spec.radius ?? 4) * 0.5, 17, spec.radius ?? 4] as unknown as Expr,
      'circle-opacity': spec.opacity ?? 0.85,
      'circle-stroke-width': spec.strokeColor ? 1 : 0,
      'circle-stroke-color': spec.strokeColor ?? '#ffffff',
    },
  })
}

export function applyLayers(map: MapLibreMap, specs: LayerSpec[], fields: FieldMap) {
  for (const spec of specs) {
    switch (spec.kind) {
      case 'buildings': buildings(map, spec, fields); break
      case 'trees': trees(map, spec); break
      case 'shadows': shadows(map, spec); break
      case 'fill': fill(map, spec); break
      case 'choropleth': choropleth(map, spec); break
      case 'raster': raster(map, spec); break
      case 'ring': ring(map, spec); break
      case 'line': line(map, spec); break
      case 'points': points(map, spec); break
    }
  }
}

/** Layers a spec creates besides the one named by its id. */
function companionIds(spec: LayerSpec): string[] {
  if (spec.kind === 'trees') return [`${spec.id}-trunk`, `${spec.id}-crown`]
  if (spec.kind === 'choropleth' && spec.outline) return [`${spec.id}-line`]
  return []
}

/** Everything about a spec except its data — changing any of it needs a repaint. */
const styleSignature = (spec: LayerSpec) =>
  JSON.stringify(spec, (key, value) => (key === 'data' ? undefined : value))

const signatures = new WeakMap<MapLibreMap, Map<string, string>>()

/**
 * Re-apply specs against a live map.
 *
 * `applyLayers` runs once at mount and its adds are idempotent, so it cannot
 * express a dataset that changes. This reconciles instead: new data is pushed
 * through `setData` (cheap, keeps the source), while a changed *style* — a
 * different ramp field, colour or width — drops the layer so it can be rebuilt,
 * because MapLibre paint properties are set individually and rebuilding is
 * simpler than diffing them.
 */
export function syncLayers(map: MapLibreMap, specs: LayerSpec[], fields: FieldMap) {
  let seen = signatures.get(map)
  if (!seen) signatures.set(map, (seen = new Map()))

  for (const spec of specs) {
    const next = styleSignature(spec)
    if (seen.get(spec.id) !== next && map.getLayer(spec.id)) {
      for (const id of [spec.id, ...companionIds(spec)]) {
        if (map.getLayer(id)) map.removeLayer(id)
      }
    }
    seen.set(spec.id, next)
  }

  applyLayers(map, specs, fields)

  for (const spec of specs) {
    if (!('data' in spec) || spec.data == null) continue
    const src = map.getSource(spec.sourceId ?? sourceIdFor(spec.id))
    if (src && 'setData' in src) {
      (src as { setData: (d: SourceData) => void }).setData(spec.data)
    }
  }
}
