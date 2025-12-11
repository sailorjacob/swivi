"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  DollarSign,
  Users
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getPlatformLogo } from "@/components/ui/icons/platform-logos"

interface CampaignReport {
  id: string
  title: string
  status: string
  budget: number
  spent: number
  targetPlatforms: string[]
  featuredImage: string | null
  startDate: string | null
  completedAt: string | null
  createdAt: string
  stats: {
    totalViews: number
    approvedSubmissions: number
    totalSubmissions: number
    uniqueCreators: number
  }
  hasFullReport: boolean
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge className="bg-foreground text-background">
            <span className="w-1.5 h-1.5 bg-background rounded-full mr-1.5 animate-pulse" />
            Live
          </Badge>
        )
      case 'COMPLETED':
        return (
          <Badge variant="secondary">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        )
      case 'PAUSED':
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            Paused
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{error || "Unable to load reports"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Campaign Reports</h1>
        <p className="text-muted-foreground">
          Access detailed performance reports for your campaigns.
        </p>
      </motion.div>

      {/* Reports List */}
      {data.campaigns.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Reports Available</h3>
            <p className="text-muted-foreground">
              Reports will be available once your campaigns have activity.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {data.campaigns.map((campaign, index) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Card className="overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Campaign Image */}
                    {campaign.featuredImage && (
                      <div className="w-full lg:w-48 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img 
                          src={campaign.featuredImage} 
                          alt={campaign.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Campaign Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="font-semibold text-xl">{campaign.title}</h3>
                            {getStatusBadge(campaign.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Started {new Date(campaign.startDate || campaign.createdAt).toLocaleDateString()}
                            </span>
                            {campaign.completedAt && (
                              <span className="flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                Completed {new Date(campaign.completedAt).toLocaleDateString()}
                              </span>
                            )}
                            <div className="flex gap-1">
                              {campaign.targetPlatforms.map(p => (
                                <div key={p} className="w-4 h-4">
                                  {getPlatformLogo(p, '', 16)}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <Eye className="w-4 h-4 text-foreground" />
                          </div>
                          <div>
                            <p className="font-semibold">{campaign.stats.totalViews.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Views</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-foreground" />
                          </div>
                          <div>
                            <p className="font-semibold">{campaign.stats.approvedSubmissions}</p>
                            <p className="text-xs text-muted-foreground">Approved</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <Users className="w-4 h-4 text-foreground" />
                          </div>
                          <div>
                            <p className="font-semibold">{campaign.stats.uniqueCreators}</p>
                            <p className="text-xs text-muted-foreground">Creators</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-foreground" />
                          </div>
                          <div>
                            <p className="font-semibold">${campaign.spent.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Spent</p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 flex-wrap">
                        <Link href={`/client/${token}/report`}>
                          <Button>
                            <FileText className="w-4 h-4 mr-2" />
                            View Full Report
                          </Button>
                        </Link>
                        <Link href={`/client/${token}`}>
                          <Button variant="outline">
                            <Eye className="w-4 h-4 mr-2" />
                            Live Dashboard
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

    </div>
  )
}
