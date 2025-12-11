"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { FileText, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface CampaignReport {
  id: string
  title: string
  status: string
  featuredImage: string | null
  createdAt: string
}

interface ReportsData {
  partnerName: string
  campaigns: CampaignReport[]
}

export default function PartnerReportsPage() {
  const params = useParams()
  const token = params.token as string
  
  const [data, setData] = useState<ReportsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/partner/${token}/reports`)
        if (response.ok) {
          const result = await response.json()
          setData(result)
        } else {
          setError("Unable to load reports")
        }
      } catch (err) {
        setError("Connection error")
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchData()
    }
  }, [token])

  if (loading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[300px]">
        <div className="w-6 h-6 md:w-8 md:h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm md:text-base text-muted-foreground">{error || "Unable to load reports"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 md:mb-8"
      >
        <h1 className="text-xl md:text-2xl font-semibold mb-1">Reports</h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          Access detailed performance reports.
        </p>
      </motion.div>

      {/* Reports List */}
      {data.campaigns.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-10 md:py-12">
            <FileText className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm md:text-base text-muted-foreground">
              No reports available yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 md:space-y-3">
          {data.campaigns.map((campaign, index) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/client/${token}/report`}>
                <div className="flex items-center justify-between p-3 md:p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors group cursor-pointer">
                  <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                    {campaign.featuredImage ? (
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img 
                          src={campaign.featuredImage} 
                          alt={campaign.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm md:text-base truncate">{campaign.title}</h3>
                      <p className="text-[10px] md:text-xs text-muted-foreground">
                        Campaign Report
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 ml-2">
                    <span className="hidden sm:inline">View Report</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
