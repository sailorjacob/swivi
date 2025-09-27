"use client"

import { AlertCircle, RefreshCw, X } from "lucide-react"
import { Button } from "./button"
import { Alert, AlertDescription } from "./alert"

interface ErrorMessageProps {
  title?: string
  message: string
  type?: 'error' | 'warning' | 'info'
  onRetry?: () => void
  onDismiss?: () => void
  retryLabel?: string
  className?: string
}

export function ErrorMessage({
  title = "Error",
  message,
  type = 'error',
  onRetry,
  onDismiss,
  retryLabel = "Try Again",
  className = ""
}: ErrorMessageProps) {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <AlertCircle className="h-4 w-4 text-blue-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getAlertVariant = () => {
    switch (type) {
      case 'warning':
        return 'default'
      case 'info':
        return 'default'
      default:
        return 'destructive'
    }
  }

  return (
    <Alert variant={getAlertVariant()} className={`${className}`}>
      <div className="flex items-start space-x-2">
        {getIcon()}
        <div className="flex-1 space-y-2">
          <div>
            <h4 className="font-medium">{title}</h4>
            <AlertDescription className="text-sm">
              {message}
            </AlertDescription>
          </div>
          
          {(onRetry || onDismiss) && (
            <div className="flex items-center space-x-2">
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="h-8"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  {retryLabel}
                </Button>
              )}
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="h-8"
                >
                  <X className="h-3 w-3 mr-1" />
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Alert>
  )
}

// Specific error messages for common issues
export function BrowserExtensionError({ onDismiss }: { onDismiss?: () => void }) {
  return (
    <ErrorMessage
      type="warning"
      title="Browser Extension Interference"
      message="A browser extension is interfering with the page. This doesn't affect app functionality, but you may see console errors. Consider disabling extensions if you experience issues."
      onDismiss={onDismiss}
    />
  )
}

export function NetworkTimeoutError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorMessage
      title="Network Timeout"
      message="The request timed out. This may be due to social media sites blocking automated access or network issues. Please try again in a moment."
      onRetry={onRetry}
      retryLabel="Retry Verification"
    />
  )
}

export function VerificationError({ 
  message, 
  onRetry 
}: { 
  message: string
  onRetry?: () => void 
}) {
  return (
    <ErrorMessage
      title="Verification Failed"
      message={message}
      onRetry={onRetry}
      retryLabel="Try Again"
    />
  )
}
