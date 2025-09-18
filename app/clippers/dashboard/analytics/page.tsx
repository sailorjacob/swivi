"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  TrendingUp,
  DollarSign,
  Eye,
  Play,
  Target,
  Calendar,
  Download,
  Filter,
  BarChart3
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

// Mock data
const earningsData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
  datasets: [
    {
      label: 'Earnings',
      data: [120, 190, 300, 500, 200, 300, 450, 600, 750],
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      tension: 0.4,
    },
  ],
}

const viewsData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
  datasets: [
    {
      label: 'Total Views',
      data: [12000, 19000, 30000, 50000, 20000, 30000, 45000, 60000, 75000],
      backgroundColor: '#3b82f6',
    },
  ],
}

const platformData = {
  labels: ['TikTok', 'YouTube', 'Instagram', 'Twitter'],
  datasets: [
    {
      data: [45, 25, 20, 10],
      backgroundColor: [
        '#ff0050',
        '#ff0000',
        '#e4405f',
        '#1da1f2',
      ],
      borderWidth: 0,
    },
  ],
}

const topCampaigns = [
  {
    name: "Summer Vibes Collection",
    earnings: 450,
    views: 25000,
    clips: 12,
    conversion: 85
  },
  {
    name: "Tech Reviews 2024",
    earnings: 380,
    views: 18000,
    clips: 8,
    conversion: 78
  },
  {
    name: "Fitness Motivation",
    earnings: 290,
    views: 15000,
    clips: 6,
    conversion: 92
  },
  {
    name: "Comedy Skits",
    earnings: 220,
    views: 12000,
    clips: 5,
    conversion: 65
  }
]

const recentActivity = [
  {
    type: "clip_approved",
    title: "Summer Dance Edit approved",
    amount: 75,
    views: 8500,
    date: "2 hours ago"
  },
  {
    type: "clip_submitted",
    title: "Tech Review Clip submitted",
    amount: 0,
    views: 0,
    date: "5 hours ago"
  },
  {
    type: "payment_received",
    title: "Payment received",
    amount: 320,
    views: 0,
    date: "1 day ago"
  },
  {
    type: "campaign_joined",
    title: "Joined Fitness Motivation campaign",
    amount: 0,
    views: 0,
    date: "2 days ago"
  }
]

function StatCard({ title, value, change, changeType, icon: Icon, color }: {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: any
  color: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">{title}</p>
              <p className="text-2xl font-bold text-white mt-1">{value}</p>
              <p className={`text-sm mt-1 ${
                changeType === 'positive' ? 'text-foreground' :
                changeType === 'negative' ? 'text-red-400' :
                'text-muted-foreground'
              }`}>
                {change}
              </p>
            </div>
            <div className={`p-3 rounded-full bg-muted ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function ActivityItem({ activity }: { activity: typeof recentActivity[0] }) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'clip_approved': return '✓'
      case 'clip_submitted': return '→'
      case 'payment_received': return '$'
      case 'campaign_joined': return '+'
      default: return '•'
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'clip_approved': return 'text-foreground'
      case 'payment_received': return 'text-foreground'
      case 'clip_submitted': return 'text-white'
      case 'campaign_joined': return 'text-purple-400'
      default: return 'text-muted-foreground'
    }
  }

  return (
    <div className="flex items-center space-x-4 py-3 border-b border-border last:border-b-0">
      <div className={`text-lg ${getActivityColor(activity.type)}`}>
        {getActivityIcon(activity.type)}
      </div>
      <div className="flex-1">
        <p className="text-white font-medium">{activity.title}</p>
        <p className="text-muted-foreground text-sm">{activity.date}</p>
      </div>
      {activity.amount > 0 && (
        <div className="text-right">
          <p className="text-foreground font-medium">${activity.amount}</p>
          {activity.views > 0 && (
            <p className="text-muted-foreground text-sm">{activity.views.toLocaleString()} views</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d")

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'hsl(var(--foreground))',
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: 'hsl(var(--muted-foreground))',
        },
        grid: {
          color: 'hsl(var(--border))',
        },
      },
      y: {
        ticks: {
          color: 'hsl(var(--muted-foreground))',
        },
        grid: {
          color: 'hsl(var(--border))',
        },
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'hsl(var(--foreground))',
          padding: 20,
        },
      },
    },
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-white mb-2">Analytics</h1>
          <p className="text-muted-foreground">Track your performance and earnings over time.</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 bg-muted border-border text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-muted border-border">
              <SelectItem value="7d" className="text-white">7 days</SelectItem>
              <SelectItem value="30d" className="text-white">30 days</SelectItem>
              <SelectItem value="90d" className="text-white">90 days</SelectItem>
              <SelectItem value="1y" className="text-white">1 year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Earnings"
          value="$2,847"
          change="+12.5% from last month"
          changeType="positive"
          icon={DollarSign}
          color="text-foreground"
        />
        <StatCard
          title="Total Views"
          value="245.3K"
          change="+8.2% from last month"
          changeType="positive"
          icon={Eye}
          color="text-white"
        />
        <StatCard
          title="Clips Created"
          value="127"
          change="+23 this month"
          changeType="positive"
          icon={Play}
          color="text-purple-400"
        />
        <StatCard
          title="Avg. Conversion"
          value="78%"
          change="-2% from last month"
          changeType="negative"
          icon={Target}
          color="text-orange-400"
        />
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="earnings" className="space-y-6">
        <TabsList className="bg-background border-b border-border rounded-none h-auto p-0">
          <TabsTrigger value="earnings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent bg-transparent text-muted-foreground data-[state=active]:text-foreground px-4 py-3 font-medium transition-all ">
            Earnings
          </TabsTrigger>
          <TabsTrigger value="views" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent bg-transparent text-muted-foreground data-[state=active]:text-foreground px-4 py-3 font-medium transition-all ">
            Views
          </TabsTrigger>
          <TabsTrigger value="platforms" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent bg-transparent text-muted-foreground data-[state=active]:text-foreground px-4 py-3 font-medium transition-all ">
            Platforms
          </TabsTrigger>
        </TabsList>

        <TabsContent value="earnings" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-white">Earnings Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <Line data={earningsData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="views" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-white">Views Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <Bar data={viewsData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-white">Earnings by Platform</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Doughnut data={platformData} options={doughnutOptions} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-white">Platform Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { platform: 'TikTok', earnings: 1247, views: 125000, color: '#ff0050' },
                    { platform: 'YouTube', earnings: 823, views: 78000, color: '#ff0000' },
                    { platform: 'Instagram', earnings: 542, views: 32000, color: '#e4405f' },
                    { platform: 'Twitter', earnings: 235, views: 10300, color: '#1da1f2' },
                  ].map((platform) => (
                    <div key={platform.platform} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: platform.color }}
                        ></div>
                        <span className="text-white">{platform.platform}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">${platform.earnings}</p>
                        <p className="text-muted-foreground text-sm">{platform.views.toLocaleString()} views</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Campaigns */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white">Top Performing Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCampaigns.map((campaign, index) => (
                <div key={campaign.name} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-white font-medium">{campaign.name}</p>
                      <p className="text-muted-foreground text-sm">{campaign.clips} clips</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-foreground font-medium">${campaign.earnings}</p>
                    <p className="text-muted-foreground text-sm">{campaign.views.toLocaleString()} views</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {recentActivity.map((activity, index) => (
                <ActivityItem key={index} activity={activity} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
