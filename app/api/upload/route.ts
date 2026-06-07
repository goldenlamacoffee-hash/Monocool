import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  // Verify admin access
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File
  const productId = formData.get('productId') as string

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!productId) {
    return NextResponse.json({ error: 'No productId provided' }, { status: 400 })
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' },
      { status: 400 }
    )
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: 'File too large. Maximum size: 5MB' },
      { status: 400 }
    )
  }

  try {
    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const pathname = `products/${productId}/${timestamp}.${extension}`

    // Upload to Vercel Blob with private access
    const blob = await put(pathname, file, {
      access: 'private',
      addRandomSuffix: false,
    })

    // For private blobs, serve images through our API route
    const imageUrl = `/api/image?pathname=${encodeURIComponent(blob.pathname)}`

    return NextResponse.json({
      url: imageUrl,
      pathname: blob.pathname,
    })
  } catch (error) {
    console.error('[v0] Error uploading to blob:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload image' },
      { status: 500 }
    )
  }
}
