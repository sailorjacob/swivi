"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Star,
  ArrowRight,
  Mail,
  Lock,
  CheckCircle,
  Play,
  Target
} from "lucide-react"
import { motion } from "framer-motion"

export default function ClippersLanding() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate signup
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Redirect to signup/login
    window.location.href = "/clippers/auth"
    
    setIsLoading(false)
  }

  const stats = [
    { label: "Active Campaigns", value: "50+", icon: Target },
    { label: "Total Pool", value: "$2.5M", icon: DollarSign },
    { label: "Active Clippers", value: "10K+", icon: Users },
    { label: "Average CPM", value: "$2.50", icon: TrendingUp },
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      username: "@sarahc_creates",
      earnings: "$1,240",
      quote: "Made my first $1K in just 2 weeks! The campaigns are perfect for my content style.",
      platform: "TikTok"
    },
    {
      name: "Mike Rodriguez", 
      username: "@mikethemaker",
      earnings: "$2,890",
      quote: "Super easy to join campaigns and the payouts are instant. Love this platform!",
      platform: "Instagram"
    },
    {
      name: "Emma Wilson",
      username: "@emmawcreates", 
      earnings: "$950",
      quote: "Finally a platform that actually pays well for viral content. Highly recommend!",
      platform: "YouTube"
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="mb-4 bg-green-500/10 text-green-500 border-green-500/20">
              🔥 Now Open to New Clippers
            </Badge>
            
            <h1 className="text-5xl md:text-6xl font-light text-foreground mb-6">
              Turn Your Viral Content Into
              <span className="block text-green-500 font-medium">Real Money</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join exclusive campaigns from top brands and creators. Submit your viral clips and earn up to $2,000+ per video.
            </p>

            {/* Email Signup */}
            <form onSubmit={handleEmailSignup} className="max-w-md mx-auto mb-8">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? "Loading..." : "Get Access"}
                </Button>
              </div>
            </form>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Lock className="w-4 h-4" />
              <span>Gated platform - Email required to view campaigns</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <Card key={index} className="bg-card border-border text-center">
                    <CardContent className="p-6">
                      <Icon className="w-8 h-8 text-green-500 mx-auto mb-3" />
                      <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground">
              Simple, fast, and profitable
            </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Join Platform",
                description: "Sign up with email and get access to exclusive campaigns",
                icon: Mail
              },
              {
                step: "2", 
                title: "Browse Campaigns",
                description: "View active campaigns with clear requirements and payouts",
                icon: Target
              },
              {
                step: "3",
                title: "Submit & Earn",
                description: "Submit your viral content and get paid within 24-48 hours",
                icon: DollarSign
              }
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 + index * 0.2 }}
                >
                  <Card className="bg-card border-border h-full text-center">
                    <CardContent className="p-8">
                      <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Icon className="w-8 h-8 text-green-500" />
                      </div>
                      <div className="text-lg font-medium text-foreground mb-3">
                        {item.step}. {item.title}
                      </div>
                      <p className="text-muted-foreground">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-foreground mb-4">
              Success Stories
            </h2>
            <p className="text-xl text-muted-foreground">
              Real clippers, real earnings
            </p>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.0 + index * 0.2 }}
              >
                <Card className="bg-card border-border h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                        <Star className="w-6 h-6 text-green-500" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.username}</div>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground mb-4 italic">
                      "{testimonial.quote}"
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                        {testimonial.platform}
                      </Badge>
                      <div className="text-lg font-bold text-green-500">
                        {testimonial.earnings}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
          >
            <h2 className="text-3xl md:text-4xl font-light text-foreground mb-6">
              Ready to Start Earning?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of creators already making money from their viral content
            </p>
            
            <Button 
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-lg px-8 py-6"
              onClick={() => window.location.href = "/clippers/auth"}
            >
              Get Started Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
