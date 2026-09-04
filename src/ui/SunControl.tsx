/**
 * Time-of-day and month sliders, and a readout of what the sun is doing.
 *
 * Only meaningful when the map has a `shadows` layer; without one the sliders
 * would move a sun nothing responds to, so the component renders nothing.
 */

import { useMapContext } from './context'
import { EDGE, Z, panelStyle } from './theme'
import { isDaylight, shadowLengthOf10m } from '../sun'

/** Build a date at a given month and decimal hour, keeping the year. */
export function dateAt(year: number, month: number, hour: number): Date {
  return new Date(year, month, 15, Math.floor(hour), Math.round((hour % 1) * 60))
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function SunControl({ position = 'bottom-left', offset = 0 }: {
  position?: 'bottom-left' | 'bottom-right'
  /** Push in from the edge, to clear a sidebar. */
  offset?: number
}) {
  const { sun, date, setDate, theme } = useMapContext()
  if (!sun) return null

  const hour = date.getHours() + date.getMinutes() / 60
  const month = date.getMonth()
  const year = date.getFullYear()
  const daylight = isDaylight(sun)

  const label = (text: string) => (
    <div style={{
      fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
      textTransform: 'uppercase', color: theme.inkFaint, marginBottom: 4,
    }}>{text}</div>
  )

  return (
    <div style={{
      position: 'absolute', bottom: EDGE,
      [position === 'bottom-left' ? 'left' : 'right']: EDGE + offset,
      ...panelStyle(theme), padding: 12, width: 208, zIndex: Z.overlay,
    }}>
      {label('Time of day')}
      <input
        className="ucm-range"
        type="range" min={5} max={20} step={0.25} value={hour}
        aria-label="Hour of day"
        onChange={(e) => setDate(dateAt(year, month, Number(e.target.value)))}
        style={{ width: '100%', accentColor: theme.accent }}
      />
      <div style={{
        display: 'flex', justifyContent: 'space-between', fontSize: 11,
        color: theme.inkMuted, fontVariantNumeric: 'tabular-nums', marginTop: 2,
      }}>
        <span>{formatHour(hour)}</span>
        <span>{MONTHS[month]}</span>
      </div>

      <div style={{ marginTop: 10 }}>{label('Month')}</div>
      <input
        className="ucm-range"
        type="range" min={0} max={11} step={1} value={month}
        aria-label="Month"
        onChange={(e) => setDate(dateAt(year, Number(e.target.value), hour))}
        style={{ width: '100%', accentColor: theme.accent }}
      />

      <div style={{
        marginTop: 10, paddingTop: 8, borderTop: `1px solid ${theme.line}`,
        fontSize: 11, color: theme.inkMuted, fontVariantNumeric: 'tabular-nums',
      }}>
        {daylight ? (
          <>
            Sun {sun.altitudeDeg.toFixed(0)}° above horizon
            <br />
            {/* A 10 m tree is a readable stand-in for how long every shadow is. */}
            10 m tree casts {shadowLengthOf10m(sun).toFixed(1)} m
          </>
        ) : (
          'Sun below the horizon — no shadows'
        )}
      </div>
    </div>
  )
}

function formatHour(hour: number): string {
  const h = Math.floor(hour)
  const m = Math.round((hour % 1) * 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
