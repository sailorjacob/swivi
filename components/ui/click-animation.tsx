"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"

interface ClickAnimationProps {
  color?: string
  size?: number
  duration?: number
}

export function ClickAnimation({
  color = "black",
  size = 100,
  duration = 0.5,
}: ClickAnimationProps) {
  const [clicks, setClicks] = useState<Array<{ id: number; x: number; y: number }>>([])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const newClick = {
        id: Date.now(),
        x: e.clientX,
        y: e.clientY,
      }
      setClicks((prev) => [...prev, newClick])

      // Remove the click animation after it's done
      setTimeout(() => {
        setClicks((prev) => prev.filter((click) => click.id !== newClick.id))
      }, duration * 1000)
    }

    window.addEventListener("click", handleClick)
    return () => window.removeEventListener("click", handleClick)
  }, [duration])

  return (
    <AnimatePresence>
      {clicks.map((click) => (
        <motion.div
          key={click.id}
          className="pointer-events-none fixed z-50"
          initial={{ opacity: 0.5, scale: 0 }}
          animate={{ opacity: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration }}
          style={{
            left: click.x - size / 2,
            top: click.y - size / 2,
            width: size,
            height: size,
            borderRadius: "50%",
            border: `2px solid ${color}`,
            position: "fixed",
          }}
        />
      ))}
    </AnimatePresence>
  )
} 