import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

const MAX_SIZE_BYTES = 25 * 1024 * 1024 // 25 MB

// Resolve the public document store token.
// When the dedicated public store (MONOCOOL_PUBLIC_BLOB_READ_WRITE_TOKEN) is
// connected, use it exclusively — it must be configured as a PUBLIC store in
// Vercel. Falls back to BLOB_READ_WRITE_TOKEN only during development / before
// the public store is connected (will fail at runtime if that store is private).
function getPublicBlobToken(): string {
  const token =
    process.env.MONOCOOL_PUBLIC_BLOB_READ_WRITE_TOKEN ??
    process.env.BLOB_READ_WRITE_TOKEN

  if (!token) {
    throw new Error(
      'Dokumentenspeicher nicht konfiguriert. ' +
      'Bitte MONOCOOL_PUBLIC_BLOB_READ_WRITE_TOKEN in den Projekt-Umgebungsvariablen setzen.'
    )
  }
  return token
}

export async function POST(request: Request) {
  // Admin-only endpoint.
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const productId = formData.get('productId') as string | null

  if (!file) {
    return NextResponse.json({ error: 'Keine Datei angegeben.' }, { status: 400 })
  }
  if (!productId || isNaN(parseInt(productId, 10))) {
    return NextResponse.json({ error: 'Keine gültige Produkt-ID angegeben.' }, { status: 400 })
  }

  // PDF only — validate both MIME type and extension.
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (file.type !== 'application/pdf' || ext !== 'pdf') {
    return NextResponse.json(
      { error: 'Ungültiger Dateityp. Nur PDF-Dateien sind erlaubt.' },
      { status: 400 }
    )
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: 'Datei zu groß. Maximale Größe: 25 MB.' },
      { status: 400 }
    )
  }

  let blobPathname: string | null = null

  try {
    const token = getPublicBlobToken()

    const timestamp = Date.now()
    // Sanitize original filename — strip unsafe chars, preserve extension.
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    blobPathname = `products/${productId}/documents/${timestamp}_${safeName}`

    const blob = await put(blobPathname, file, {
      access: 'public',      // PDFs are served as public download links
      addRandomSuffix: false, // pathname already includes timestamp for uniqueness
      contentType: 'application/pdf',
      token,                 // explicitly use the public store — never the private one
    })

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      fileName: file.name,
      fileSize: file.size,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)

    // Surface a clear German error when the store access mode is wrong.
    if (msg.includes('public access') && msg.includes('private store')) {
      console.error('[upload-document] Store access mismatch:', {
        productId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        blobPathname,
        error: msg,
      })
      return NextResponse.json(
        {
          error:
            'Der Dokumentenspeicher ist falsch konfiguriert. ' +
            'Bitte prüfen Sie die Verbindung zum öffentlichen Vercel-Blob-Speicher.',
        },
        { status: 500 }
      )
    }

    console.error('[upload-document] Upload failed:', {
      productId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      blobPathname,
      error: msg,
    })
    return NextResponse.json(
      { error: 'Das Dokument konnte nicht hochgeladen werden. Bitte versuchen Sie es erneut.' },
      { status: 500 }
    )
  }
}
