"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"

const paymentMethods = ["USDC", "Bitcoin", "PayPal"]

// Smooth continuous scrolling spinner - always goes down in order
export function CryptoSpinnerInline() {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % paymentMethods.length)
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  return (
    <span className="inline-block relative h-[1em] overflow-hidden align-middle" style={{ width: '5.5ch' }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={currentIndex}
          initial={{ y: "100%" }}
          animate={{ y: "0%" }}
          exit={{ y: "-100%" }}
          transition={{
            duration: 0.35,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          className="absolute left-0 top-0 h-[1em] leading-[1em] text-foreground"
        >
          {paymentMethods[currentIndex]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

