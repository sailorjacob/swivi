"use client"

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { SwiviLogo } from "@/components/ui/icons/swivi-logo"

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated floating circles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/5"
            style={{
              width: `${300 + i * 100}px`,
              height: `${300 + i * 100}px`,
            }}
            initial={{
              x: `${(i * 25) % 100}%`,
              y: `${(i * 30) % 100}%`,
              scale: 0.5 + (i * 0.1),
            }}
            animate={{
              x: [
                `${(i * 25) % 100}%`,
                `${(i * 25 + 30) % 100}%`,
                `${(i * 25) % 100}%`,
              ],
              y: [
                `${(i * 30) % 100}%`,
                `${(i * 30 + 20) % 100}%`,
                `${(i * 30) % 100}%`,
              ],
            }}
            transition={{
              duration: 15 + i * 5,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Back link */}
      <div className="absolute top-6 left-6 z-10">
        <Link
          href="/clippers/become-a-clipper"
          className="inline-flex items-center text-sm text-neutral-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Sign Up
        </Link>
      </div>

      {/* Content */}
      <div className="min-h-screen flex items-center justify-center p-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl"
        >
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-8 md:p-12">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="flex justify-center mb-6">
                <SwiviLogo size={48} />
              </div>
              <h1 className="text-2xl font-light text-white mb-2">
                Rules & Guidelines
              </h1>
              <p className="text-neutral-400 text-sm">
                Please read before joining
              </p>
            </div>

            {/* Rules */}
            <div className="space-y-6 text-sm">
              <div>
                <h2 className="text-white font-medium mb-2">Content Standards</h2>
                <ul className="text-neutral-400 space-y-1.5">
                  <li>• Submit original, high-quality clips only</li>
                  <li>• Keep all engagement stats public during campaigns</li>
                  <li>• Follow each platform's terms of service</li>
                </ul>
              </div>

              <div>
                <h2 className="text-white font-medium mb-2">Fair Play</h2>
                <ul className="text-neutral-400 space-y-1.5">
                  <li>• No fake engagement, bots, or purchased views</li>
                  <li>• Own all accounts you connect</li>
                  <li>• One clipper account per person</li>
                </ul>
              </div>

              <div>
                <h2 className="text-white font-medium mb-2">Payments</h2>
                <ul className="text-neutral-400 space-y-1.5">
                  <li>• Earnings based on verified performance</li>
                  <li>• $50 minimum payout threshold</li>
                  <li>• Payments processed weekly</li>
                </ul>
              </div>

              <div>
                <h2 className="text-white font-medium mb-2">Disclosures</h2>
                <ul className="text-neutral-400 space-y-1.5">
                  <li>• Use #ad or #sponsored when required by campaign</li>
                  <li>• Follow FTC guidelines for sponsored content</li>
                </ul>
              </div>

              <div className="pt-4 border-t border-neutral-700">
                <p className="text-neutral-500 text-xs">
                  Violations may result in warnings, suspension, or permanent removal from the platform.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-10 text-center">
              <Link
                href="/clippers/become-a-clipper"
                className="inline-flex items-center text-sm font-medium text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 px-6 py-3 rounded-full transition-colors"
              >
                Continue to Sign Up
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

