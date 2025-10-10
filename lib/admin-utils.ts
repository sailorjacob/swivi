import { prisma } from './prisma'

/**
 * Admin utility functions for user management
 */

export class AdminUtils {
  /**
   * Promote a user to admin role
   */
  static async promoteToAdmin(userId: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { role: 'ADMIN' }
      })
      console.log(`✅ User ${userId} promoted to ADMIN`)
    } catch (error) {
      console.error(`❌ Failed to promote user ${userId} to admin:`, error)
      throw error
    }
  }

  /**
   * Demote an admin to clipper role
   */
  static async demoteFromAdmin(userId: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { role: 'CLIPPER' }
      })
      console.log(`✅ User ${userId} demoted to CLIPPER`)
    } catch (error) {
      console.error(`❌ Failed to demote user ${userId} from admin:`, error)
      throw error
    }
  }

  /**
   * Get all admin users
   */
  static async getAdmins(): Promise<Array<{
    id: string
    name: string | null
    email: string | null
    role: string
    createdAt: Date
  }>> {
    try {
      return await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      console.error('❌ Failed to get admin users:', error)
      throw error
    }
  }

  /**
   * Check if a user is an admin
   */
  static async isAdmin(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      })
      return user?.role === 'ADMIN'
    } catch (error) {
      console.error(`❌ Failed to check admin status for user ${userId}:`, error)
      return false
    }
  }

  /**
   * Get user statistics for admin dashboard
   */
  static async getUserStats() {
    try {
      const [
        totalUsers,
        adminUsers,
        clipperUsers
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'ADMIN' } }),
        prisma.user.count({ where: { role: 'CLIPPER' } })
      ])

      return {
        total: totalUsers,
        admins: adminUsers,
        clippers: clipperUsers
      }
    } catch (error) {
      console.error('❌ Failed to get user statistics:', error)
      throw error
    }
  }
}
