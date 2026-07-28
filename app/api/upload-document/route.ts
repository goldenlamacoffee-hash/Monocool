import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

const MAX_SIZE_BYTES = 25 * 1024 * 1024 // 25 MB

export async function POST(request: Request) {
  // Admin-only endpoint.
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const productId = formData.get('productId') as string | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  if (!productId) {
    return NextResponse.json({ error: 'No productId provided' }, { status: 400 })
  }

  // PDF only — validate both MIME type and extension.
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (file.type !== 'application/pdf' || ext !== 'pdf') {
    return NextResponse.json(
      { error: 'Invalid file type. Only PDF files are accepted.' },
      { status: 400 }
    )
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: 'File too large. Maximum size is 25 MB.' },
      { status: 400 }
    )
  }

  try {
    const timestamp = Date.now()
    // Sanitize original filename for the stored pathname.
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const pathname = `products/${productId}/documents/${timestamp}_${safeName}`

    const blob = await put(pathname, file, {
      access: 'public', // PDFs are served as direct download links.
      addRandomSuffix: false,
      contentType: 'application/pdf',
    })

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      fileName: file.name,
      fileSize: file.size,
    })
  } catch (error) {
    console.error('[v0] Error uploading document to blob:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload document' },
      { status: 500 }
    )
  }
}
