/**
 * Landing-page pieces: hero, scroll sections, insight cards, animated figures.
 *
 * `Insight` requires a method and an uncertainty beside its number. A headline
 * figure with neither is a slogan, and the honest version should be the easy
 * one to write.
 */

import { useEffect, useRef, useState } from 'react'
import { EDGE, LIGHT, ensureStyles, panelStyle, type Theme } from './theme'

/* ------------------------------------------------------------------------ */
/* Scroll reveal                                                             */
/* ------------------------------------------------------------------------ */

/**
 * Fade and lift a block the first time it scrolls into view.
 *
 * Respects `prefers-reduced-motion`: for a reader who has asked for less
 * movement this renders the content plainly rather than animating it.
 */
export function Reveal({ children, delay = 0, as: Tag = 'div' }: {
  children: React.ReactNode
  delay?: number
  as?: 'div' | 'section' | 'li'
}) {
  const ref = useRef<HTMLElement | null>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced || typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true)
            observer.disconnect()
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag
      ref={ref as never}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : 'translateY(18px)',
        transition: `opacity 640ms ease ${delay}ms, transform 640ms cubic-bezier(.2,.7,.3,1) ${delay}ms`,
      }}
    >
      {children}
    </Tag>
  )
}

/* ------------------------------------------------------------------------ */
/* Animated figure                                                           */
/* ------------------------------------------------------------------------ */

/** Count up to a value once it is on screen. Falls back to the plain number. */
export function CountUp({ to, decimals = 0, duration = 900, prefix = '', suffix = '' }: {
  to: number
  decimals?: number
  duration?: number
  prefix?: string
  suffix?: string
}) {
  const ref = useRef<HTMLSpanElement | null>(null)
  const [value, setValue] = useState<number | null>(null)

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced || typeof IntersectionObserver === 'undefined') {
      setValue(to)
      return
    }
    const node = ref.current
    if (!node) return
    let frame = 0
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return
      observer.disconnect()
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration)
        // Ease out, so the number settles rather than stopping dead.
        setValue(to * (1 - Math.pow(1 - t, 3)))
        if (t < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    })
    observer.observe(node)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [to, duration])

  return (
    <span ref={ref} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {prefix}
      {(value ?? to).toFixed(decimals)}
      {suffix}
    </span>
  )
}

/* ------------------------------------------------------------------------ */
/* Layout                                                                    */
/* ------------------------------------------------------------------------ */

export function Hero({ eyebrow, title, lead, actions, theme = LIGHT, background }: {
  eyebrow?: string
  title: string
  lead?: string
  actions?: React.ReactNode
  theme?: Theme
  /** Anything rendered behind the text — a map, an image, a canvas. */
  background?: React.ReactNode
}) {
  ensureStyles()
  return (
    <header style={{
      position: 'relative', minHeight: '78vh', display: 'flex',
      alignItems: 'flex-end', overflow: 'hidden', background: theme.surfaceMuted,
    }}>
      {background && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>{background}</div>
      )}
      {/* Legibility over whatever sits behind, without hiding it. */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: `linear-gradient(180deg, transparent 35%, ${theme.surface} 100%)`,
      }} />
      <div style={{
        position: 'relative', zIndex: 2, padding: `0 ${EDGE * 4}px ${EDGE * 5}px`,
        maxWidth: 940, font: `14px/1.6 ${theme.font}`, color: theme.ink,
      }}>
        {eyebrow && (
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: theme.accent, marginBottom: 14,
          }}>{eyebrow}</div>
        )}
        <h1 style={{
          margin: 0, fontSize: 'clamp(30px, 5vw, 58px)', lineHeight: 1.06,
          letterSpacing: '-0.02em', fontWeight: 600,
        }}>{title}</h1>
        {lead && (
          <p style={{
            margin: '18px 0 0', maxWidth: 620, fontSize: 16, lineHeight: 1.6,
            color: theme.inkMuted,
          }}>{lead}</p>
        )}
        {actions && <div style={{ marginTop: 26, display: 'flex', gap: 10 }}>{actions}</div>}
      </div>
    </header>
  )
}

export function Section({ id, eyebrow, title, lead, children, theme = LIGHT, tone = 'plain' }: {
  id?: string
  eyebrow?: string
  title?: string
  lead?: string
  children?: React.ReactNode
  theme?: Theme
  tone?: 'plain' | 'muted'
}) {
  return (
    <section id={id} style={{
      padding: `${EDGE * 7}px ${EDGE * 4}px`,
      background: tone === 'muted' ? theme.surfaceMuted : theme.surface,
      color: theme.ink, font: `14px/1.6 ${theme.font}`,
    }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <Reveal>
          {eyebrow && (
            <div style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: theme.accent, marginBottom: 10,
            }}>{eyebrow}</div>
          )}
          {title && (
            <h2 style={{
              margin: 0, fontSize: 'clamp(22px, 3vw, 32px)', lineHeight: 1.2,
              letterSpacing: '-0.01em', fontWeight: 600, maxWidth: 760,
            }}>{title}</h2>
          )}
          {lead && (
            <p style={{
              margin: '14px 0 0', maxWidth: 680, fontSize: 15, color: theme.inkMuted,
            }}>{lead}</p>
          )}
        </Reveal>
        {children && <div style={{ marginTop: title || lead ? 34 : 0 }}>{children}</div>}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------------ */
/* Insight                                                                   */
/* ------------------------------------------------------------------------ */

export interface Insight {
  /** The number itself. */
  value: number
  decimals?: number
  prefix?: string
  suffix?: string
  /** What the number means, in a short sentence. */
  claim: string
  /** How it was measured. Required: a figure without provenance is a slogan. */
  method: string
  /** Error bars, sample size, or the limit that matters. Also required. */
  uncertainty: string
  /** What a reader could do about it. */
  action?: string
}

export function InsightCard({ insight, theme = LIGHT }: {
  insight: Insight
  theme?: Theme
}) {
  ensureStyles()
  const { value, decimals = 0, prefix, suffix, claim, method, uncertainty, action } = insight
  return (
    <article style={{
      ...panelStyle(theme), padding: 22, display: 'flex', flexDirection: 'column',
      gap: 10, height: '100%',
    }}>
      <div style={{
        fontSize: 'clamp(28px, 3.4vw, 40px)', fontWeight: 600, lineHeight: 1,
        letterSpacing: '-0.02em', color: theme.ink,
      }}>
        <CountUp to={value} decimals={decimals} prefix={prefix} suffix={suffix} />
      </div>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: theme.ink }}>{claim}</p>
      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: theme.inkMuted }}>{method}</p>
      <p style={{
        margin: 0, paddingTop: 10, borderTop: `1px solid ${theme.line}`,
        fontSize: 11, lineHeight: 1.5, color: theme.inkFaint,
      }}>{uncertainty}</p>
      {action && (
        <p style={{
          margin: 0, fontSize: 12, lineHeight: 1.5, color: theme.accent, fontWeight: 500,
        }}>{action}</p>
      )}
    </article>
  )
}

export function InsightGrid({ insights, theme = LIGHT, columns = 3 }: {
  insights: Insight[]
  theme?: Theme
  columns?: number
}) {
  return (
    <div style={{
      display: 'grid', gap: 14,
      gridTemplateColumns: `repeat(auto-fit, minmax(${Math.max(220, 980 / columns)}px, 1fr))`,
    }}>
      {insights.map((insight, i) => (
        <Reveal key={insight.claim} delay={i * 70}>
          <InsightCard insight={insight} theme={theme} />
        </Reveal>
      ))}
    </div>
  )
}

/** Pill button, for hero calls to action. */
export function Action({ children, onClick, href, theme = LIGHT, primary = false }: {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  theme?: Theme
  primary?: boolean
}) {
  ensureStyles()
  const style: React.CSSProperties = {
    padding: '10px 18px', borderRadius: 999, fontSize: 13, fontWeight: 500,
    textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
    border: `1px solid ${primary ? theme.accent : theme.line}`,
    background: primary ? theme.accent : theme.surface,
    color: primary ? '#ffffff' : theme.ink,
  }
  return href
    ? <a className="ucm-btn" href={href} style={style}>{children}</a>
    : <button className="ucm-btn" onClick={onClick} style={style}>{children}</button>
}
