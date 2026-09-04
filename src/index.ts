/**
 * deltamap-gl — declarative MapLibre layers for urban climate work.
 *
 * Minimal use:
 *   <UrbanClimateMap config={{ centre, layers: [...] }}>
 *     <MapControls /><LayerToggle options={...} /><Legend spec={...} />
 *   </UrbanClimateMap>
 *
 * Layer specs are applied in order, and MapLibre draws in insertion order.
 * If something is missing here, that is a gap in the package rather than an
 * invitation to reach inside it.
 */

export * from './types'
export * from './config'
export * from './geo'
export * from './sun'
export * from './trees'
export * from './crowns'
export * from './layers'
export * from './atmosphere'

export * from './hooks/useMapInstance'
export * from './hooks/useOrbit'
export * from './hooks/useTreeGeometry'
export * from './hooks/useRemoteJson'
export * from './hooks/useRasterManifest'

export * from './ui/context'
export * from './ui/theme'
export * from './ui/UrbanClimateMap'
export * from './ui/MapControls'
export * from './ui/overlays'
export * from './ui/LayerToggle'
export * from './ui/SunControl'
export * from './ui/Panel'
export * from './ui/landing'
