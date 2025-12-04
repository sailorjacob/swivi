"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

interface ThemeToggleProps {
  size?: "default" | "sm"
}

export function ThemeToggle({ size = "default" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const sizeClasses = size === "sm" 
    ? "h-7 w-7" 
    : "h-10 w-10"
  
  const iconClasses = size === "sm"
    ? "h-3.5 w-3.5"
    : "h-[1.2rem] w-[1.2rem]"

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className={`${sizeClasses} text-muted-foreground`}>
        <Sun className={iconClasses} />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={`${sizeClasses} text-muted-foreground hover:text-foreground hover:bg-transparent transition-all duration-300`}
    >
      {theme === "light" ? (
        <Moon className={`${iconClasses} transition-all`} />
      ) : (
        <Sun className={`${iconClasses} transition-all`} />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
