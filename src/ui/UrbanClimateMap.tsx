/**
 * The map, its container, and the state its overlays read.
 *
 * Container, hover and click bindings, layer visibility, solar position and the
 * tree-geometry refresh all happen here; overlays are children that read from
 * context, so adding a legend is one line rather than one effect.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MapLayerMouseEvent } from 'maplibre-gl'
import { useMapInstance } from '../hooks/useMapInstance'
import { useTreeGeometry } from '../hooks/useTreeGeometry'
import { useOrbit } from '../hooks/useOrbit'
import { makeCrownRadius } from '../trees'
import { sunPosition } from '../sun'
import { applySunLight } from '../atmosphere'
import { DEFAULT_FIELDS, type LonLat, type UrbanMapConfig } from '../types'
import type { TreeCollection } from '../crowns'
import { MapContext, type MapContextValue } from './context'
import { LIGHT, ensureStyles, type Theme } from './theme'

export interface UrbanClimateMapProps {
  config: UrbanMapConfig
  /** Overlays: controls, legends, readouts. They read state from context. */
  children?: React.ReactNode
  theme?: Theme
  /** Layer ids that respond to hover and click. Defaults to every choropleth. */
  interactive?: string[]
  /** Layer ids visible on load. Defaults to every layer not marked hidden. */
  initialVisible?: string[]
  /** Date used for solar position. Only matters if a `shadows` layer is present. */
  initialDate?: Date
  /** Tree data for shadows and 3D crowns, once it has loaded. */
  trees?: TreeCollection | null
  /** Crown radius in metres, if you have a better source than the species table. */
  crownRadius?: (props: Record<string, unknown>) => number | null
  onSelect?: (props: Record<string, unknown> | null) => void
  /**
   * Expose the MapLibre instance on `window` under this name.
   *
   * Opt-in, because a library should not put things on the global object
   * uninvited. Worth turning on while debugging: without a handle you cannot
   * ask the running map what layers it actually has, and a layer that silently
   * failed to load looks identical to one that has no data.
   */
  debugGlobal?: string
  style?: React.CSSProperties
  className?: string
}

export function UrbanClimateMap({
  config,
  children,
  theme = LIGHT,
  interactive,
  initialVisible,
  initialDate,
  trees = null,
  crownRadius,
  onSelect,
  debugGlobal,
  style,
  className,
}: UrbanClimateMapProps) {
  ensureStyles()
  const container = useRef<HTMLDivElement>(null)

  const [hovered, setHovered] = useState<Record<string, unknown> | null>(null)
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null)
  const [date, setDate] = useState(() => initialDate ?? new Date())
  const [orbiting, setOrbiting] = useState(false)
  const [pitch, setPitch] = useState(config.camera?.pitch ?? 0)

  const [visible, setVisible] = useState<string[]>(
    () => initialVisible ?? config.layers.filter((l) => !l.hidden).map((l) => l.id),
  )

  const { map, ready, zoom, bearing } = useMapInstance({ container, config })

  const interactiveIds = useMemo(
    () =>
      interactive ??
      config.layers.filter((l) => l.kind === 'choropleth').map((l) => l.id),
    [interactive, config.layers],
  )

  const treesLayer = useMemo(
    () => config.layers.find((l) => l.kind === 'trees'),
    [config.layers],
  )
  const shadowsLayer = useMemo(
    () => config.layers.find((l) => l.kind === 'shadows'),
    [config.layers],
  )

  const sun = useMemo(
    () => (shadowsLayer ? sunPosition(date, config.centre) : null),
    [shadowsLayer, date, config.centre],
  )

  const radiusFn = useMemo(
    () =>
      makeCrownRadius({
        fields: { ...DEFAULT_FIELDS, ...config.fields },
        radiusOverride: crownRadius,
      }),
    [config.fields, crownRadius],
  )

  useTreeGeometry({
    map,
    ready,
    trees,
    sun,
    treesLayerId: treesLayer?.id ?? '',
    shadowsLayerId: shadowsLayer?.id,
    crownRadiusFor: radiusFn,
    crownMinZoom: treesLayer?.kind === 'trees' ? treesLayer.crownMinZoom : undefined,
    maxViewportTrees:
      treesLayer?.kind === 'trees' ? treesLayer.maxViewportTrees : undefined,
  })

  // Relight whenever the sun moves, so dragging the time slider changes how the
  // buildings are lit and not only where the shadows fall.
  useEffect(() => {
    if (!ready || !config.lightFollowsSun) return
    const m = map.current
    if (m) applySunLight(m, sun)
  }, [map, ready, sun, config.lightFollowsSun])

  const stopOrbit = useCallback(() => setOrbiting(false), [])
  useOrbit(map, orbiting, stopOrbit)

  // Hover and click, bound per interactive layer so the readout knows which
  // feature is under the cursor rather than guessing from a map-wide event.
  useEffect(() => {
    const m = map.current
    if (!m || !ready || interactiveIds.length === 0) return

    const onMove = (e: MapLayerMouseEvent) => {
      m.getCanvas().style.cursor = 'pointer'
      setHovered(e.features?.[0]?.properties ?? null)
    }
    const onLeave = () => {
      m.getCanvas().style.cursor = ''
      setHovered(null)
    }
    const onClick = (e: MapLayerMouseEvent) => {
      const props = e.features?.[0]?.properties ?? null
      setSelected(props)
      onSelect?.(props)
    }

    for (const id of interactiveIds) {
      m.on('mousemove', id, onMove)
      m.on('mouseleave', id, onLeave)
      m.on('click', id, onClick)
    }
    return () => {
      for (const id of interactiveIds) {
        m.off('mousemove', id, onMove)
        m.off('mouseleave', id, onLeave)
        m.off('click', id, onClick)
      }
    }
  }, [map, ready, interactiveIds, onSelect])

  // Layer visibility. Tree layers carry companion trunk and crown layers that
  // have to follow the parent, or toggling trees off leaves crowns floating.
  useEffect(() => {
    const m = map.current
    if (!m || !ready) return
    for (const layer of config.layers) {
      const on = visible.includes(layer.id) ? 'visible' : 'none'
      const ids =
        layer.kind === 'trees'
          ? [layer.id, `${layer.id}-trunk`, `${layer.id}-crown`]
          : layer.kind === 'choropleth' && layer.outline
            ? [layer.id, `${layer.id}-line`]
            : [layer.id]
      for (const id of ids) {
        if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', on)
      }
    }
  }, [map, ready, visible, config.layers])

  useEffect(() => {
    if (!debugGlobal || !ready) return
    ;(window as unknown as Record<string, unknown>)[debugGlobal] = map.current
    return () => {
      delete (window as unknown as Record<string, unknown>)[debugGlobal]
    }
  }, [map, ready, debugGlobal])

  useEffect(() => {
    const m = map.current
    if (!m) return
    const track = () => setPitch(m.getPitch())
    m.on('pitch', track)
    return () => {
      m.off('pitch', track)
    }
  }, [map, ready])

  const value: MapContextValue = {
    map, ready, zoom, bearing, pitch, theme, centre: config.centre,
    visible, setVisible, hovered, selected,
    sun, date, setDate, orbiting, setOrbiting,
  }

  return (
    <MapContext.Provider value={value}>
      <div
        className={className}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: 320,
          overflow: 'hidden',
          background: theme.surfaceMuted,
          ...style,
        }}
      >
        {/* maplibre-gl.css forces position:relative on its container, so the
            canvas is sized in normal flow rather than absolutely. */}
        <div ref={container} className="ucm-map" style={{ width: '100%', height: '100%' }} />
        {children}
      </div>
    </MapContext.Provider>
  )
}

/** Convenience for apps that hand the map a centre as [lat, lon] by mistake. */
export function lonLat(lon: number, lat: number): LonLat {
  return [lon, lat]
}
