"use client"

import { Header } from "@/components/layout/header"
// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Users, Building2, Briefcase } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function SupportPage() {
  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col pt-16">
        <div className="max-width-wrapper section-padding py-20">
          <div className="max-w-4xl mx-auto">

            {/* Page Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              <h1 className="text-3xl sm:text-4xl font-light mb-4">Support & FAQ</h1>
              <p className="text-muted-foreground">
                Find answers to common questions or reach out to our team.
              </p>
            </motion.div>

            {/* Contact Methods */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-16"
            >
              <Card className="border border-black/10 bg-background">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-normal">
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
                    className="text-foreground hover:text-foreground/80 transition-colors font-medium underline underline-offset-4"
                  >
                    support@swivimedia.com
                  </a>
                </CardContent>
              </Card>
            </motion.div>

            {/* For Creators Section */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <div className="flex items-center gap-3 mb-6">
                <Users className="h-6 w-6" />
                <h2 className="text-2xl font-light">For Creators</h2>
              </div>
              <p className="text-muted-foreground mb-8">
                Everything you need to know about participating in campaigns and earning money as a content creator.
              </p>

              <div className="space-y-4">
                <Card className="border border-black/10 bg-background">
                  <CardHeader>
                    <CardTitle className="text-lg font-normal">How do I join Swivi?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Apply through our platform to get instant access to campaigns and our creator dashboard. There's no minimum follower count — we welcome all creators, whether you're brand new or experienced.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-black/10 bg-background">
                  <CardHeader>
                    <CardTitle className="text-lg font-normal">Is there a minimum follower requirement?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      No minimum follower count is required. We want to give all creators — whether you're brand new or experienced — the chance to earn money by participating in campaigns.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-black/10 bg-background">
                  <CardHeader>
                    <CardTitle className="text-lg font-normal">What platforms can I post on?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Currently, we support content posted on TikTok, YouTube Shorts, and Instagram Reels. We may add more platforms in the future based on campaign needs.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-black/10 bg-background">
                  <CardHeader>
                    <CardTitle className="text-lg font-normal">How do I know if a campaign is still active?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      If you see the campaign listed under "Active Campaigns" in your dashboard, it's still running and you can participate.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-black/10 bg-background">
                  <CardHeader>
                    <CardTitle className="text-lg font-normal">How much can I earn?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Each campaign has different payout rates. Check the campaign details to see exactly how much you can earn per 1,000 views on your posts.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-black/10 bg-background">
                  <CardHeader>
                    <CardTitle className="text-lg font-normal">When do I get paid?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Payments are sent within one week after the campaign finishes — often faster. Throughout the campaign, we regularly review and approve submissions. You'll receive an email once payment is sent.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-black/10 bg-background">
                  <CardHeader>
                    <CardTitle className="text-lg font-normal">What is the engagement rate requirement?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      All posts must have a minimum 0.5% engagement rate to qualify for payout. This helps maintain quality standards while allowing more content to qualify.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-black/10 bg-background">
                  <CardHeader>
                    <CardTitle className="text-lg font-normal">How are my views tracked?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      After posting, submit your content through the campaign dashboard. You can click "Scan Account" to automatically fetch your recent posts, or manually submit links. Submit regularly — campaigns close when the budget is almost reached.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </motion.section>

            {/* For Brands Section */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <div className="flex items-center gap-3 mb-6">
                <Building2 className="h-6 w-6" />
                <h2 className="text-2xl font-light">For Brands</h2>
              </div>
              <p className="text-muted-foreground mb-8">
                Information for brands and media companies interested in running distribution campaigns with Swivi.
              </p>

              <div className="space-y-4">
                <Card className="border border-black/10 bg-background">
                  <CardHeader>
                    <CardTitle className="text-lg font-normal">How does Swivi work for brands?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Swivi deploys large networks of creators to post your content across TikTok, Instagram Reels, and YouTube Shorts. Instead of managing individual influencers, you get coordinated distribution at scale — hundreds of creators posting simultaneously to generate organic reach.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-black/10 bg-background">
                  <CardHeader>
                    <CardTitle className="text-lg font-normal">What types of campaigns work best?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Swivi campaigns perform best for time-sensitive moments: streaming releases, product launches, brand announcements, and founder visibility pushes. If timing and saturation matter, Swivi works.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-black/10 bg-background">
                  <CardHeader>
                    <CardTitle className="text-lg font-normal">How much does it cost?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Enterprise campaigns typically range from $15,000–$25,000 for 7–14 day distribution windows. You pay based on views delivered, ensuring you only pay for real results. Contact us for a custom quote.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-black/10 bg-background">
                  <CardHeader>
                    <CardTitle className="text-lg font-normal">How quickly can I see results?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Most campaigns generate millions of views within the first week. We've delivered 25 million views in under 7 days for Netflix releases. You get real-time tracking of views, engagement, and creator performance throughout.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-black/10 bg-background">
                  <CardHeader>
                    <CardTitle className="text-lg font-normal">What do I need to provide?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Just send us your content (video assets, guidelines, etc.) and define your launch window. We handle everything else: creator sourcing, coordination, quality control, approvals, and performance tracking. You stay hands-off.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-black/10 bg-background">
                  <CardHeader>
                    <CardTitle className="text-lg font-normal">How do I get started?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Book a call with our team to discuss your launch timeline, goals, and budget. We'll design a campaign structure tailored to your needs.
                    </p>
                    <Button size="sm" className="font-normal bg-foreground text-background hover:bg-foreground/90">
                      <Link href="https://calendly.com/bykevingeorge/30min?month=2025-05" target="_blank" rel="noopener noreferrer" className="flex items-center">
                        Book a Call
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </motion.section>

            {/* For Partners Section */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <div className="flex items-center gap-3 mb-6">
                <Briefcase className="h-6 w-6" />
                <h2 className="text-2xl font-light">For Partners & Agencies</h2>
              </div>
              <p className="text-muted-foreground mb-8">
                Information for agencies and partners looking to work with Swivi.
              </p>

              <div className="space-y-4">
                <Card className="border border-black/10 bg-background">
                  <CardHeader>
                    <CardTitle className="text-lg font-normal">Do you work with agencies?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Yes. We partner with marketing agencies, talent agencies, and media companies to provide creator distribution as a service. You can white-label our distribution or add it to your existing client offerings.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-black/10 bg-background">
                  <CardHeader>
                    <CardTitle className="text-lg font-normal">Can I bring my own clients?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Absolutely. We offer partner programs for agencies who want to bring clients to Swivi. Contact us to discuss partnership terms and referral arrangements.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-black/10 bg-background">
                  <CardHeader>
                    <CardTitle className="text-lg font-normal">How do I become a partner?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Email us at <a href="mailto:support@swivimedia.com" className="underline underline-offset-2">support@swivimedia.com</a> with details about your agency and the types of clients you work with. We'll schedule a call to explore partnership opportunities.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </motion.section>

            {/* Still have questions */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center py-12 border-t border-black/5"
            >
              <h3 className="text-xl font-light mb-4">Still have questions?</h3>
              <p className="text-muted-foreground mb-6">
                We're here to help. Reach out and we'll get back to you within 24 hours.
              </p>
              <a
                href="mailto:support@swivimedia.com"
                className="inline-flex items-center text-sm font-normal border border-foreground bg-transparent text-foreground px-6 py-3 rounded-full hover:bg-foreground hover:text-background transition-all duration-300"
              >
                Contact Support
              </a>
            </motion.section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
