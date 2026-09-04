/**
 * Visual tokens and the one stylesheet the package injects.
 *
 * Components style themselves inline from these: a library that only works if
 * you already use Tailwind is a fragment of somebody else's app. The sheet
 * exists only for `:hover`, `:focus-visible` and range thumbs, which inline
 * styles cannot express.
 */

export interface Theme {
  surface: string
  surfaceMuted: string
  ink: string
  inkMuted: string
  inkFaint: string
  line: string
  accent: string
  radius: string
  shadow: string
  font: string
}

export const LIGHT: Theme = {
  surface: '#ffffff',
  surfaceMuted: '#f4f4f1',
  ink: '#1c1b19',
  inkMuted: '#5c5a55',
  inkFaint: '#8a8880',
  line: '#e3e1dc',
  accent: '#17513a',
  radius: '8px',
  shadow: '0 1px 3px rgba(28,27,25,0.10), 0 4px 12px rgba(28,27,25,0.06)',
  font: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
}

export const DARK: Theme = {
  surface: '#1f1e1c',
  surfaceMuted: '#2a2926',
  ink: '#f2f1ee',
  inkMuted: '#b3b1aa',
  inkFaint: '#84827b',
  line: '#3a3833',
  accent: '#7fc9a3',
  radius: '8px',
  shadow: '0 1px 3px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)',
  font: LIGHT.font,
}

const STYLE_ID = 'deltamap-gl-styles'

const SHEET = `
.ucm-btn { cursor: pointer; border: 0; background: transparent; display: flex;
  align-items: center; justify-content: center; transition: background 120ms; }
.ucm-btn:hover { background: rgba(127,127,127,0.12); }
.ucm-btn:focus-visible { outline: 2px solid currentColor; outline-offset: -2px; }
.ucm-btn[aria-pressed="true"] { background: rgba(127,127,127,0.18); }
.ucm-range { -webkit-appearance: none; appearance: none; height: 4px;
  border-radius: 2px; outline: none; }
.ucm-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none;
  width: 15px; height: 15px; border-radius: 50%; cursor: pointer;
  border: 2px solid #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.3); }
.ucm-range::-moz-range-thumb { width: 15px; height: 15px; border-radius: 50%;
  cursor: pointer; border: 2px solid #fff; }
.ucm-map canvas { outline: none; }
`

/** Inject once per document. Safe to call from every component. */
export function ensureStyles(): void {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = SHEET
  document.head.appendChild(el)
}

/** The floating-panel look shared by every overlay. */
export function panelStyle(theme: Theme): React.CSSProperties {
  return {
    background: theme.surface,
    border: `1px solid ${theme.line}`,
    borderRadius: theme.radius,
    boxShadow: theme.shadow,
    color: theme.ink,
    font: `12px/1.4 ${theme.font}`,
  }
}

/**
 * Stacking order for everything drawn over the map.
 *
 * Set explicitly because the failure is silent and confusing: a decorative
 * panel with a higher z-index than the controls does not look broken, it just
 * makes the buttons beneath it look faded and stop responding.
 */
export const Z = {
  /** Columns and background panels. Below anything interactive. */
  sidebar: 1,
  /** Buttons, toggles, sliders, legends. */
  overlay: 5,
  /** Tooltips and notices, which must clear the controls. */
  tooltip: 8,
} as const

/** Distance from each edge that overlays sit at, so they line up with each other. */
export const EDGE = 12
