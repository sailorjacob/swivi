"use client"

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'
import { CreatorsFAQ } from "../../../../components/creators/faq"
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
  ExternalLink,
  MessageSquare,
  Loader2,
  CheckCircle,
  Info,
  Send,
  ImageIcon
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import toast from "react-hot-toast"
import { authenticatedFetch } from "@/lib/supabase-browser"
import { SupportTicketDialog } from "@/components/creators/support-ticket-dialog"

// Guide Section Component
function GuideSection({ 
  title, 
  children, 
  defaultOpen = false 
}: { 
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  return (
    <Card className="overflow-hidden bg-card/50">
      <CardHeader 
        className="cursor-pointer hover:bg-muted/20 transition-colors py-4"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent className="pt-0 border-t border-border/30">
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
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground font-medium text-xs">
        {number}
      </div>
      <div className="flex-1 pb-5">
        <h4 className="font-medium text-foreground text-sm mb-1">{title}</h4>
        <div className="text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  )
}

// Note Box Component
function NoteBox({ type = 'info', children }: { type?: 'info' | 'warning' | 'success'; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 text-sm text-muted-foreground">
      <Info className="h-4 w-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
      <div>{children}</div>
    </div>
  )
}

interface SupportTicket {
  id: string
  category: string
  subject: string
  message: string
  imageUrl: string | null
  status: string
  adminResponse: string | null
  respondedAt: string | null
  userReply: string | null
  userReplyAt: string | null
  createdAt: string
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loadingTickets, setLoadingTickets] = useState(true)
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const handleSubmitReply = async (ticketId: string) => {
    if (!replyText.trim()) {
      toast.error('Please enter a reply')
      return
    }

    setSubmittingReply(true)
    try {
      const response = await authenticatedFetch(`/api/support-tickets/${ticketId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ reply: replyText.trim() })
      })

      if (response.ok) {
        toast.success('Reply sent!')
        setReplyText('')
        setReplyingTo(null)
        // Refresh tickets
        const ticketsResponse = await authenticatedFetch('/api/support-tickets')
        if (ticketsResponse.ok) {
          setTickets(await ticketsResponse.json())
        }
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to send reply')
      }
    } catch (error) {
      toast.error('Failed to send reply')
    } finally {
      setSubmittingReply(false)
    }
  }

  // Fetch user's tickets
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await authenticatedFetch('/api/support-tickets')
        if (response.ok) {
          const data = await response.json()
          setTickets(data)
        }
      } catch (error) {
        console.error('Error fetching tickets:', error)
      } finally {
        setLoadingTickets(false)
      }
    }
    fetchTickets()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="outline" className="text-xs">Open</Badge>
      case 'IN_PROGRESS':
        return <Badge variant="outline" className="text-xs">In Progress</Badge>
      case 'RESOLVED':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">Resolved</Badge>
      case 'CLOSED':
        return <Badge variant="outline" className="text-xs text-muted-foreground">Closed</Badge>
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-light text-foreground mb-2">Help & Support</h1>
          <p className="text-muted-foreground">Guides, troubleshooting, and answers to common questions.</p>
        </div>
        <SupportTicketDialog>
          <Button variant="outline" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Contact Support
          </Button>
        </SupportTicketDialog>
      </div>

      {/* My Tickets Section */}
      {(tickets.length > 0 || loadingTickets) && (
        <div>
          <h2 className="text-lg font-medium text-foreground mb-3">My Tickets</h2>
          
          {loadingTickets ? (
            <Card className="bg-card/50">
              <CardContent className="py-8 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {tickets.map((ticket) => (
                <Card 
                  key={ticket.id} 
                  className={`bg-card/50 cursor-pointer transition-colors hover:bg-card/70 ${
                    ticket.adminResponse ? 'border-l-2 border-l-primary' : ''
                  }`}
                  onClick={() => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-medium text-sm text-foreground">{ticket.subject}</span>
                          {getStatusBadge(ticket.status)}
                          {ticket.adminResponse && (
                            <Badge variant="outline" className="text-xs gap-1 bg-primary/10 text-primary border-primary/30">
                              <CheckCircle className="w-3 h-3" />
                              Replied
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {ticket.category} • {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${
                        expandedTicket === ticket.id ? 'rotate-180' : ''
                      }`} />
                    </div>
                    
                    {expandedTicket === ticket.id && (
                      <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
                        {/* Original Message */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Your Message</p>
                          <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.message}</p>
                        </div>

                        {/* Original Image */}
                        {ticket.imageUrl && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              Attachment
                            </p>
                            <img 
                              src={ticket.imageUrl} 
                              alt="Ticket attachment"
                              className="max-w-full h-auto max-h-48 rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation()
                                setImageModalUrl(ticket.imageUrl)
                              }}
                            />
                          </div>
                        )}
                        
                        {/* Admin Response */}
                        {ticket.adminResponse && (
                          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                            <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Support Response
                            </p>
                            <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.adminResponse}</p>
                            {ticket.respondedAt && (
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(ticket.respondedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
                          </div>
                        )}

                        {/* User Reply */}
                        {ticket.userReply && (
                          <div className="p-3 bg-muted/30 border border-border/50 rounded-lg">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Your Reply</p>
                            <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.userReply}</p>
                            {ticket.userReplyAt && (
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(ticket.userReplyAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Reply Form - show if admin has responded and ticket is not closed/resolved and no reply yet */}
                        {ticket.adminResponse && !ticket.userReply && 
                         ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' && (
                          <div className="pt-2">
                            {replyingTo === ticket.id ? (
                              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                                <Textarea
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Type your follow-up..."
                                  className="min-h-[80px] text-sm"
                                  maxLength={1000}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setReplyingTo(null)
                                      setReplyText('')
                                    }}
                                    disabled={submittingReply}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleSubmitReply(ticket.id)
                                    }}
                                    disabled={submittingReply || !replyText.trim()}
                                  >
                                    {submittingReply ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <>
                                        <Send className="w-3 h-3 mr-1" />
                                        Send
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setReplyingTo(ticket.id)
                                }}
                                className="text-xs"
                              >
                                <MessageSquare className="w-3 h-3 mr-1" />
                                Reply to Support
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <a href="#verification" className="p-4 rounded-lg bg-card/50 border border-border hover:bg-card/70 transition-colors text-center">
          <Shield className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
          <span className="text-sm">Verification</span>
        </a>
        <a href="#payouts" className="p-4 rounded-lg bg-card/50 border border-border hover:bg-card/70 transition-colors text-center">
          <DollarSign className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
          <span className="text-sm">Payouts</span>
        </a>
        <a href="#submissions" className="p-4 rounded-lg bg-card/50 border border-border hover:bg-card/70 transition-colors text-center">
          <Eye className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
          <span className="text-sm">Submissions</span>
        </a>
        <a href="#faq" className="p-4 rounded-lg bg-card/50 border border-border hover:bg-card/70 transition-colors text-center">
          <HelpCircle className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
          <span className="text-sm">FAQ</span>
        </a>
      </div>

      {/* Social Verification Guide */}
      <div id="verification">
        <h2 className="text-lg font-medium text-foreground mb-3">Social Account Verification</h2>
        
        <div className="space-y-3">
          <GuideSection title="How to Verify Your Social Accounts" defaultOpen={true}>
            <div className="space-y-5 pt-4">
              <p className="text-sm text-muted-foreground">
                Verifying your social accounts proves you own them and allows us to track your posts.
              </p>
              
              <div className="space-y-0">
                <Step number={1} title="Enter Your Username">
                  Go to your Profile and click on the platform you want to verify. Enter your username without the @ symbol.
                </Step>
                
                <Step number={2} title="Generate Verification Code">
                  Click "Generate Code" to receive a unique 6-character code. This code is valid for 24 hours.
                </Step>
                
                <Step number={3} title="Add Code to Your Profile">
                  <div className="space-y-2">
                    <p>Add the verification code to your profile bio:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs ml-2">
                      <li><strong>YouTube:</strong> Channel description</li>
                      <li><strong>TikTok:</strong> Profile bio</li>
                      <li><strong>Instagram:</strong> Profile bio</li>
                    </ul>
                  </div>
                </Step>
                
                <Step number={4} title="Click Verify">
                  After saving your profile with the code, click "Verify Account". Verification typically takes 30-60 seconds.
                </Step>
              </div>

              <NoteBox type="success">
                <strong>Tip:</strong> You can remove the code from your bio after verification.
              </NoteBox>
            </div>
          </GuideSection>

          <GuideSection title="Verification Troubleshooting">
            <div className="space-y-4 pt-4">
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                  <h4 className="font-medium text-sm text-foreground mb-1">"Code not found" but I added it</h4>
                  <p className="text-xs text-muted-foreground">
                    Platform caching is the most common cause. Wait 2-3 minutes after updating your profile before clicking verify.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                  <h4 className="font-medium text-sm text-foreground mb-1">Old code showing / wrong code detected</h4>
                  <p className="text-xs text-muted-foreground">
                    Update your bio with the current code shown in the verification dialog, wait 2-3 minutes, then try again.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                  <h4 className="font-medium text-sm text-foreground mb-1">Profile appears private / not found</h4>
                  <p className="text-xs text-muted-foreground">
                    Make sure your profile is public, username is correct (no typos, no @ symbol), and the account exists.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                  <h4 className="font-medium text-sm text-foreground mb-1">Verification timed out</h4>
                  <p className="text-xs text-muted-foreground">
                    The platform may be slow. Try again in a few minutes or generate a new code.
                  </p>
                </div>
              </div>

              <NoteBox type="info">
                Still having issues? Contact support with your username and platform.
              </NoteBox>
            </div>
          </GuideSection>
        </div>
      </div>

      {/* Payouts Guide */}
      <div id="payouts">
        <h2 className="text-lg font-medium text-foreground mb-3">How Payouts Work</h2>
        
        <div className="space-y-3">
          <GuideSection title="Understanding Your Earnings" defaultOpen={true}>
            <div className="space-y-5 pt-4">
              <p className="text-sm text-muted-foreground">
                Here's how you earn money on Swivi:
              </p>

              <div className="grid md:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                  <h4 className="font-medium text-sm text-foreground mb-1">CPM-Based Earnings</h4>
                  <p className="text-xs text-muted-foreground">
                    Most campaigns pay per 1,000 views. Check campaign details for rates.
                  </p>
                </div>
                
                <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                  <h4 className="font-medium text-sm text-foreground mb-1">View Threshold</h4>
                  <p className="text-xs text-muted-foreground">
                    Most campaigns require 10,000 total views to qualify for payout.
                  </p>
                </div>
                
                <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                  <h4 className="font-medium text-sm text-foreground mb-1">Engagement Requirement</h4>
                  <p className="text-xs text-muted-foreground">
                    Posts need at least 0.5% engagement rate to qualify.
                  </p>
                </div>
                
                <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                  <h4 className="font-medium text-sm text-foreground mb-1">Max 30% Per Creator</h4>
                  <p className="text-xs text-muted-foreground">
                    Each creator can earn up to 30% of total campaign budget.
                  </p>
                </div>
              </div>

              <NoteBox type="info">
                Submit posts as soon as you post them to maximize view accumulation time.
              </NoteBox>
            </div>
          </GuideSection>

          <GuideSection title="Payment Process & Timeline">
            <div className="space-y-5 pt-4">
              <div className="space-y-0">
                <Step number={1} title="Campaign Active">
                  Submit posts and watch your views grow. Stats update every 2 hours.
                </Step>
                
                <Step number={2} title="Campaign Ends">
                  Campaigns end when budget is spent. Final stats update captures all views.
                </Step>
                
                <Step number={3} title="Review Period">
                  We review posts and finalize earnings. Takes 1-3 days after campaign ends.
                </Step>
                
                <Step number={4} title="Payment Sent">
                  Payments sent via PayPal within one week. You'll receive an email notification.
                </Step>
              </div>

              <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                <h4 className="font-medium text-sm text-foreground mb-2">Payment Methods</h4>
                <p className="text-xs text-muted-foreground">
                  All payments are sent via PayPal. Update your PayPal email in Account Settings if needed.
                </p>
              </div>

              <NoteBox>
                <strong>No minimum payout!</strong> If you qualify, you'll get paid regardless of the amount.
              </NoteBox>
            </div>
          </GuideSection>

          <GuideSection title="Common Payout Questions">
            <div className="space-y-3 pt-4">
              <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                <h4 className="font-medium text-sm text-foreground mb-1">Why didn't I get paid?</h4>
                <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                  <li>Didn't reach 10,000 total views</li>
                  <li>Less than 0.5% engagement rate</li>
                  <li>Posts submitted after campaign ended</li>
                  <li>Posts didn't meet campaign requirements</li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                <h4 className="font-medium text-sm text-foreground mb-1">Do views carry over?</h4>
                <p className="text-xs text-muted-foreground">
                  No, views only count for the campaign they were submitted to.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                <h4 className="font-medium text-sm text-foreground mb-1">How is payout calculated?</h4>
                <p className="text-xs text-muted-foreground font-mono">
                  (Qualifying Views ÷ 1000) × Campaign CPM
                </p>
              </div>

              <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                <h4 className="font-medium text-sm text-foreground mb-1">View manipulation?</h4>
                <p className="text-xs text-muted-foreground">
                  We detect artificial views. View botting results in a permanent ban.
                </p>
              </div>
            </div>
          </GuideSection>
        </div>
      </div>

      {/* Post Submissions Guide */}
      <div id="submissions">
        <h2 className="text-lg font-medium text-foreground mb-3">Submitting Posts</h2>
        
        <div className="space-y-3">
          <GuideSection title="How to Submit Your Posts">
            <div className="space-y-5 pt-4">
              <div className="space-y-0">
                <Step number={1} title="Create Your Post">
                  Create and post your content on TikTok, YouTube Shorts, or Instagram Reels.
                </Step>
                
                <Step number={2} title="Go to Campaigns">
                  Navigate to the active campaign you want to submit to.
                </Step>
                
                <Step number={3} title="Submit Your Post">
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li><strong>Scan Account:</strong> Automatically fetches recent posts</li>
                    <li><strong>Submit Links:</strong> Manually paste the URL</li>
                  </ul>
                </Step>
                
                <Step number={4} title="Wait for Approval">
                  We review submissions to ensure they meet guidelines. You'll be notified once approved.
                </Step>
              </div>

              <NoteBox>
                Campaigns can end quickly when budgets run out. Submit early.
              </NoteBox>
            </div>
          </GuideSection>

          <GuideSection title="Post Requirements">
            <div className="space-y-3 pt-4">
              <div className="grid md:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                  <h4 className="font-medium text-sm text-foreground mb-1">Required</h4>
                  <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                    <li>Minimum 7 seconds long</li>
                    <li>Public video</li>
                    <li>Engagement stats visible</li>
                    <li>Follows campaign guidelines</li>
                  </ul>
                </div>
                
                <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                  <h4 className="font-medium text-sm text-foreground mb-1">Not Allowed</h4>
                  <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                    <li>NSFW content</li>
                    <li>Illegal content</li>
                    <li>Negative portrayal of client</li>
                    <li>Heavily edited after approval</li>
                  </ul>
                </div>
              </div>

              <NoteBox type="warning">
                Keep posts public. Private or deleted videos won't receive payment.
              </NoteBox>
            </div>
          </GuideSection>
        </div>
      </div>

      {/* FAQ Section */}
      <div id="faq">
        <h2 className="text-lg font-medium text-foreground mb-3">Frequently Asked Questions</h2>
        <CreatorsFAQ />
      </div>

      {/* Contact Support */}
      <Card className="bg-card/50">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-medium text-foreground mb-1">Still need help?</h3>
              <p className="text-sm text-muted-foreground">
                Our support team typically responds within 24 hours.
              </p>
            </div>
            <SupportTicketDialog>
              <Button variant="outline" className="w-full md:w-auto gap-2">
                <MessageSquare className="w-4 h-4" />
                Contact Support
              </Button>
            </SupportTicketDialog>
          </div>
        </CardContent>
      </Card>

      {/* Image Modal */}
      <Dialog open={!!imageModalUrl} onOpenChange={() => setImageModalUrl(null)}>
        <DialogContent className="sm:max-w-4xl bg-card border-border p-2">
          {imageModalUrl && (
            <img 
              src={imageModalUrl} 
              alt="Full size attachment"
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
