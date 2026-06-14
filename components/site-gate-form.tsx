'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface SiteGateFormProps {
  /** Path to return to after a successful unlock. */
  from: string
}

export function SiteGateForm({ from }: SiteGateFormProps) {
  const t = useTranslations('siteGate')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return
    setLoading(true)
    setError(false)

    try {
      const res = await fetch('/api/site-unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, from }),
      })

      if (res.ok) {
        const data = (await res.json()) as { redirect?: string }
        const target = data.redirect && data.redirect.startsWith('/') ? data.redirect : '/'
        // Full navigation so middleware re-evaluates with the new cookie.
        window.location.assign(target)
        return
      }

      setError(true)
      setLoading(false)
    } catch {
      setError(true)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2 text-left">
        <Label htmlFor="site-password">{t('passwordLabel')}</Label>
        <Input
          id="site-password"
          name="password"
          type="password"
          autoComplete="off"
          autoFocus
          required
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            if (error) setError(false)
          }}
          aria-invalid={error}
          aria-describedby={error ? 'site-password-error' : undefined}
          placeholder={t('passwordPlaceholder')}
        />
        {error && (
          <p id="site-password-error" role="alert" className="text-sm text-destructive">
            {t('error')}
          </p>
        )}
      </div>

      <Button type="submit" disabled={loading || password.length === 0} className="w-full">
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {t('submitting')}
          </>
        ) : (
          t('submit')
        )}
      </Button>
    </form>
  )
}
