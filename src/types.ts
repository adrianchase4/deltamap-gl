/**
 * The contract with whatever app uses this package.
 *
 * Nothing here names a city or a dataset field: every dataset-specific string
 * is supplied by the caller. Wanting to import an app type into this package
 * means the dependency is pointing the wrong way — add a spec field instead.
 */

export type LonLat = [number, number]

/** Image corners, clockwise from top-left. */
export type ImageCorners = [LonLat, LonLat, LonLat, LonLat]

export interface CameraSpec {
  zoom: number
  pitch: number
  bearing: number
  maxPitch: number
}

/** A data value and the colour at that value. */
export type RampStop = [value: number, color: string]

/** String = URL for MapLibre to fetch; object = inline; null = filled at runtime. */
export type SourceData = string | GeoJSON.FeatureCollection | null

/** Property names to read out of your GeoJSON. Defaults suit City of Melbourne data. */
export interface FieldMap {
  buildingHeight: string
  /** Used when the full height is missing. */
  buildingFallbackHeight: string
  treeSpecies: string
  /** Diameter at breast height, centimetres. */
  treeDbh: string
}

export const DEFAULT_FIELDS: FieldMap = {
  buildingHeight: 'structure_extrusion',
  buildingFallbackHeight: 'footprint_extrusion',
  treeSpecies: 'common_name',
  treeDbh: 'diameter_breast_height',
}

/**
 * Every 3D layer is `fill-extrusion` on purpose: extrusions share one depth
 * pass and occlude each other correctly, while a flat `fill` or a `circle` is
 * drawn afterwards in screen space and paints over buildings it should be
 * hidden behind.
 */
export type LayerSpec =
  | BuildingsSpec | TreesSpec | ShadowsSpec
  | FillSpec | ChoroplethSpec | RasterSpec | RingSpec
  | LineSpec | PointsSpec

export interface BaseSpec {
  id: string
  hidden?: boolean
  /** Share one source across layers, so the data loads once. */
  sourceId?: string
}

export interface BuildingsSpec extends BaseSpec {
  kind: 'buildings'
  data: SourceData
  ramp?: RampStop[]
  opacity?: number
}

export interface TreesSpec extends BaseSpec {
  kind: 'trees'
  data: SourceData
  /** Below this, flat ground discs; at or above, extruded trunk and crown. */
  crownMinZoom?: number
  /** Cap per viewport pass, so panning stays smooth. */
  maxViewportTrees?: number
  crownColor?: string
  trunkColor?: string
}

export interface ShadowsSpec extends BaseSpec {
  kind: 'shadows'
  color?: string
  opacity?: number
}

export interface FillSpec extends BaseSpec {
  kind: 'fill'
  data: SourceData
  color: string
  opacity?: number
  outlineColor?: string
}

export interface ChoroplethSpec extends BaseSpec {
  kind: 'choropleth'
  data: SourceData
  field: string
  /** Colours for a continuous field. Ignored when `categories` is given. */
  ramp?: RampStop[]
  /**
   * Colour by exact value instead of interpolating — for a field holding
   * classes rather than magnitudes. Interpolating those implies an ordering
   * and a distance between them that the data does not have.
   */
  categories?: Record<string, string>
  /** Fill for values missing from `categories`. */
  fallbackColor?: string
  opacity?: number
  outline?: { color: string; width?: number }
  keyField?: string
}

/**
 * One georeferenced image over four corners — how a continuous surface reaches
 * the map without a tile server. Past a few thousand pixels a side, use tiles.
 */
export interface RasterSpec extends BaseSpec {
  kind: 'raster'
  url: string
  corners: ImageCorners
  opacity?: number
}

export interface RingSpec extends BaseSpec {
  kind: 'ring'
  color?: string
  width?: number
}

/** Linear features — a road, path or pipe network. */
export interface LineSpec extends BaseSpec {
  kind: 'line'
  data: SourceData
  color?: string
  width?: number
  opacity?: number
  /** Colour by a numeric property instead of a flat colour. */
  field?: string
  ramp?: RampStop[]
  /** Colour by exact value, for a field holding classes rather than magnitudes. */
  categories?: Record<string, string>
  fallbackColor?: string
}

/**
 * Point features as screen-space circles.
 *
 * Circles are drawn after the depth pass, so they paint over buildings they sit
 * behind. That is the right trade for a dot map — a marker you cannot see is
 * worse than one that floats — but it is why `trees` extrudes instead.
 */
export interface PointsSpec extends BaseSpec {
  kind: 'points'
  data: SourceData
  color?: string
  radius?: number
  opacity?: number
  strokeColor?: string
  /** Colour by a numeric property instead of a flat colour. */
  field?: string
  ramp?: RampStop[]
  /** Colour by exact value, for a field holding classes rather than magnitudes. */
  categories?: Record<string, string>
  fallbackColor?: string
}

/**
 * Sky, horizon and ground fog. A pitched 3D map without any of this reads as
 * grey boxes on a flat plate.
 */
export interface SkySpec {
  skyColor?: string
  horizonColor?: string
  fogColor?: string
  horizonBlend?: number
  fogGroundBlend?: number
}

export interface UrbanMapConfig {
  centre: LonLat
  camera?: Partial<CameraSpec>
  /** Defaults to CARTO Positron, which needs no API key. */
  basemap?: string
  fields?: Partial<FieldMap>
  layers: LayerSpec[]
  /** Basemap `source-layer`s to hide. Defaults to hiding its buildings. */
  hideBasemapSourceLayers?: string[]
  /** `true` uses a neutral daylight preset. */
  sky?: SkySpec | boolean
  /**
   * Point the map light at the real sun. Needs a `shadows` layer for the solar
   * position. Without it a low sun still lights facades as though it were noon.
   */
  lightFollowsSun?: boolean
}
