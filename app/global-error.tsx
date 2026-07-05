'use client'

import { useEffect } from 'react'

/**
 * Top-level error boundary. Catches catastrophic render failures — including
 * errors thrown by the locale layout itself (e.g. a transient DB failure in the
 * market-session guard or site-settings lookup) — that no nested boundary can
 * handle. Renders its own <html>/<body> and offers a reload, so users get a
 * recoverable page instead of the browser's "This page couldn't load" screen.
 *
 * Localized copy is intentionally avoided here: this boundary can render when the
 * i18n provider failed to mount, so it uses short neutral text per language,
 * picked from the URL locale prefix.
 */
const COPY: Record<string, { title: string; body: string; button: string }> = {
  sk: { title: 'Niečo sa pokazilo', body: 'Stránku sa nepodarilo načítať.', button: 'Načítať znova' },
  cs: { title: 'Něco se pokazilo', body: 'Stránku se nepodařilo načíst.', button: 'Načíst znovu' },
  de: { title: 'Etwas ist schiefgelaufen', body: 'Die Seite konnte nicht geladen werden.', button: 'Neu laden' },
  en: { title: 'Something went wrong', body: 'This page could not be loaded.', button: 'Reload' },
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.log('[v0] global error boundary:', error?.message, error?.digest)
  }, [error])

  const seg =
    typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : 'en'
  const c = COPY[seg] ?? COPY.en

  return (
    <html lang={seg in COPY ? seg : 'en'}>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0b1220',
          color: '#e8edf6',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          padding: '1rem',
        }}
      >
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.5rem' }}>
            {c.title}
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#9fb0c9', margin: '0 0 1.5rem' }}>
            {c.body}
          </p>
          <button
            onClick={() => reset()}
            style={{
              cursor: 'pointer',
              borderRadius: 12,
              border: 'none',
              padding: '0.65rem 1.25rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              background: '#2f6bff',
              color: '#fff',
            }}
          >
            {c.button}
          </button>
        </div>
      </body>
    </html>
  )
}
