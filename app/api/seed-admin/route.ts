import { seedAdminUser } from '@/app/actions/seed-admin'
import { NextResponse } from 'next/server'

// One-time endpoint to seed the admin user
// Access: GET /api/seed-admin?secret=YOUR_ADMIN_SETUP_SECRET

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  // Verify secret
  if (secret !== process.env.ADMIN_SETUP_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await seedAdminUser()

  if (result.success) {
    return NextResponse.json({ 
      success: true, 
      message: result.message,
      credentials: {
        email: 'admin@monocool.at',
        note: 'Use the password you configured'
      }
    })
  }

  return NextResponse.json({ error: result.message }, { status: 500 })
}
