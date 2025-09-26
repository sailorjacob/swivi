/**
 * Utility functions for handling BigInt serialization in API responses
 */

/**
 * Recursively converts BigInt values to strings in an object
 * This is needed because JSON.stringify() cannot serialize BigInt values
 */
export function serializeBigInt<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString() as unknown as T
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => serializeBigInt(item)) as unknown as T
  }
  
  if (typeof obj === 'object') {
    const serialized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeBigInt(value)
    }
    return serialized
  }
  
  return obj
}

/**
 * Convert specific BigInt fields to appropriate types for a user object
 */
export function serializeUser(user: any) {
  if (!user) return user
  
  return {
    ...user,
    // Convert Decimal to number for totalEarnings (so .toFixed() works)
    totalEarnings: user.totalEarnings ? Number(user.totalEarnings.toString()) : 0,
    // Convert BigInt to number for totalViews (so .toFixed() works)
    totalViews: user.totalViews ? Number(user.totalViews.toString()) : 0
  }
}

/**
 * Convert specific BigInt fields to numbers for a clip object
 */
export function serializeClip(clip: any) {
  if (!clip) return clip
  
  return {
    ...clip,
    views: clip.views ? Number(clip.views.toString()) : 0,
    likes: clip.likes ? Number(clip.likes.toString()) : 0,
    shares: clip.shares ? Number(clip.shares.toString()) : 0
  }
}

/**
 * Convert specific BigInt fields to numbers for view tracking
 */
export function serializeViewTracking(viewTracking: any) {
  if (!viewTracking) return viewTracking
  
  return {
    ...viewTracking,
    views: viewTracking.views ? Number(viewTracking.views.toString()) : 0
  }
}

/**
 * Convert BigInt fields in an array of objects
 */
export function serializeArray<T>(array: T[], serializeFunction: (item: T) => T): T[] {
  if (!Array.isArray(array)) return array
  return array.map(serializeFunction)
}
