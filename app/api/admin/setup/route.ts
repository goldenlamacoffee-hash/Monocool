'use server'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { secret, email, password, name } = body

    // Validate secret
    if (!process.env.ADMIN_SETUP_SECRET) {
      return NextResponse.json(
        { error: 'Admin setup is not configured' },
        { status: 500 }
      )
    }

    if (secret !== process.env.ADMIN_SETUP_SECRET) {
      return NextResponse.json(
        { error: 'Invalid setup secret' },
        { status: 401 }
      )
    }

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1)

    if (existingUser.length > 0) {
      // Update existing user to admin
      await db
        .update(user)
        .set({ 
          role: 'admin', 
          status: 'approved',
          updatedAt: new Date() 
        })
        .where(eq(user.email, email))

      return NextResponse.json({
        success: true,
        message: 'Existing user upgraded to admin',
        isNewUser: false
      })
    }

    // Create new admin user using Better Auth's sign up
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    })

    if (!result || !result.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Update the user to be admin with approved status
    await db
      .update(user)
      .set({ 
        role: 'admin', 
        status: 'approved',
        updatedAt: new Date() 
      })
      .where(eq(user.id, result.user.id))

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully',
      isNewUser: true
    })

  } catch (error) {
    console.error('Admin setup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
