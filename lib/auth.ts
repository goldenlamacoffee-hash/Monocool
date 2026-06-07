import { betterAuth } from 'better-auth'
import { pool } from '@/lib/db'

// Production domains
const productionDomains = [
  'https://monocool.at',
  'https://www.monocool.at',
  'https://monocool.cz',
  'https://www.monocool.cz',
  'https://monocool.sk',
  'https://www.monocool.sk',
  'https://monocool.eu',
  'https://www.monocool.eu',
]

export const auth = betterAuth({
  database: pool,
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'user',
        input: false,
      },
      status: {
        type: 'string',
        defaultValue: 'pending',
        input: false,
      },
      companyName: {
        type: 'string',
        required: false,
      },
      companyId: {
        type: 'string',
        required: false,
      },
      vatNumber: {
        type: 'string',
        required: false,
      },
      phone: {
        type: 'string',
        required: false,
      },
      address: {
        type: 'string',
        required: false,
      },
      city: {
        type: 'string',
        required: false,
      },
      postalCode: {
        type: 'string',
        required: false,
      },
      country: {
        type: 'string',
        required: false,
      },
    },
  },
  trustedOrigins: [
    ...productionDomains,
    ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
    'http://localhost:3000',
    'https://localhost:3000',
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: 'none' as const,
      secure: true,
    },
  },
})
