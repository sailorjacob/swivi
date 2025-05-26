"use client"

import Link from "next/link"
import { useState } from "react"

// Placeholder chart data
const chartData = [
  { label: "Clips Created", value: 120 },
  { label: "Top Earner ($)", value: 340 },
  { label: "Avg. Payout ($)", value: 45 },
  { label: "Community Size", value: 87 },
]

export default function ClippersOnboardingPage() {
  const [showMore, setShowMore] = useState(false)

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex flex-col items-center justify-center py-16 px-4">
      <div className="max-w-3xl w-full bg-white/90 rounded-2xl shadow-xl p-10 flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 text-purple-700">Swivi Clippers</h1>
        <p className="text-lg md:text-xl text-center text-muted-foreground mb-8">
          Get paid to clip creator content. Join our exclusive community, access analytics, and start earning today!
        </p>
        <Link
          href="http://whop.com/swiviclippers"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-gradient-to-r from-purple-600 to-blue-500 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg hover:scale-105 transition-transform mb-8"
        >
          Join Swivi Clippers
        </Link>
        <section className="w-full grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {chartData.map((stat) => (
            <div key={stat.label} className="bg-purple-50 rounded-xl p-6 flex flex-col items-center shadow-sm">
              <span className="text-3xl font-bold text-purple-700">{stat.value}</span>
              <span className="text-sm text-muted-foreground mt-2 text-center">{stat.label}</span>
            </div>
          ))}
        </section>
        <div className="w-full text-left mb-6">
          <h2 className="text-2xl font-semibold mb-2 text-purple-700">How It Works</h2>
          <ol className="list-decimal list-inside space-y-2 text-base text-muted-foreground">
            <li>Apply and join our Clippers community via the button above.</li>
            <li>Get access to exclusive content from top creators.</li>
            <li>Clip, edit, and submit your best moments.</li>
            <li>Earn payouts for every approved viral clip.</li>
            <li>Track your stats and climb the leaderboard!</li>
          </ol>
        </div>
        <button
          className="text-purple-600 underline text-sm mb-2"
          onClick={() => setShowMore((v) => !v)}
        >
          {showMore ? "Hide Details" : "Learn More About Swivi Clippers"}
        </button>
        {showMore && (
          <div className="bg-purple-100 rounded-lg p-6 text-sm text-purple-900 w-full mb-4">
            <p className="mb-2 font-semibold">Why Join?</p>
            <ul className="list-disc list-inside mb-2">
              <li>Be part of a fast-growing creator economy movement.</li>
              <li>Get paid for your editing and creative skills.</li>
              <li>Access analytics to improve your performance and earnings.</li>
              <li>Connect with other top clippers and creators.</li>
            </ul>
            <p className="mb-0">Ready to start? Click the join button above and become a Swivi Clipper today!</p>
          </div>
        )}
      </div>
    </main>
  )
} 