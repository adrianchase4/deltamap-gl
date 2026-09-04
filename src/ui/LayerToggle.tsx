/**
 * Layer switches, driven by the same ids the map was configured with.
 *
 * Two modes: `exclusive` for layers that must not stack (two choropleths over
 * the same polygons would just hide one another), and the default multi-select
 * for layers that legitimately overlap.
 */

import { useMapContext } from './context'
import { EDGE, Z, panelStyle } from './theme'

export interface LayerOption {
  id: string
  label: string
  /** Optional one-line description shown under the label. */
  note?: string
}

export interface LayerToggleProps {
  options: LayerOption[]
  /** Only one of these may be visible at a time. */
  exclusive?: boolean
  title?: string
  position?: 'top-right' | 'bottom-right'
}

export function LayerToggle({
  options,
  exclusive = false,
  title,
  position = 'top-right',
}: LayerToggleProps) {
  const { visible, setVisible, theme } = useMapContext()
  const ids = options.map((o) => o.id)

  const toggle = (id: string) => {
    if (exclusive) {
      // Drop every option in this group, then add the one just picked. Layers
      // outside the group are untouched.
      setVisible([...visible.filter((v) => !ids.includes(v)), id])
      return
    }
    setVisible(
      visible.includes(id) ? visible.filter((v) => v !== id) : [...visible, id],
    )
  }

  return (
    <div style={{
      position: 'absolute', right: EDGE,
      [position === 'top-right' ? 'top' : 'bottom']: EDGE,
      ...panelStyle(theme), padding: 8, minWidth: 172, zIndex: Z.overlay,
    }} role={exclusive ? 'radiogroup' : 'group'} aria-label={title ?? 'Map layers'}>
      {title && (
        <div style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
          textTransform: 'uppercase', color: theme.inkFaint, padding: '2px 4px 6px',
        }}>{title}</div>
      )}
      {options.map((option) => {
        const on = visible.includes(option.id)
        return (
          <button
            key={option.id}
            className="ucm-btn"
            role={exclusive ? 'radio' : 'switch'}
            aria-checked={on}
            onClick={() => toggle(option.id)}
            style={{
              width: '100%', justifyContent: 'flex-start', gap: 8,
              padding: '6px 4px', borderRadius: 6, textAlign: 'left',
              color: on ? theme.ink : theme.inkMuted,
              font: `12px/1.3 ${theme.font}`,
            }}
          >
            <span style={{
              width: 12, height: 12, flexShrink: 0, borderRadius: exclusive ? 999 : 3,
              border: `1.5px solid ${on ? theme.accent : theme.line}`,
              background: on ? theme.accent : 'transparent',
            }} />
            <span>
              {option.label}
              {option.note && (
                <span style={{ display: 'block', fontSize: 10, color: theme.inkFaint }}>
                  {option.note}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
