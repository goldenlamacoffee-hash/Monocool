'use client'

import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  fetchOptions: {
    onError: (ctx) => {
      console.log('[v0] Auth error:', ctx.error)
    },
  },
})

export const { signIn, signUp, signOut, useSession } = authClient
