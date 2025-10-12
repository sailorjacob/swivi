import { Header } from "@/components/layout/header"
// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, MessageCircle, HelpCircle, Clock, CheckCircle, AlertCircle } from "lucide-react"

export default function SupportPage() {
  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col pt-16">
        <div className="max-width-wrapper section-padding py-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-light mb-6">Support Center</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Get help with your Swivi experience. Our team is here to support you every step of the way.
              </p>
            </div>

            {/* Contact Methods */}
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <Card className="bg-neutral-900/40 border-neutral-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Support
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Send us an email and we'll get back to you within 24 hours.
                  </p>
                  <a
                    href="mailto:support@swivimedia.com"
                    className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                  >
                    support@swivimedia.com
                  </a>
                </CardContent>
              </Card>

              <Card className="bg-neutral-900/40 border-neutral-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Discord Community
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Join our Discord community for real-time help and discussions.
                  </p>
                  <a
                    href="https://discord.gg/swivi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                  >
                    Join Discord Community
                  </a>
                </CardContent>
              </Card>
            </div>

            {/* FAQ Section */}
            <section className="mb-16">
              <h2 className="text-3xl font-light mb-8 text-center">Frequently Asked Questions</h2>

              <div className="space-y-6">
                <Card className="bg-neutral-900/40 border-neutral-800/50">
                  <CardHeader>
                    <CardTitle className="text-lg">How do I join a campaign?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Browse available campaigns on your dashboard and click "Join Campaign" on any that interest you.
                      Make sure your profile is complete and you've connected your social media accounts.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-900/40 border-neutral-800/50">
                  <CardHeader>
                    <CardTitle className="text-lg">When do I get paid for approved clips?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Payments are processed within 24-48 hours after your clip is approved by the campaign manager.
                      You'll receive an email notification when payment is sent to your connected payment method.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-900/40 border-neutral-800/50">
                  <CardHeader>
                    <CardTitle className="text-lg">What are the content requirements?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Each campaign has specific requirements listed in the campaign details. Generally, clips should be
                      high-quality, follow the campaign theme, and meet the specified length and format requirements.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-900/40 border-neutral-800/50">
                  <CardHeader>
                    <CardTitle className="text-lg">How do I track my earnings?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Your earnings dashboard shows your total earnings, pending payments, and payment history.
                      Each campaign also displays your individual performance metrics.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-900/40 border-neutral-800/50">
                  <CardHeader>
                    <CardTitle className="text-lg">What if my clip gets rejected?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      If a clip is rejected, you'll receive feedback explaining why. You can then revise and resubmit
                      your content. Campaign managers provide constructive feedback to help improve your submissions.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Common Issues */}
            <section className="mb-16">
              <h2 className="text-3xl font-light mb-8 text-center">Common Issues & Solutions</h2>

              <div className="grid gap-6">
                <div className="flex gap-4 p-6 bg-neutral-900/40 border border-neutral-800/50 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-orange-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Login Issues</h3>
                    <p className="text-muted-foreground text-sm">
                      If you're having trouble logging in, try clearing your browser cache and cookies, or use a different browser.
                      Make sure you're using the correct Discord or Google account.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-6 bg-neutral-900/40 border border-neutral-800/50 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Payment Delays</h3>
                    <p className="text-muted-foreground text-sm">
                      Payments typically process within 24-48 hours after approval. If it's been longer, please contact support
                      with your campaign and submission details.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-6 bg-neutral-900/40 border border-neutral-800/50 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Content Approval</h3>
                    <p className="text-muted-foreground text-sm">
                      Campaign managers review submissions within 24 hours. Ensure your content follows all campaign guidelines
                      and requirements to increase approval chances.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Response Times */}
            <section className="text-center">
              <Card className="bg-neutral-900/40 border-neutral-800/50 max-w-md mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Response Times
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email Support:</span>
                      <Badge variant="secondary">24 hours</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discord:</span>
                      <Badge variant="secondary">Real-time</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Campaign Issues:</span>
                      <Badge variant="secondary">Priority</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
