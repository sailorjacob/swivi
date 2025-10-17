/**
 * Utility functions for handling BigInt serialization in API responses
 */

/**
 * Recursively converts BigInt values to strings for JSON serialization
 * This is necessary because JSON.stringify() cannot handle BigInt values
 */
export const convertBigIntToString = (obj: any): any => {
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'bigint') return obj.toString()
  if (Array.isArray(obj)) return obj.map(convertBigIntToString)
  if (typeof obj === 'object') {
    const converted: any = {}
    for (const key in obj) {
      converted[key] = convertBigIntToString(obj[key])
    }
    return converted
  }
  return obj
}

/**
 * Converts BigInt values to numbers for frontend consumption
 * Use this when you need actual numbers instead of strings
 */
export const convertBigIntToNumber = (obj: any): any => {
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'bigint') return Number(obj)
  if (Array.isArray(obj)) return obj.map(convertBigIntToNumber)
  if (typeof obj === 'object') {
    const converted: any = {}
    for (const key in obj) {
      converted[key] = convertBigIntToNumber(obj[key])
    }
    return converted
  }
  return obj
}

/**
 * Safely converts a BigInt to a number, with overflow protection
 */
export const safeBigIntToNumber = (value: bigint | null | undefined): number => {
  if (value === null || value === undefined) return 0
  
  // Check for safe integer range
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    console.warn(`BigInt value ${value} exceeds MAX_SAFE_INTEGER, returning MAX_SAFE_INTEGER`)
    return Number.MAX_SAFE_INTEGER
  }
  
  if (value < BigInt(Number.MIN_SAFE_INTEGER)) {
    console.warn(`BigInt value ${value} is below MIN_SAFE_INTEGER, returning MIN_SAFE_INTEGER`)
    return Number.MIN_SAFE_INTEGER
  }
  
  return Number(value)
}