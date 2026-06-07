'use server'

import { db } from '@/lib/db'
import { user, account } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'

// This script creates the initial admin account
// Run once via API route or server action

export async function seedAdminUser() {
  const adminEmail = 'admin@monocool.at'
  const adminPassword = 'Merlinn0330...'
  const adminName = 'MonoCool Admin'

  try {
    // Check if admin already exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, adminEmail))
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
        .where(eq(user.email, adminEmail))
      
      return { success: true, message: 'Existing user upgraded to admin' }
    }

    // Create new admin using Better Auth's signup
    const result = await auth.api.signUpEmail({
      body: {
        email: adminEmail,
        password: adminPassword,
        name: adminName,
      },
    })

    if (result.user) {
      // Update the user to be admin with approved status
      await db
        .update(user)
        .set({ 
          role: 'admin', 
          status: 'approved',
          companyName: 'MonoCool GmbH',
          country: 'AT',
          updatedAt: new Date() 
        })
        .where(eq(user.id, result.user.id))

      return { success: true, message: 'Admin user created successfully' }
    }

    return { success: false, message: 'Failed to create user' }
  } catch (error) {
    console.error('Error seeding admin:', error)
    return { success: false, message: String(error) }
  }
}
