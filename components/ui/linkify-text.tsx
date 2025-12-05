"use client"

import React from "react"

interface LinkifyTextProps {
  text: string
  className?: string
}

/**
 * Renders text with URLs converted to clickable links
 */
export function LinkifyText({ text, className = "" }: LinkifyTextProps) {
  // URL regex pattern that matches most common URLs
  const urlPattern = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g
  
  const parts = text.split(urlPattern)
  
  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (urlPattern.test(part)) {
          // Reset the regex lastIndex for the test
          urlPattern.lastIndex = 0
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-2 hover:text-foreground/80 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          )
        }
        return <span key={index}>{part}</span>
      })}
    </span>
  )
}

/**
 * Renders text with URLs converted to clickable links, preserving line breaks
 */
export function LinkifyParagraph({ text, className = "" }: LinkifyTextProps) {
  // Split by newlines first
  const lines = text.split('\n')
  
  return (
    <div className={className}>
      {lines.map((line, lineIndex) => (
        <React.Fragment key={lineIndex}>
          <LinkifyText text={line} />
          {lineIndex < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </div>
  )
}

