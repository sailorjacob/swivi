"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  DollarSign,
  TrendingUp,
  Eye,
  Users,
  Download
} from "lucide-react"

export default function AnalyticsPage() {
  // Mock analytics data
  const stats = [
    { label: "Total Earnings", value: "$2,547.50", change: "+15.2% this month", icon: DollarSign },
    { label: "Total Views", value: "847.2K", change: "+23.1% this month", icon: Eye },
    { label: "Successful Clips", value: "47", change: "+8 this month", icon: TrendingUp },
    { label: "Active Campaigns", value: "12", change: "3 pending review", icon: Users },
  ]

  const topCampaigns = [
    { name: "Olivia Dean Campaign", earnings: "$1,240", views: "324K", clips: 15 },
    { name: "SinParty Logo", earnings: "$680", views: "189K", clips: 8 },
    { name: "Giggles Meme", earnings: "$420", views: "156K", clips: 12 },
    { name: "Tech Review Series", earnings: "$207", views: "87K", clips: 5 },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-light text-foreground">Analytics</h1>
        <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted">
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                    <p className="text-sm mt-1 text-green-500">{stat.change}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <Icon className="w-6 h-6 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Top Performing Campaigns */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-white">Top Performing Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topCampaigns.map((campaign, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <h4 className="font-medium text-white">{campaign.name}</h4>
                  <p className="text-sm text-muted-foreground">{campaign.clips} clips submitted</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-500">{campaign.earnings}</div>
                  <div className="text-sm text-muted-foreground">{campaign.views} views</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Platform Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white">Platform Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { platform: "TikTok", earnings: "$1,847", percentage: "73%" },
                { platform: "Instagram", earnings: "$524", percentage: "21%" },
                { platform: "YouTube", earnings: "$176", percentage: "6%" },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-white">{item.platform}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">{item.earnings}</div>
                    <div className="text-xs text-muted-foreground">{item.percentage}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: "Payment received", amount: "$125.00", time: "2 hours ago" },
                { action: "Clip approved", campaign: "Olivia Dean", time: "5 hours ago" },
                { action: "New submission", campaign: "SinParty Logo", time: "1 day ago" },
                { action: "Payment received", amount: "$75.00", time: "2 days ago" },
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.amount || activity.campaign}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activity.time}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
