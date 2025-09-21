"use client"

import { useState } from "react"
import {
  MessageSquare,
  Send,
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Mail,
  Clock
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ClippersFAQ } from "@/components/clippers/faq"
import toast from "react-hot-toast"

// Mock FAQ data (subset for clippers)
const faqCategories = [
  { id: "getting-started", label: "Getting Started", count: 6 },
  { id: "campaigns", label: "Campaigns & Submissions", count: 8 },
  { id: "earnings", label: "Earnings & Payments", count: 5 },
  { id: "account", label: "Account & Verification", count: 4 },
  { id: "technical", label: "Technical Issues", count: 3 }
]

const supportTopics = [
  "Account & Verification",
  "Campaign Issues",
  "Payment Problems",
  "Technical Support",
  "General Questions",
  "Bug Report",
  "Feature Request",
  "Other"
]

function SupportTicketForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    subject: "",
    topic: "",
    priority: "normal",
    description: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // TODO: Submit ticket to backend
    await new Promise(resolve => setTimeout(resolve, 1000))

    toast.success("Support ticket submitted successfully! We'll get back to you within 24 hours.")
    setFormData({ subject: "", topic: "", priority: "normal", description: "" })
    setIsSubmitting(false)
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="bg-card border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <MessageSquare className="w-5 h-5 mr-2 text-white" />
          Create Support Ticket
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          Can't find what you're looking for? Submit a ticket and our team will help you out.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subject" className="text-white">Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => handleChange("subject", e.target.value)}
                placeholder="Brief description of your issue"
                className="bg-muted border-border text-white"
                required
              />
            </div>

            <div>
              <Label htmlFor="topic" className="text-white">Topic</Label>
              <Select value={formData.topic} onValueChange={(value) => handleChange("topic", value)}>
                <SelectTrigger className="bg-muted border-border text-white">
                  <SelectValue placeholder="Select a topic" />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border">
                  {supportTopics.map((topic) => (
                    <SelectItem key={topic} value={topic} className="text-white">
                      {topic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="priority" className="text-white">Priority</Label>
            <Select value={formData.priority} onValueChange={(value) => handleChange("priority", value)}>
              <SelectTrigger className="bg-muted border-border text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                <SelectItem value="low" className="text-white">Low - General question</SelectItem>
                <SelectItem value="normal" className="text-white">Normal - Standard issue</SelectItem>
                <SelectItem value="high" className="text-white">High - Urgent issue</SelectItem>
                <SelectItem value="critical" className="text-white">Critical - Payment/account issue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description" className="text-white">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Please provide detailed information about your issue..."
              className="bg-muted border-border text-white"
              rows={6}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gray-700 hover:bg-gray-600"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Ticket
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function QuickStats() {
  const stats = [
    {
      label: "Avg. Response Time",
      value: "< 24h",
      description: "Most tickets resolved within one business day"
    },
    {
      label: "Active Tickets",
      value: "3",
      description: "Currently being worked on by our team"
    },
    {
      label: "Resolution Rate",
      value: "98%",
      description: "High satisfaction with our support"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-card border-gray-800">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-muted-foreground text-sm font-medium mb-1">{stat.label}</div>
            <div className="text-gray-500 text-xs">{stat.description}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ContactInfo() {
  return (
    <Card className="bg-card border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Contact Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-3">
          <Mail className="w-5 h-5 text-white" />
          <div>
            <p className="text-white font-medium">Email Support</p>
            <p className="text-muted-foreground text-sm">support@swivi.com</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Clock className="w-5 h-5 text-foreground" />
          <div>
            <p className="text-white font-medium">Response Time</p>
            <p className="text-muted-foreground text-sm">Within 24 hours for all inquiries</p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-800">
          <p className="text-muted-foreground text-sm">
            For urgent payment or account issues, please use the support ticket form above.
            We'll prioritize critical issues and get back to you as soon as possible.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SupportPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-white mb-2">Support & FAQ</h1>
        <p className="text-muted-foreground">Find answers to common questions or get help from our team.</p>
      </div>

      {/* Quick Stats - Hidden */}
      {/* <QuickStats /> */}

      {/* Main Content */}
      <Tabs defaultValue="faq" className="space-y-6">
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="faq" className="text-muted-foreground data-[state=active]:text-white">
            <HelpCircle className="w-4 h-4 mr-2" />
            FAQ
          </TabsTrigger>
          <TabsTrigger value="ticket" className="text-muted-foreground data-[state=active]:text-white">
            <MessageSquare className="w-4 h-4 mr-2" />
            Support Ticket
          </TabsTrigger>
          <TabsTrigger value="contact" className="text-muted-foreground data-[state=active]:text-white">
            <Mail className="w-4 h-4 mr-2" />
            Contact Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="faq">
          <ClippersFAQ />
        </TabsContent>

        <TabsContent value="ticket" className="space-y-6">
          <SupportTicketForm />
        </TabsContent>

        <TabsContent value="contact">
          <ContactInfo />
        </TabsContent>
      </Tabs>
    </div>
  )
}
