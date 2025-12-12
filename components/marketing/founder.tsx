"use client"

import { motion } from "framer-motion"
import { Instagram } from "lucide-react"
import Link from "next/link"

export function Founder() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="py-8 border-y border-black/5 bg-background relative"
    >
      <div className="max-width-wrapper section-padding">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
          <p className="text-sm text-muted-foreground">
            Founded by{" "}
            <Link 
              href="https://instagram.com/itskevingeorge" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-foreground hover:text-foreground/80 transition-colors"
            >
              @itskevingeorge
              <Instagram className="w-4 h-4 opacity-50" />
            </Link>
          </p>
        </div>
      </div>
    </motion.section>
  )
} 