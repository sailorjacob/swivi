"use client"

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Loader2, Printer, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ReportData {
  generatedAt: string
  campaign: {
    id: string
    title: string
    description: string
    creator: string
    status: string
    targetPlatforms: string[]
    featuredImage: string | null
    startDate: string | null
    endDate: string | null
    completedAt: string | null
    completionReason: string | null
    budgetReachedAt: string | null
    createdAt: string
  }
  budget: {
    total: number
    spent: number
    remaining: number
    utilization: number
    payoutRate: number
  }
  performance: {
    totalViews: number
    totalViewsGained: number
    totalEarnings: number
    viewsAtBudgetReached: number
    averageViewsPerClip: number
  }
  submissions: {
    total: number
    approved: number
    pending: number
    rejected: number
  }
  creators: {
    unique: number
    breakdown: Array<{
      handle: string
      platform: string
      creatorName: string
      isVerified: boolean
      clipCount: number
      approvedCount: number
      totalViews: number
      totalEarnings: number
    }>
  }
  platforms: Record<string, {
    total: number
    approved: number
    pending: number
    rejected: number
    views: number
    earnings: number
  }>
  topClips: Array<{
    clipUrl: string
    platform: string
    handle: string
    views: number
    earnings: number
  }>
}

export default function ClientReportPage() {
  const params = useParams()
  const token = params.token as string
  
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/client/${token}/report`)
        if (!response.ok) {
          throw new Error("Failed to fetch report data")
        }
        const reportData = await response.json()
        setData(reportData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchData()
    }
  }, [token])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-2">Unable to load report</p>
          <p className="text-sm text-gray-400">{error || "Campaign not found"}</p>
        </div>
      </div>
    )
  }

  const { campaign, budget, performance, submissions, creators, platforms, topClips } = data

  return (
    <>
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page-break { page-break-before: always; }
        }
      `}</style>

      <div className="min-h-screen bg-white text-black">
        {/* Print Button */}
        <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
          <Button onClick={handlePrint} variant="outline" size="sm" className="bg-white">
            <Printer className="w-4 h-4 mr-2" />
            Print Report
          </Button>
        </div>

        {/* Report Content */}
        <div className="max-w-4xl mx-auto p-8">
          {/* Header */}
          <header className="border-b-2 border-black pb-6 mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{campaign.title}</h1>
                <p className="text-gray-600 mt-1">Campaign Performance Report</p>
              </div>
              <div className="text-right text-sm text-gray-500">
                <p>Generated: {new Date(data.generatedAt).toLocaleDateString()}</p>
                <p className="font-medium text-black mt-1">
                  Status: {campaign.status}
                </p>
              </div>
            </div>
          </header>

          {/* Executive Summary */}
          <section className="mb-10">
            <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4">Executive Summary</h2>
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center p-4 border border-gray-200 rounded">
                <p className="text-3xl font-bold">{performance.totalViews.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Views</p>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded">
                <p className="text-3xl font-bold">{submissions.approved}</p>
                <p className="text-sm text-gray-600">Approved Clips</p>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded">
                <p className="text-3xl font-bold">{creators.breakdown.length}</p>
                <p className="text-sm text-gray-600">Unique Pages</p>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded">
                <p className="text-3xl font-bold">{creators.unique}</p>
                <p className="text-sm text-gray-600">Unique Creators</p>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded">
                <p className="text-3xl font-bold">${budget.spent.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Spend</p>
              </div>
            </div>
          </section>

          {/* Budget & Timeline */}
          <section className="mb-10">
            <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4">Budget & Timeline</h2>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">Total Budget</td>
                      <td className="py-2 text-right font-medium">${budget.total.toLocaleString()}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">Amount Spent</td>
                      <td className="py-2 text-right font-medium">${budget.spent.toLocaleString()}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">Remaining</td>
                      <td className="py-2 text-right font-medium">${budget.remaining.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-gray-600">Utilization</td>
                      <td className="py-2 text-right font-medium">{budget.utilization.toFixed(1)}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">Campaign Started</td>
                      <td className="py-2 text-right font-medium">
                        {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : new Date(campaign.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                    {campaign.completedAt && (
                      <tr className="border-b">
                        <td className="py-2 text-gray-600">Campaign Completed</td>
                        <td className="py-2 text-right font-medium">{new Date(campaign.completedAt).toLocaleDateString()}</td>
                      </tr>
                    )}
                    {campaign.budgetReachedAt && (
                      <tr className="border-b">
                        <td className="py-2 text-gray-600">Budget Reached</td>
                        <td className="py-2 text-right font-medium">{new Date(campaign.budgetReachedAt).toLocaleDateString()}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="py-2 text-gray-600">Payout Rate</td>
                      <td className="py-2 text-right font-medium">${budget.payoutRate}/1K views</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Performance Metrics */}
          <section className="mb-10">
            <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4">Performance Metrics</h2>
            <div className="grid grid-cols-3 gap-6">
              <div className="p-4 border border-gray-200 rounded">
                <p className="text-2xl font-bold">{performance.totalViews.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Views</p>
                {performance.viewsAtBudgetReached > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    {performance.viewsAtBudgetReached.toLocaleString()} at budget reached
                  </p>
                )}
              </div>
              <div className="p-4 border border-gray-200 rounded">
                <p className="text-2xl font-bold">{performance.averageViewsPerClip.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Avg Views/Clip</p>
              </div>
              <div className="p-4 border border-gray-200 rounded">
                <p className="text-2xl font-bold">${(budget.total / performance.totalViews * 1000).toFixed(2)}</p>
                <p className="text-sm text-gray-600">Effective CPM</p>
              </div>
            </div>
          </section>

          {/* Submission Breakdown */}
          <section className="mb-10">
            <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4">Submission Breakdown</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 border border-gray-200 rounded">
                <p className="text-2xl font-bold">{submissions.total}</p>
                <p className="text-xs text-gray-600">Total</p>
              </div>
              <div className="text-center p-3 border border-gray-200 rounded">
                <p className="text-2xl font-bold">{submissions.approved}</p>
                <p className="text-xs text-gray-600">Approved</p>
              </div>
              <div className="text-center p-3 border border-gray-200 rounded">
                <p className="text-2xl font-bold">{submissions.pending}</p>
                <p className="text-xs text-gray-600">Pending</p>
              </div>
              <div className="text-center p-3 border border-gray-200 rounded">
                <p className="text-2xl font-bold">{submissions.rejected}</p>
                <p className="text-xs text-gray-600">Rejected</p>
              </div>
            </div>
          </section>

          {/* Platform Distribution */}
          <section className="mb-10">
            <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4">Platform Distribution</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-2 font-semibold">Platform</th>
                  <th className="text-center py-2 font-semibold">Submissions</th>
                  <th className="text-center py-2 font-semibold">Approved</th>
                  <th className="text-right py-2 font-semibold">Views</th>
                  <th className="text-right py-2 font-semibold">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(platforms).map(([platform, stats]) => (
                  <tr key={platform} className="border-b">
                    <td className="py-2 font-medium">{platform}</td>
                    <td className="py-2 text-center">{stats.total}</td>
                    <td className="py-2 text-center">{stats.approved}</td>
                    <td className="py-2 text-right">{stats.views.toLocaleString()}</td>
                    <td className="py-2 text-right">
                      {performance.totalViews > 0 
                        ? ((stats.views / performance.totalViews) * 100).toFixed(1) 
                        : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Top Performing Clips */}
          <section className="mb-10 page-break">
            <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4">Top Performing Clips</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-2 font-semibold">#</th>
                  <th className="text-left py-2 font-semibold">Creator</th>
                  <th className="text-left py-2 font-semibold">Platform</th>
                  <th className="text-right py-2 font-semibold">Views</th>
                </tr>
              </thead>
              <tbody>
                {topClips.map((clip, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2">{idx + 1}</td>
                    <td className="py-2 font-medium">@{clip.handle}</td>
                    <td className="py-2">{clip.platform}</td>
                    <td className="py-2 text-right">{clip.views.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Participating Pages - All unique social handles */}
          <section className="mb-10 page-break">
            <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4">
              Participating Pages ({creators.breakdown.length} unique pages from {creators.unique} creators)
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Each row represents a unique social media page/handle that posted content for this campaign.
              Some creators may have multiple pages across different platforms.
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-2 font-semibold">Page Handle</th>
                  <th className="text-left py-2 font-semibold">Platform</th>
                  <th className="text-center py-2 font-semibold">Posts</th>
                  <th className="text-right py-2 font-semibold">Views</th>
                  <th className="text-right py-2 font-semibold">% of Views</th>
                </tr>
              </thead>
              <tbody>
                {creators.breakdown.map((creator, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2">
                      <span className="font-medium">@{creator.handle}</span>
                      {creator.isVerified && (
                        <span className="text-xs bg-gray-200 px-1 rounded ml-1" title="Verified social account">✓</span>
                      )}
                      {creator.creatorName && creator.creatorName !== creator.handle && (
                        <span className="text-gray-400 ml-1 text-xs">({creator.creatorName})</span>
                      )}
                    </td>
                    <td className="py-2">{creator.platform}</td>
                    <td className="py-2 text-center">{creator.approvedCount}</td>
                    <td className="py-2 text-right">{creator.totalViews.toLocaleString()}</td>
                    <td className="py-2 text-right">
                      {performance.totalViews > 0 
                        ? ((creator.totalViews / performance.totalViews) * 100).toFixed(1) 
                        : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Footer */}
          <footer className="border-t-2 border-black pt-4 mt-8 text-center text-sm text-gray-500">
            <p>Campaign Report for {campaign.title}</p>
            <p className="mt-1">Generated by SWIVI • {new Date(data.generatedAt).toLocaleString()}</p>
          </footer>
        </div>
      </div>
    </>
  )
}

