/**
 * Sidebar cards and the metric strip.
 *
 * `Stat` deliberately takes an optional `caveat`. A figure that needs a
 * qualification and has nowhere to put one tends to get published without it.
 */

import { useMapContext } from './context'
import { EDGE, Z, panelStyle } from './theme'

export function Panel({ title, children, style }: {
  title?: string
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  const { theme } = useMapContext()
  return (
    <section style={{ ...panelStyle(theme), padding: 14, ...style }}>
      {title && (
        <h2 style={{
          margin: '0 0 10px', fontSize: 10, fontWeight: 600,
          letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.inkFaint,
        }}>{title}</h2>
      )}
      {children}
    </section>
  )
}

export interface StatProps {
  label: string
  value: string
  unit?: string
  /** Small before/after pill, for scenario comparisons. */
  delta?: string
  /** Shown beneath in muted text. Use it; do not publish a number that needs one without it. */
  caveat?: string
}

export function Stat({ label, value, unit, delta, caveat }: StatProps) {
  const { theme } = useMapContext()
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '0.05em',
        textTransform: 'uppercase', color: theme.inkFaint,
      }}>{label}</div>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 3,
        fontVariantNumeric: 'tabular-nums',
      }}>
        <span style={{ fontSize: 20, fontWeight: 600, color: theme.ink }}>{value}</span>
        {unit && <span style={{ fontSize: 11, color: theme.inkMuted }}>{unit}</span>}
        {delta && (
          <span style={{
            fontSize: 10, padding: '1px 6px', borderRadius: 999,
            background: theme.surfaceMuted, color: theme.inkMuted,
          }}>{delta}</span>
        )}
      </div>
      {caveat && (
        <div style={{ fontSize: 10, color: theme.inkFaint, marginTop: 3, lineHeight: 1.35 }}>
          {caveat}
        </div>
      )}
    </div>
  )
}

/** Horizontal strip of stats along the bottom of the map. */
export function StatBar({ stats }: { stats: StatProps[] }) {
  const { theme } = useMapContext()
  if (stats.length === 0) return null
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      display: 'flex', gap: 24, alignItems: 'center',
      padding: '10px 16px', overflowX: 'auto', zIndex: Z.overlay,
      background: theme.surface, borderTop: `1px solid ${theme.line}`,
      font: `12px/1.4 ${theme.font}`,
    }}>
      {stats.map((s) => <Stat key={s.label} {...s} />)}
    </div>
  )
}

/** Left-hand column that scrolls independently of the map. */
export function Sidebar({ children, width = 320 }: {
  children: React.ReactNode
  width?: number
}) {
  const { theme } = useMapContext()
  return (
    <aside style={{
      position: 'absolute', top: 0, left: 0, bottom: 0, width,
      display: 'flex', flexDirection: 'column', gap: 10,
      padding: EDGE, overflowY: 'auto', zIndex: Z.sidebar,
      background: 'transparent', pointerEvents: 'none',
      font: `12px/1.4 ${theme.font}`,
    }}>
      {/* The column itself lets clicks through to the map; only its cards catch them. */}
      <div style={{ pointerEvents: 'auto', display: 'grid', gap: 10 }}>{children}</div>
    </aside>
  )
}
