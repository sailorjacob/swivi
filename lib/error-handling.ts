/**
 * Enhanced error handling utilities for browser automation and API calls
 */

export interface RetryOptions {
  maxAttempts?: number
  baseDelay?: number
  maxDelay?: number
  retryOn?: (error: any) => boolean
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    retryOn = (error) => {
      // Retry on network errors, timeouts, and 5xx status codes
      if (error instanceof Error) {
        return error.message.includes('timeout') ||
               error.message.includes('network') ||
               error.message.includes('504') ||
               error.message.includes('502') ||
               error.message.includes('503')
      }
      return false
    }
  } = options

  let lastError: any
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (attempt === maxAttempts || !retryOn(error)) {
        throw error
      }
      
      // Exponential backoff with jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000,
        maxDelay
      )
      
      console.log(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms delay`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

export function isBrowserExtensionError(error: any): boolean {
  if (typeof error === 'string') {
    return error.includes('listener indicated an asynchronous response') ||
           error.includes('message channel closed') ||
           error.includes('Extension context invalidated')
  }
  
  if (error instanceof Error) {
    return error.message.includes('listener indicated an asynchronous response') ||
           error.message.includes('message channel closed') ||
           error.message.includes('Extension context invalidated')
  }
  
  return false
}

export function isNetworkTimeoutError(error: any): boolean {
  if (typeof error === 'string') {
    return error.includes('504') || 
           error.includes('timeout') ||
           error.includes('ETIMEDOUT') ||
           error.includes('network')
  }
  
  if (error instanceof Error) {
    return error.message.includes('504') || 
           error.message.includes('timeout') ||
           error.message.includes('ETIMEDOUT') ||
           error.message.includes('network') ||
           error.name === 'TimeoutError'
  }
  
  return false
}

export function getUserFriendlyErrorMessage(error: any): string {
  if (isBrowserExtensionError(error)) {
    return "Browser extension interference detected. This doesn't affect the app functionality."
  }
  
  if (isNetworkTimeoutError(error)) {
    return "Network timeout occurred. Please try again in a moment."
  }
  
  if (typeof error === 'string') {
    if (error.includes('not found in bio')) {
      return "Verification code not found in profile bio. Please check that you've added the code correctly."
    }
    if (error.includes('private')) {
      return "Profile appears to be private. Please make your profile public for verification."
    }
    if (error.includes('not found') || error.includes('not exist')) {
      return "Profile not found. Please check the username is correct."
    }
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return "An unexpected error occurred. Please try again."
}
