/**
 * Shared state, so overlay components are one-liners.
 *
 * `<MapControls />` needs the map instance, `<Legend />` needs to know which
 * layer is showing, `<HoverReadout />` needs the feature under the cursor.
 * Threading all of that through props would put the plumbing back in the app,
 * which is the thing this package exists to remove.
 */

import { createContext, useContext, type RefObject } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import type { SunPosition } from '../sun'
import type { Theme } from './theme'
import type { LonLat, RampStop } from '../types'

/** What a legend needs to draw itself. */
export interface LegendSpec {
  title: string
  note?: string
  ramp: RampStop[]
  /** Tick labels under the ramp. Defaults to the ramp's own stop values. */
  labels?: string[]
}

export interface MapContextValue {
  map: RefObject<MapLibreMap | null>
  ready: boolean
  zoom: number
  bearing: number
  pitch: number
  theme: Theme
  centre: LonLat

  /** Layer ids currently visible, and the setter the toggles use. */
  visible: string[]
  setVisible: (ids: string[]) => void

  /** Feature properties under the cursor, or null. */
  hovered: Record<string, unknown> | null
  /** Feature properties last clicked, or null. */
  selected: Record<string, unknown> | null

  /** Solar position driving the shadow layer, if the app uses one. */
  sun: SunPosition | null
  /** Date the sun is computed for; `setDate` moves the time-of-day control. */
  date: Date
  setDate: (date: Date) => void

  orbiting: boolean
  setOrbiting: (on: boolean) => void
}

export const MapContext = createContext<MapContextValue | null>(null)

export function useMapContext(): MapContextValue {
  const value = useContext(MapContext)
  if (!value) {
    throw new Error(
      'deltamap-gl: this component must be rendered inside <UrbanClimateMap>.',
    )
  }
  return value
}
