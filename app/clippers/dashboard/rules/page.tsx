"use client"

import { motion } from "framer-motion"
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Users,
  DollarSign,
  Eye
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const rulesSections = [
  {
    id: "general",
    title: "General Guidelines",
    icon: Shield,
    rules: [
      {
        title: "Be Respectful",
        description: "Treat all community members with respect. Harassment, discrimination, or inappropriate behavior will result in immediate removal.",
        severity: "high"
      },
      {
        title: "No Fake Engagement",
        description: "Do not use bots, fake accounts, or any artificial means to inflate engagement rates. This includes buying likes, comments, or views.",
        severity: "critical"
      },
      {
        title: "Quality Content Only",
        description: "All clips must be high-quality, engaging, and follow the campaign guidelines. Low-quality or spam content will be rejected.",
        severity: "high"
      },
      {
        title: "Platform Compliance",
        description: "Ensure all content complies with the platform's terms of service (TikTok, YouTube, Instagram, Twitter).",
        severity: "high"
      }
    ]
  },
  {
    id: "content",
    title: "Content Requirements",
    icon: FileText,
    rules: [
      {
        title: "Minimum Duration",
        description: "All clips must be at least 7 seconds long. Shorter clips will be automatically rejected.",
        severity: "medium"
      },
      {
        title: "Engagement Rate",
        description: "Clips must maintain a minimum 0.5% engagement rate (likes + comments + shares ÷ views × 100).",
        severity: "high"
      },
      {
        title: "Public Statistics",
        description: "Keep all engagement statistics (likes, comments, views) public during the campaign period.",
        severity: "medium"
      },
      {
        title: "Original Content",
        description: "Content must be original and not previously posted. Reposts may be allowed with campaign approval.",
        severity: "medium"
      }
    ]
  },
  {
    id: "earnings",
    title: "Earnings & Payments",
    icon: DollarSign,
    rules: [
      {
        title: "Fair Distribution",
        description: "No clipper can earn more than 30% of the total campaign budget to ensure fair distribution.",
        severity: "high"
      },
      {
        title: "Performance Based",
        description: "Earnings are based on actual performance metrics. Inflated or manipulated stats will result in payment denial.",
        severity: "critical"
      },
      {
        title: "Payment Timeline",
        description: "Payments are processed within 1 week of campaign completion. Delays may occur for verification purposes.",
        severity: "low"
      },
      {
        title: "Minimum Payout",
        description: "Minimum payout threshold is $50. Earnings below this amount will roll over to the next payout cycle.",
        severity: "low"
      }
    ]
  },
  {
    id: "account",
    title: "Account & Verification",
    icon: Users,
    rules: [
      {
        title: "Account Ownership",
        description: "You must own and have full control of all social media accounts used for clipping.",
        severity: "critical"
      },
      {
        title: "Verification Required",
        description: "All accounts must be verified through our demographic verification process before earning.",
        severity: "high"
      },
      {
        title: "Multiple Accounts",
        description: "You may connect multiple accounts, but each must meet verification requirements independently.",
        severity: "medium"
      },
      {
        title: "Account Age",
        description: "Accounts should be established and have consistent posting history. Brand new accounts may require additional verification.",
        severity: "medium"
      }
    ]
  },
  {
    id: "technical",
    title: "Technical Requirements",
    icon: Eye,
    rules: [
      {
        title: "Format Compliance",
        description: "Clips must be in the correct format for each platform (TikTok, YouTube Shorts, Instagram Reels, etc.).",
        severity: "medium"
      },
      {
        title: "Metadata Accuracy",
        description: "All clip submissions must include accurate metadata and follow the submission guidelines.",
        severity: "medium"
      },
      {
        title: "Tracking Enablement",
        description: "Ensure your accounts allow proper tracking of engagement metrics for payout calculations.",
        severity: "high"
      },
      {
        title: "Platform Updates",
        description: "Stay updated with platform algorithm changes and adjust your content strategy accordingly.",
        severity: "low"
      }
    ]
  }
]

const consequences = [
  {
    violation: "Minor violations (first offense)",
    consequence: "Warning and content rejection",
    icon: AlertTriangle,
    color: "text-yellow-400"
  },
  {
    violation: "Repeated violations",
    consequence: "Temporary suspension (3-7 days)",
    icon: XCircle,
    color: "text-orange-400"
  },
  {
    violation: "Serious violations (fake engagement, account fraud)",
    consequence: "Permanent ban and payment forfeiture",
    icon: XCircle,
    color: "text-red-400"
  }
]

function RuleCard({ rule }: { rule: typeof rulesSections[0]['rules'][0] }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 border-red-400/20 bg-red-400/10'
      case 'high': return 'text-orange-400 border-orange-400/20 bg-orange-400/10'
      case 'medium': return 'text-yellow-400 border-yellow-400/20 bg-yellow-400/10'
      case 'low': return 'text-foreground border-green-400/20 bg-green-400/10'
      default: return 'text-muted-foreground border-gray-400/20 bg-muted/20'
    }
  }

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical': return 'Critical'
      case 'high': return 'High'
      case 'medium': return 'Medium'
      case 'low': return 'Low'
      default: return 'Unknown'
    }
  }

  return (
    <Card className="bg-card border-gray-800">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h4 className="text-white font-medium">{rule.title}</h4>
          <Badge variant="outline" className={getSeverityColor(rule.severity)}>
            {getSeverityLabel(rule.severity)}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">{rule.description}</p>
      </CardContent>
    </Card>
  )
}

function ConsequencesSection() {
  return (
    <Card className="bg-card border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
          Violations & Consequences
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {consequences.map((item, index) => {
            const Icon = item.icon
            return (
              <div key={index} className="flex items-start space-x-4 p-4 border border-border rounded-lg">
                <Icon className={`w-6 h-6 mt-0.5 ${item.color}`} />
                <div className="flex-1">
                  <h4 className="text-white font-medium mb-1">{item.violation}</h4>
                  <p className="text-muted-foreground text-sm">{item.consequence}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function FTCCompliance() {
  return (
    <Card className="bg-card border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Shield className="w-5 h-5 mr-2 text-white" />
          FTC Compliance & Disclosures
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted/50 border border-border/50 rounded-lg">
          <h4 className="text-white font-medium mb-2">Federal Trade Commission Guidelines</h4>
          <ul className="text-muted-foreground text-sm space-y-1">
            <li>• Clearly disclose sponsored content and brand partnerships</li>
            <li>• Use appropriate hashtags (#ad, #sponsored, #partner) when required</li>
            <li>• Maintain transparency about affiliate relationships</li>
            <li>• Follow platform-specific disclosure requirements</li>
          </ul>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="disclosure" className="border-border">
            <AccordionTrigger className="text-white hover:text-muted-foreground">
              Disclosure Requirements by Platform
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <div className="space-y-3">
                <div>
                  <strong className="text-white">TikTok:</strong> Use #ad or #sponsored in caption for paid partnerships
                </div>
                <div>
                  <strong className="text-white">Instagram:</strong> Use "Paid partnership with [brand]" or relevant emoji
                </div>
                <div>
                  <strong className="text-white">YouTube:</strong> Include disclosure in video and description
                </div>
                <div>
                  <strong className="text-white">Twitter:</strong> Use appropriate disclosure language in tweet
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="compliance" className="border-border">
            <AccordionTrigger className="text-white hover:text-muted-foreground">
              Why Compliance Matters
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              FTC compliance ensures transparency and builds trust with your audience. Non-compliant content may result in:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Content rejection</li>
                <li>Account penalties from platforms</li>
                <li>Legal consequences</li>
                <li>Loss of audience trust</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}

export default function RulesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-white mb-2">Rules & Guidelines</h1>
        <p className="text-muted-foreground">
          Important rules and policies for all Swivi Clippers. Please read carefully and follow all guidelines.
        </p>
      </div>

      {/* Overview */}
      <Card className="bg-card border-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="w-6 h-6 text-foreground" />
            <h2 className="text-xl font-medium text-white">Welcome to Swivi Clippers</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            These rules ensure fair play, quality content, and a positive community for all clippers.
            By participating in campaigns, you agree to follow all guidelines. Our team monitors compliance
            and takes violations seriously to maintain the integrity of our platform.
          </p>
        </CardContent>
      </Card>

      {/* Rules Sections */}
      <div className="space-y-8">
        {rulesSections.map((section) => {
          const Icon = section.icon
          return (
            <div key={section.id} className="space-y-4">
              <div className="flex items-center space-x-3">
                <Icon className="w-6 h-6 text-white" />
                <h2 className="text-2xl font-light text-white">{section.title}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.rules.map((rule, index) => (
                  <RuleCard key={index} rule={rule} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Consequences */}
      <ConsequencesSection />

      {/* FTC Compliance */}
      <FTCCompliance />

      {/* Contact */}
      <Card className="bg-card border-gray-800">
        <CardContent className="p-6 text-center">
          <h3 className="text-white font-medium mb-2">Questions about these rules?</h3>
          <p className="text-muted-foreground mb-4">
            If you have questions about any of these guidelines, please contact our support team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/clippers/support"
              className="inline-flex items-center px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Contact Support
            </a>
            <a
              href="/clippers/faq"
              className="inline-flex items-center px-6 py-3 border border-border text-muted-foreground hover:bg-muted rounded-lg transition-colors"
            >
              View FAQ
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
