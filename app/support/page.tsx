import { Header } from "@/components/layout/header"
// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, MessageCircle, HelpCircle, Clock, CheckCircle, AlertCircle } from "lucide-react"

export default function SupportPage() {
  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col pt-16">
        <div className="max-width-wrapper section-padding py-20">
          <div className="max-w-4xl mx-auto">

            {/* Contact Methods */}
            <div className="mb-16">
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
            </div>

            {/* Clippers FAQ Section */}
            <section className="mb-16">
              <h2 className="text-3xl font-light mb-8">For Creators</h2>
              <p className="text-muted-foreground mb-8">
                Everything you need to know about participating in campaigns and earning money as a content creator.
              </p>

              <div className="space-y-4">
                <Card className="bg-neutral-900/40 border-neutral-800/50">
                  <CardHeader>
                    <CardTitle className="text-lg">How do I join Swivi Creators?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Apply through our platform. Get instant access to creator content and our creator dashboard. There's no minimum follower count needed - we welcome all creators, whether you're brand new or experienced.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-900/40 border-neutral-800/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Is there a minimum follower requirement to join campaigns?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      No, there's no minimum follower count needed. We want to give all creators—whether you're brand new or experienced, the chance to earn money.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-900/40 border-neutral-800/50">
                  <CardHeader>
                    <CardTitle className="text-lg">What platforms can I clip on?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Currently, we support clips posted on TikTok, YouTube Shorts, and Instagram Reels. We might add more platforms later, depending on campaign needs.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-900/40 border-neutral-800/50">
                  <CardHeader>
                    <CardTitle className="text-lg">How do I know if a campaign is still active?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      If you see the campaign listed under the "Active Campaigns" category, it's active, and you can participate.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-900/40 border-neutral-800/50">
                  <CardHeader>
                    <CardTitle className="text-lg">How much can I get paid?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Each campaign has different payouts. To see exactly how much you can get paid for a specific campaign, check the payouts in the campaign details.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-900/40 border-neutral-800/50">
                  <CardHeader>
                    <CardTitle className="text-lg">When do I get paid?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Payments are sent within one week after the campaign finishes, often quicker. Throughout the campaign, we regularly review and approve clips. Once the campaign budget is fully spent, we finalize who gets paid and how much. You will receive an email notification once the payment has been sent.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-900/40 border-neutral-800/50">
                  <CardHeader>
                    <CardTitle className="text-lg">What is the engagement rate requirement?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      All clips must have a minimum of 0.5% engagement rate to qualify for campaigns. Any video with less than 0.5% engagement rate will not be eligible for payout. We lowered the requirement from 1% to 0.5% so more clips can qualify, while still keeping a fair standard for quality and performance.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-900/40 border-neutral-800/50">
                  <CardHeader>
                    <CardTitle className="text-lg">How are my clip views tracked?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      After posting clips, submit them through the campaign dashboard. Here, you can either click "scan account" to automatically fetch your recent clips, or manually submit the links by clicking "submit clips." Make sure you submit clips regularly because we close campaigns when the budget is almost reached to avoid overspending.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* For Potential Clients Section */}
            <section className="mb-16">
              <h2 className="text-3xl font-light mb-8">For Potential Clients</h2>
              <p className="text-muted-foreground mb-8">
                Information for brands and businesses interested in running campaigns with Swivi.
              </p>

              <div className="space-y-4">
                <Card className="bg-neutral-900/40 border-neutral-800/50">
                  <CardHeader>
                    <CardTitle className="text-lg">How does Swivi work for brands?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Swivi connects your brand with thousands of content creators who create authentic, viral content for your campaigns. Our network of creators amplifies your message across TikTok, Instagram, YouTube, and other platforms.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-900/40 border-neutral-800/50">
                  <CardHeader>
                    <CardTitle className="text-lg">What types of campaigns can I run?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Product launches, brand awareness, event promotion, app downloads, website traffic, or any marketing objective. We work with entertainment, tech startups, e-commerce brands, musicians, athletes, and more.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-900/40 border-neutral-800/50">
                  <CardHeader>
                    <CardTitle className="text-lg">How much does it cost?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Campaign budgets start at $250 and scale based on your goals. You pay per 1,000 views generated, ensuring you only pay for real results. Contact us for a custom quote based on your specific needs.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-900/40 border-neutral-800/50">
                  <CardHeader>
                    <CardTitle className="text-lg">How quickly can I see results?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Most campaigns generate results within 2-3 days, with some completing in under 6 hours. You'll see real-time tracking of views, engagement, and performance metrics throughout your campaign.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-900/40 border-neutral-800/50">
                  <CardHeader>
                    <CardTitle className="text-lg">How do I get started?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Contact our team to discuss your campaign goals and budget. We'll help you design an effective campaign strategy and get you set up with tracking and reporting dashboards.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
