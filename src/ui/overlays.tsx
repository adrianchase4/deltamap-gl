/**
 * Floating readouts: legend, hover tooltip, zoom/status bar, caveat notice.
 *
 * All of them read from context, so each is a single self-closing tag in the
 * consuming app.
 */

import { useMapContext, type LegendSpec } from './context'
import { EDGE, Z, panelStyle } from './theme'

/** Colour ramp with tick labels, driven by the same stops the layer uses. */
export function Legend({ spec, position = 'bottom-left', offset = 0 }: {
  spec: LegendSpec | null
  position?: 'bottom-left' | 'bottom-right'
  /** Extra distance from the bottom, to clear another overlay on the same side. */
  offset?: number
}) {
  const { theme } = useMapContext()
  if (!spec) return null
  const labels = spec.labels ?? spec.ramp.map(([v]) => String(v))

  return (
    <div style={{
      position: 'absolute', bottom: EDGE + offset,
      [position === 'bottom-left' ? 'left' : 'right']: EDGE,
      ...panelStyle(theme), padding: 10, zIndex: Z.overlay,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
        textTransform: 'uppercase', color: theme.inkFaint,
      }}>{spec.title}</div>
      {spec.note && (
        <div style={{ fontSize: 10, color: theme.inkFaint, marginTop: 1 }}>{spec.note}</div>
      )}
      <div style={{
        display: 'flex', width: 176, marginTop: 8,
        borderRadius: 999, overflow: 'hidden',
      }}>
        {spec.ramp.map(([value, color]) => (
          <div key={value} style={{ flex: 1, height: 8, background: color }} />
        ))}
      </div>
      <div style={{
        display: 'flex', width: 176, justifyContent: 'space-between',
        marginTop: 4, fontSize: 10, color: theme.inkFaint,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {labels.map((l, i) => <span key={`${l}-${i}`}>{l}</span>)}
      </div>
    </div>
  )
}

/**
 * Tooltip for the feature under the cursor.
 *
 * `format` decides what to show, because only the app knows which of its
 * properties matter or how to word them.
 */
export function HoverReadout({ format }: {
  format: (props: Record<string, unknown>) => { title: string; detail?: string } | null
}) {
  const { hovered, theme } = useMapContext()
  if (!hovered) return null
  const shown = format(hovered)
  if (!shown) return null

  return (
    <div style={{
      position: 'absolute', bottom: EDGE, left: '50%', transform: 'translateX(-50%)',
      ...panelStyle(theme), padding: '8px 12px', pointerEvents: 'none', zIndex: Z.tooltip,
    }}>
      <div style={{ fontSize: 12, fontWeight: 500 }}>{shown.title}</div>
      {shown.detail && (
        <div style={{
          fontSize: 11, color: theme.inkMuted, fontVariantNumeric: 'tabular-nums',
        }}>{shown.detail}</div>
      )}
    </div>
  )
}

/** Bottom-right status strip: place name and live zoom. */
export function StatusBar({ label, offset = 0 }: { label: string; offset?: number }) {
  const { zoom, theme } = useMapContext()
  return (
    <div style={{
      position: 'absolute', bottom: EDGE + offset, right: EDGE, ...panelStyle(theme),
      padding: '6px 10px', display: 'flex', gap: 8, alignItems: 'center',
      color: theme.inkMuted, zIndex: Z.overlay,
    }}>
      {label}
      <span style={{ color: theme.inkFaint }}>·</span>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>Zoom {zoom.toFixed(1)}</span>
    </div>
  )
}

/**
 * A caveat attached to whatever is on screen.
 *
 * Exists because a number that needs a qualification and does not carry one is
 * worse than no number. Give it the text; it handles the placement.
 */
export function Notice({ children, tone = 'warn' }: {
  children: React.ReactNode
  tone?: 'warn' | 'info'
}) {
  const { theme } = useMapContext()
  if (!children) return null
  const accent = tone === 'warn' ? '#b5701f' : theme.inkMuted
  return (
    <div style={{
      position: 'absolute', top: EDGE, left: '50%', transform: 'translateX(-50%)',
      ...panelStyle(theme), padding: '8px 12px', maxWidth: 420,
      borderLeft: `3px solid ${accent}`, color: theme.inkMuted,
      fontSize: 11, lineHeight: 1.45, zIndex: Z.tooltip,
    }}>
      {children}
    </div>
  )
}
