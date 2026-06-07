import { NextResponse } from 'next/server'
import { getProductImages } from '@/app/actions/gallery'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const productId = parseInt(id, 10)
  
  if (isNaN(productId)) {
    return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
  }
  
  try {
    const images = await getProductImages(productId)
    return NextResponse.json(images)
  } catch (error) {
    console.error('[v0] Error fetching product images:', error)
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 })
  }
}
