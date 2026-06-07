'use client'

import { createAuthClient } from 'better-auth/react'
import { inferAdditionalFields } from 'better-auth/client/plugins'
import type { auth } from '@/lib/auth'

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
  fetchOptions: {
    onError: (ctx) => {
      console.log('[v0] Auth error:', ctx.error)
    },
  },
})

export const { signIn, signUp, signOut, useSession } = authClient
