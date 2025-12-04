"use client"

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'
import { ClippersFAQ } from "../../../../components/clippers/faq"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  Shield, 
  RefreshCw,
  Smartphone,
  Eye,
  Banknote,
  Calendar,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import toast from "react-hot-toast"

// Guide Section Component
function GuideSection({ 
  title, 
  icon: Icon, 
  children, 
  defaultOpen = false 
}: { 
  title: string
  icon: React.ElementType
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  return (
    <Card className="overflow-hidden">
      <CardHeader 
        className="cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg font-medium">{title}</CardTitle>
          </div>
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent className="pt-0 border-t border-border/50">
          {children}
        </CardContent>
      )}
    </Card>
  )
}

// Step Component
function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
        {number}
      </div>
      <div className="flex-1 pb-6">
        <h4 className="font-medium text-foreground mb-2">{title}</h4>
        <div className="text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  )
}

// Tip Box Component
function TipBox({ type, children }: { type: 'info' | 'warning' | 'success'; children: React.ReactNode }) {
  const styles = {
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-200',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-200',
    success: 'bg-green-500/10 border-green-500/30 text-green-200'
  }
  const icons = {
    info: HelpCircle,
    warning: AlertCircle,
    success: CheckCircle2
  }
  const Icon = icons[type]
  
  return (
    <div className={`flex gap-3 p-4 rounded-lg border ${styles[type]}`}>
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="text-sm">{children}</div>
    </div>
  )
}

export default function SupportPage() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-foreground mb-2">Help & Support</h1>
        <p className="text-muted-foreground">Guides, troubleshooting, and answers to common questions.</p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <a href="#verification" className="p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors text-center">
          <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
          <span className="text-sm font-medium">Verification</span>
        </a>
        <a href="#payouts" className="p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors text-center">
          <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-500" />
          <span className="text-sm font-medium">Payouts</span>
        </a>
        <a href="#submissions" className="p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors text-center">
          <Eye className="h-6 w-6 mx-auto mb-2 text-blue-500" />
          <span className="text-sm font-medium">Submissions</span>
        </a>
        <a href="#faq" className="p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors text-center">
          <HelpCircle className="h-6 w-6 mx-auto mb-2 text-amber-500" />
          <span className="text-sm font-medium">FAQ</span>
        </a>
      </div>

      {/* Social Verification Guide */}
      <div id="verification">
        <h2 className="text-xl font-medium text-foreground mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Social Account Verification
        </h2>
        
        <div className="space-y-4">
          <GuideSection title="How to Verify Your Social Accounts" icon={CheckCircle2} defaultOpen={true}>
            <div className="space-y-6 pt-4">
              <p className="text-muted-foreground">
                Verifying your social accounts proves you own them and allows us to track your clips. Here's how it works:
              </p>
              
              <div className="space-y-0">
                <Step number={1} title="Enter Your Username">
                  Go to your Account Settings and click on the platform you want to verify (YouTube, TikTok, Instagram, or X/Twitter). 
                  Enter your username without the @ symbol.
                </Step>
                
                <Step number={2} title="Generate Verification Code">
                  Click "Generate Code" to receive a unique 6-character code (e.g., <code className="px-2 py-0.5 bg-muted rounded text-primary font-mono">ABC123</code>).
                  This code is valid for 24 hours.
                </Step>
                
                <Step number={3} title="Add Code to Your Profile">
                  <div className="space-y-3">
                    <p>Add the verification code to your profile bio/description:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>YouTube:</strong> Channel description (Customize channel → Basic info)</li>
                      <li><strong>TikTok:</strong> Profile bio (Edit profile → Bio)</li>
                      <li><strong>Instagram:</strong> Profile bio (Edit profile → Bio)</li>
                      <li><strong>X/Twitter:</strong> Profile bio (Edit profile → Bio)</li>
                    </ul>
                  </div>
                </Step>
                
                <Step number={4} title="Click Verify">
                  After saving your profile with the code, click "Verify Account". 
                  Verification typically takes 30-60 seconds as we check your profile.
                </Step>
              </div>

              <TipBox type="success">
                <strong>After verification:</strong> You can remove the code from your bio! It's only needed during the verification process.
              </TipBox>
            </div>
          </GuideSection>

          <GuideSection title="Verification Troubleshooting" icon={AlertCircle}>
            <div className="space-y-6 pt-4">
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    "Code not found" but I added it
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p><strong>Most common cause:</strong> Platform caching. YouTube, TikTok, and other platforms cache profile data.</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>Wait 2-3 minutes</strong> after updating your profile before clicking verify</li>
                      <li>Make sure you clicked "Save" or "Publish" on the platform</li>
                      <li>Double-check the code matches exactly (uppercase, no spaces)</li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-blue-500" />
                    Old code showing / wrong code detected
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>If you see a message like "Your bio contains ABC123 but we're looking for XYZ789":</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>You likely generated a new code but have an old one in your bio</li>
                      <li>Update your bio with the <strong>current code</strong> shown in the verification dialog</li>
                      <li>Wait 2-3 minutes for the platform to update</li>
                      <li>Try verifying again</li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-purple-500" />
                    Profile appears private / not found
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>Make sure your profile is:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>Public</strong> - Private accounts cannot be verified</li>
                      <li><strong>Username is correct</strong> - No typos, no @ symbol</li>
                      <li><strong>Account exists</strong> - Try opening your profile in an incognito window</li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-red-500" />
                    Verification timed out
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>If verification takes too long and times out:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>The platform may be slow to respond - try again in a few minutes</li>
                      <li>Make sure your internet connection is stable</li>
                      <li>Try using "Generate New Code" and start fresh</li>
                    </ul>
                  </div>
                </div>
              </div>

              <TipBox type="warning">
                <strong>Still having issues?</strong> Contact support with your username and platform, and we'll help you verify manually!
              </TipBox>
            </div>
          </GuideSection>
        </div>
      </div>

      {/* Payouts Guide */}
      <div id="payouts">
        <h2 className="text-xl font-medium text-foreground mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-500" />
          How Payouts Work
        </h2>
        
        <div className="space-y-4">
          <GuideSection title="Understanding Your Earnings" icon={Banknote} defaultOpen={true}>
            <div className="space-y-6 pt-4">
              <p className="text-muted-foreground">
                Here's everything you need to know about how you earn money on Swivi:
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                  <h4 className="font-medium text-green-400 mb-2">CPM-Based Earnings</h4>
                  <p className="text-sm text-muted-foreground">
                    Most campaigns pay per 1,000 views (CPM). The rate varies by campaign - check the campaign details for exact payout rates.
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                  <h4 className="font-medium text-blue-400 mb-2">Minimum View Threshold</h4>
                  <p className="text-sm text-muted-foreground">
                    Most campaigns require 10,000 total views across all your clips to qualify for payout. Views from all clips add up!
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                  <h4 className="font-medium text-purple-400 mb-2">Engagement Requirement</h4>
                  <p className="text-sm text-muted-foreground">
                    Clips need at least 0.5% engagement rate to qualify. Formula: (Likes + Comments + Shares) ÷ Views × 100
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20">
                  <h4 className="font-medium text-amber-400 mb-2">Max 30% Per Clipper</h4>
                  <p className="text-sm text-muted-foreground">
                    Each clipper can earn up to 30% of the total campaign budget. This ensures fair distribution among all participants.
                  </p>
                </div>
              </div>

              <TipBox type="info">
                <strong>Pro tip:</strong> Submit your clips as soon as you post them! The sooner you submit, the more time your views have to accumulate before the campaign ends.
              </TipBox>
            </div>
          </GuideSection>

          <GuideSection title="Payment Process & Timeline" icon={Calendar}>
            <div className="space-y-6 pt-4">
              <div className="space-y-0">
                <Step number={1} title="Campaign Active">
                  While the campaign is running, submit clips and watch your views grow. Stats update every 2 hours.
                </Step>
                
                <Step number={2} title="Campaign Ends">
                  Campaigns end when the budget is fully spent. We run a final stats update to capture all views.
                </Step>
                
                <Step number={3} title="Review Period">
                  We review all clips and finalize earnings. This typically takes 1-3 days after the campaign ends.
                </Step>
                
                <Step number={4} title="Payment Sent">
                  Payments are sent via PayPal within one week after the campaign ends (often sooner). 
                  You'll receive an email notification when payment is sent.
                </Step>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                <h4 className="font-medium text-foreground mb-3">Payment Methods</h4>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-[#003087]/20 border border-[#003087]/30">
                    <span className="text-[#00457C] font-bold text-lg">PayPal</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>All payments are sent via PayPal.</p>
                    <p className="text-xs mt-1">Update your PayPal email in Account Settings if needed.</p>
                  </div>
                </div>
              </div>

              <TipBox type="success">
                <strong>No minimum payout!</strong> If you qualify for earnings (10K+ views, 0.5%+ engagement), you'll get paid regardless of the amount.
              </TipBox>
            </div>
          </GuideSection>

          <GuideSection title="Common Payout Questions" icon={HelpCircle}>
            <div className="space-y-4 pt-4">
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                <h4 className="font-medium text-foreground mb-2">Why didn't I get paid?</h4>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>You didn't reach 10,000 total views</li>
                  <li>Your clips had less than 0.5% engagement rate</li>
                  <li>Clips were submitted after the campaign ended</li>
                  <li>Clips didn't meet campaign requirements (wrong content, length, etc.)</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                <h4 className="font-medium text-foreground mb-2">Do views carry over to the next campaign?</h4>
                <p className="text-sm text-muted-foreground">
                  No, views only count for the campaign they were submitted to. Each campaign is separate.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                <h4 className="font-medium text-foreground mb-2">How is my payout calculated?</h4>
                <p className="text-sm text-muted-foreground">
                  <code className="px-2 py-0.5 bg-muted rounded">Payout = (Qualifying Views ÷ 1000) × Campaign CPM Rate</code>
                  <br /><br />
                  Example: 50,000 views at $8 CPM = $400 payout
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                <h4 className="font-medium text-foreground mb-2">What if I suspect view manipulation?</h4>
                <p className="text-sm text-muted-foreground">
                  We have systems to detect artificial views. If we detect view botting or manipulation, it results in a permanent ban. 
                  Only genuine, organic views count toward earnings.
                </p>
              </div>
            </div>
          </GuideSection>
        </div>
      </div>

      {/* Clip Submissions Guide */}
      <div id="submissions">
        <h2 className="text-xl font-medium text-foreground mb-4 flex items-center gap-2">
          <Eye className="h-5 w-5 text-blue-500" />
          Submitting Clips
        </h2>
        
        <div className="space-y-4">
          <GuideSection title="How to Submit Your Clips" icon={CheckCircle2}>
            <div className="space-y-6 pt-4">
              <div className="space-y-0">
                <Step number={1} title="Post Your Clip">
                  Create and post your clip on the social platform (TikTok, YouTube Shorts, Instagram Reels, or X).
                </Step>
                
                <Step number={2} title="Go to Campaign Dashboard">
                  Navigate to the active campaign you want to submit to.
                </Step>
                
                <Step number={3} title="Submit Your Clip">
                  You have two options:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li><strong>Scan Account:</strong> Automatically fetches your recent clips</li>
                    <li><strong>Submit Links:</strong> Manually paste the URL to your clip</li>
                  </ul>
                </Step>
                
                <Step number={4} title="Wait for Approval">
                  Our team reviews submissions to ensure they meet campaign guidelines. You'll be notified once approved.
                </Step>
              </div>

              <TipBox type="info">
                <strong>Submit early!</strong> Campaigns can end quickly when budgets run out. The sooner you submit, the more time your clips have to accumulate views.
              </TipBox>
            </div>
          </GuideSection>

          <GuideSection title="Clip Requirements" icon={AlertCircle}>
            <div className="space-y-4 pt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <h4 className="font-medium text-foreground mb-2">✅ Required</h4>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>Minimum 7 seconds long</li>
                    <li>Public video (not private)</li>
                    <li>Engagement stats visible</li>
                    <li>Follows campaign guidelines</li>
                  </ul>
                </div>
                
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <h4 className="font-medium text-foreground mb-2">❌ Not Allowed</h4>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>NSFW content</li>
                    <li>Illegal content</li>
                    <li>Content that portrays client negatively</li>
                    <li>Heavily edited after approval</li>
                  </ul>
                </div>
              </div>

              <TipBox type="warning">
                <strong>Keep your clips public!</strong> If your video is private or gets deleted during a campaign, you won't receive payment for those views.
              </TipBox>
            </div>
          </GuideSection>
        </div>
      </div>

      {/* FAQ Section */}
      <div id="faq">
        <h2 className="text-xl font-medium text-foreground mb-4 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-amber-500" />
          Frequently Asked Questions
        </h2>
        <ClippersFAQ />
      </div>

      {/* Contact Support */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-medium text-foreground mb-1">Still need help?</h3>
              <p className="text-sm text-muted-foreground">
                Our support team typically responds within 24 hours.
              </p>
            </div>
            <a href="mailto:support@swivimedia.com">
              <Button className="w-full md:w-auto">
                Contact Support
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
