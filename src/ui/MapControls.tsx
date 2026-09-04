/**
 * Viewport controls: zoom, recentre, tilt, rotate, orbit.
 *
 * Icons are inline SVG rather than an icon package, so the library does not
 * drag a dependency into every consumer for six glyphs.
 */

import { useMapContext } from './context'
import { EDGE, Z, panelStyle } from './theme'
import { ROTATE_STEP_DEG } from '../config'

const ICONS = {
  plus: 'M8 3v10M3 8h10',
  minus: 'M3 8h10',
  centre: 'M8 1v3M8 12v3M1 8h3M12 8h3',
  tilt: 'M2 11l6-7 6 7M2 11l6 3 6-3',
  rotate: 'M3 8a5 5 0 1 1 1.6 3.7M3 12V8h4',
} as const

function Icon({ path }: { path: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

export interface MapControlsProps {
  /** Corner to sit in. */
  position?: 'top-left' | 'top-right'
  /** Hide the tilt, rotate and orbit buttons on a flat 2D map. */
  show3D?: boolean
  /** Push in from the edge, to clear a sidebar. */
  offset?: number
}

export function MapControls({
  position = 'top-left',
  show3D = true,
  offset = 0,
}: MapControlsProps) {
  const { map, theme, bearing, pitch, centre, orbiting, setOrbiting } = useMapContext()
  const m = () => map.current

  // Inside a group the parent paints the background; a standalone button has to
  // paint its own. Spreading `btn` after panelStyle used to blank the surface,
  // leaving every solo control invisible against a pale map.
  const btn: React.CSSProperties = {
    width: 32, height: 32, color: theme.inkMuted, background: 'transparent',
  }
  const solo: React.CSSProperties = { ...btn, background: theme.surface }
  const group: React.CSSProperties = {
    ...panelStyle(theme), display: 'flex', flexDirection: 'column',
    overflow: 'hidden', padding: 0,
  }

  return (
    <div style={{
      position: 'absolute', top: EDGE,
      [position === 'top-left' ? 'left' : 'right']: EDGE + offset,
      display: 'flex', flexDirection: 'column', gap: 8, zIndex: Z.overlay,
    }}>
      <div style={group}>
        <button className="ucm-btn" style={{ ...btn, borderBottom: `1px solid ${theme.line}` }}
          aria-label="Zoom in" onClick={() => m()?.zoomIn()}>
          <Icon path={ICONS.plus} />
        </button>
        <button className="ucm-btn" style={btn}
          aria-label="Zoom out" onClick={() => m()?.zoomOut()}>
          <Icon path={ICONS.minus} />
        </button>
      </div>

      <button className="ucm-btn" style={{ ...panelStyle(theme), ...solo }}
        aria-label="Recentre" onClick={() => m()?.flyTo({ center: centre })}>
        <Icon path={ICONS.centre} />
      </button>

      {show3D && (
        <>
          <button className="ucm-btn" style={{ ...panelStyle(theme), ...solo }}
            aria-label={pitch > 20 ? 'Flatten view' : 'Tilt view'}
            aria-pressed={pitch > 20}
            onClick={() => m()?.easeTo({ pitch: pitch > 20 ? 0 : 58 })}>
            <Icon path={ICONS.tilt} />
          </button>

          <button className="ucm-btn" style={{ ...panelStyle(theme), ...solo }}
            aria-label="Rotate"
            onClick={() => m()?.easeTo({ bearing: bearing + ROTATE_STEP_DEG })}>
            <Icon path={ICONS.rotate} />
          </button>

          {/* The needle points north, so it doubles as a compass and a reset. */}
          <button className="ucm-btn" style={{ ...panelStyle(theme), ...solo }}
            aria-label="Reset bearing to north"
            onClick={() => m()?.easeTo({ bearing: 0 })}>
            <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"
              style={{ transform: `rotate(${-bearing}deg)` }}>
              <path d="M8 2l2.4 9L8 9.4 5.6 11z" fill={theme.accent} />
            </svg>
          </button>

          <button className="ucm-btn"
            style={{ ...panelStyle(theme), ...solo, color: orbiting ? theme.accent : theme.inkMuted }}
            aria-label="Auto-orbit" aria-pressed={orbiting}
            onClick={() => setOrbiting(!orbiting)}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none"
              stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <ellipse cx="8" cy="8" rx="6.5" ry="3" />
              <circle cx="8" cy="8" r="1.6" fill="currentColor" stroke="none" />
            </svg>
          </button>
        </>
      )}
    </div>
  )
}
