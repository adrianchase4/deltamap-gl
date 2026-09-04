/**
 * Crown radius from a tree record.
 *
 * The species table is data, not code — pass your own. These are display
 * geometry, not a growth model; supply `radiusOverride` if you have fitted
 * curves.
 */

import type { FieldMap } from './types'

/** Mature crown radius in metres, by species common name. */
export const DEFAULT_CROWN_RADIUS: Record<string, number> = {
  'River red gum': 9.0,
  'London Plane': 8.5,
  'English Elm': 9.5,
  'Yellow Box': 7.0,
  'Spotted Gum': 6.5,
  'Drooping sheoak': 4.5,
  'Black Wattle': 4.0,
  'River Sheoak': 5.0,
  'Plane Tree': 8.5,
  'Lemon Scented Gum': 7.5,
  'Cyprus Plane': 8.0,
  'Smooth-barked apple': 6.0,
}

export const FALLBACK_CROWN_RADIUS = 5.0

/**
 * Inventories routinely carry implausible diameters -- Melbourne's largest
 * record is 565 cm against a 99th percentile of 130. Clamp so that one bad row
 * cannot produce a crown the size of a city block.
 */
const MAX_PLAUSIBLE_DBH_CM = 150

export interface CrownOptions {
  fields: FieldMap
  table?: Record<string, number>
  /** Return a radius in metres, or null to fall through to the heuristics. */
  radiusOverride?: (props: Record<string, unknown>) => number | null
}

export function makeCrownRadius({ fields, table, radiusOverride }: CrownOptions) {
  const lookup = table ?? DEFAULT_CROWN_RADIUS

  return function crownRadiusFor(props: Record<string, unknown>): number {
    if (radiusOverride) {
      const given = radiusOverride(props)
      if (given !== null && Number.isFinite(given) && given > 0) return given
    }

    const species = props[fields.treeSpecies]
    const named = typeof species === 'string' ? lookup[species] : undefined
    const raw = Number(props[fields.treeDbh]) || 0
    const dbh = Math.min(raw, MAX_PLAUSIBLE_DBH_CM)

    if (named) {
      // No diameter recorded: assume a mid-life tree rather than a sapling,
      // which is the commoner case in a managed street inventory.
      const maturity = dbh > 0 ? Math.min(1, dbh / 60) : 0.6
      return Math.max(1.5, named * (0.35 + 0.65 * maturity))
    }
    return dbh > 0 ? Math.max(1.5, dbh * 0.11) : FALLBACK_CROWN_RADIUS
  }
}

/** Rough height proxy for shadow projection. Not a fitted allometry. */
export function heightFromCrown(radiusM: number): number {
  return radiusM * 2.2
}
