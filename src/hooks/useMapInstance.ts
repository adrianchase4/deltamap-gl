/**
 * Creates the MapLibre instance, applies the layer specs, and tracks the camera.
 */

import { useEffect, useRef, useState, type RefObject } from 'react'
import * as maplibregl from 'maplibre-gl'
import {
  DEFAULT_BASEMAP,
  DEFAULT_CAMERA,
  DEFAULT_HIDDEN_SOURCE_LAYERS,
} from '../config'
import { applyLayers } from '../layers'
import { applySky } from '../atmosphere'
import { DEFAULT_FIELDS, type LonLat, type UrbanMapConfig } from '../types'

interface Options {
  container: RefObject<HTMLDivElement | null>
  config: UrbanMapConfig
  onMapClick?: (point: LonLat, event: maplibregl.MapMouseEvent) => void
  /**
   * MapLibre reports a failed tile, a bad style or a broken source through its
   * `error` event and then carries on with a blank or partial map. Without a
   * handler those failures are invisible, so pass one -- at minimum to log.
   */
  onError?: (error: { message: string }) => void
}

export function useMapInstance({ container, config, onMapClick, onError }: Options) {
  const map = useRef<maplibregl.Map | null>(null)
  const [ready, setReady] = useState(false)
  const camera = { ...DEFAULT_CAMERA, ...config.camera }
  const [zoom, setZoom] = useState(camera.zoom)
  const [bearing, setBearing] = useState(camera.bearing)

  // The click handler closes over changing state, so read it through a ref and
  // register the listener once rather than re-binding on every render.
  const clickHandler = useRef(onMapClick)
  useEffect(() => {
    clickHandler.current = onMapClick
  }, [onMapClick])

  const errorHandler = useRef(onError)
  useEffect(() => {
    errorHandler.current = onError
  }, [onError])

  // Likewise the config: rebuilding the map on every render would be ruinous.
  // Layers are applied once, from whatever config was current at mount.
  const configRef = useRef(config)
  useEffect(() => {
    configRef.current = config
  }, [config])

  useEffect(() => {
    if (!container.current || map.current) return
    const cfg = configRef.current
    const cam = { ...DEFAULT_CAMERA, ...cfg.camera }

    const instance = new maplibregl.Map({
      container: container.current,
      style: cfg.basemap ?? DEFAULT_BASEMAP,
      center: cfg.centre,
      zoom: cam.zoom,
      pitch: cam.pitch,
      bearing: cam.bearing,
      maxPitch: cam.maxPitch,
      attributionControl: { compact: true },
    })
    map.current = instance

    // `style.load`, not `load`. `load` waits for the first complete render,
    // which never arrives if a basemap tile stalls -- and the caller's own
    // GeoJSON layers do not depend on basemap tiles anyway. Using `load` here
    // means a slow CDN leaves the map permanently blank.
    instance.on('style.load', () => {
      // Basemaps ship their own flat buildings. Hide them so the caller's
      // surveyed extrusions are the only buildings on screen.
      const hide = cfg.hideBasemapSourceLayers ?? DEFAULT_HIDDEN_SOURCE_LAYERS
      for (const layer of instance.getStyle().layers ?? []) {
        const sourceLayer = (layer as { 'source-layer'?: string })['source-layer']
        if (sourceLayer && hide.includes(sourceLayer)) {
          instance.setLayoutProperty(layer.id, 'visibility', 'none')
        }
      }
      applySky(instance, cfg.sky ?? false)
      // A neutral default; replaced each frame when lightFollowsSun is on.
      instance.setLight({ anchor: 'map', position: [1.4, 200, 40], intensity: 0.25 })
      applyLayers(instance, cfg.layers, { ...DEFAULT_FIELDS, ...cfg.fields })
      setReady(true)
    })

    instance.on('error', (event) => {
      errorHandler.current?.(event.error ?? { message: 'maplibre error' })
    })

    instance.on('zoom', () => setZoom(instance.getZoom()))
    instance.on('rotate', () => setBearing(instance.getBearing()))
    instance.on('click', (event: maplibregl.MapMouseEvent) => {
      clickHandler.current?.([event.lngLat.lng, event.lngLat.lat], event)
    })

    return () => {
      instance.remove()
      map.current = null
      setReady(false)
    }
  }, [container])

  return { map, ready, zoom, bearing }
}
