"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

const paymentMethods = ["USDC", "Bitcoin", "PayPal", "USDC", "Bitcoin", "PayPal"]

// Smooth continuous scrolling spinner
export function CryptoSpinnerInline() {
  const [offset, setOffset] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((prev) => prev + 1)
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  const currentIndex = offset % 3

  return (
    <span className="inline-block relative h-[1em] overflow-hidden align-middle" style={{ width: '5.5ch' }}>
      <motion.span
        className="absolute left-0 top-0 flex flex-col"
        animate={{ y: `${-currentIndex * 1}em` }}
        transition={{
          duration: 0.4,
          ease: [0.25, 0.1, 0.25, 1],
        }}
      >
        {["USDC", "Bitcoin", "PayPal", "USDC"].map((method, idx) => (
          <span 
            key={idx} 
            className="h-[1em] leading-[1em] text-foreground"
          >
            {method}
          </span>
        ))}
      </motion.span>
    </span>
  )
}

