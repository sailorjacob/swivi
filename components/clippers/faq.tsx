"use client"

import { useState } from "react"
import { Search, ChevronDown, ChevronUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface FAQItem {
  question: string
  answer: string
  category: string
}

const faqData: FAQItem[] = [
  // Getting Started
  {
    question: "How do I join Swivi Clippers?",
    answer: "Apply through our exclusive Discord community. Get instant access to creator content and our clipper dashboard. There's no minimum follower count needed - we welcome all clippers, whether you're brand new or experienced.",
    category: "getting-started"
  },
  {
    question: "Is there a minimum follower requirement to join campaigns?",
    answer: "No, there's no minimum follower count needed. We want to give all clippers—whether you're brand new or experienced, the chance to earn money.",
    category: "getting-started"
  },
  {
    question: "What platforms can I clip on?",
    answer: "Currently, we support clips posted on TikTok, YouTube Shorts, Instagram Reels, and X (formerly Twitter). We might add Snapchat, Facebook, and Threads later, depending on campaign needs.",
    category: "getting-started"
  },
  {
    question: "Can I link multiple social accounts?",
    answer: "Yes, you can connect as many social accounts as you want in the 🔗・connect-socials channel. There's no maximum limit, so feel free to add multiple accounts.",
    category: "getting-started"
  },

  // Campaigns & Submissions
  {
    question: "How do I know if a campaign is still active?",
    answer: "If you see the campaign listed under the \"Active Campaigns\" category, it's active, and you can participate.",
    category: "campaigns"
  },
  {
    question: "Can I participate in multiple campaigns at the same time?",
    answer: "Yes, you can join as many campaigns as you want. There's currently no limit.",
    category: "campaigns"
  },
  {
    question: "When do campaigns end?",
    answer: "Campaigns run until the budget is fully spent, which depends on both the size of the budget and the number of clippers involved. On average, campaigns last 2-3 days, but some have finished in under 6 hours.",
    category: "campaigns"
  },
  {
    question: "How do I know how much budget is left for campaigns?",
    answer: "You can see how much budget is left by looking at the leaderboard channel in a campaign category. It will show you what percentage of the budget is used and how much money is up for grabs.",
    category: "campaigns"
  },
  {
    question: "When is the best time to submit my clips after posting?",
    answer: "Right away is ideal — the sooner you submit, the faster your views get counted and the more money you can make. Submitting early also gives your clip the best chance to rank on leaderboards and get approved in time.",
    category: "campaigns"
  },
  {
    question: "Can I repost the same clip in multiple campaigns?",
    answer: "It depends on the specific campaign. We often look for ways to help you reuse clips to make more money without extra effort. Always check the campaign details to confirm if this is allowed.",
    category: "campaigns"
  },
  {
    question: "Are logos allowed on campaigns?",
    answer: "Yes, they are allowed unless stated otherwise. If they aren't allowed, it will be mentioned in campaign details.",
    category: "campaigns"
  },
  {
    question: "Do I need to use specific hashtags or mentions in my clips?",
    answer: "Only if clearly specified in the campaign details. If nothing is mentioned, you don't need to worry about using special hashtags or mentions.",
    category: "campaigns"
  },

  // Requirements & Guidelines
  {
    question: "What is the engagement rate requirement?",
    answer: "All clips must have a minimum of 0.5% engagement rate to qualify for campaigns. Any video with less than 0.5% engagement rate will not be eligible for payout. We lowered the requirement from 1% to 0.5% so more clips can qualify, while still keeping a fair standard for quality and performance.",
    category: "requirements"
  },
  {
    question: "How is engagement rate calculated?",
    answer: "Engagement rate = (Likes + Comments + Shares) ÷ Views × 100. For example: A clip with 1,000 views and 7 total engagements has a 0.7% engagement rate and qualifies. A clip with 2,000 views and 5 total engagements has a 0.25% engagement rate and does not qualify.",
    category: "requirements"
  },
  {
    question: "What does \"minimum clip duration\" mean?",
    answer: "When submitting videos for campaigns, make sure your clip is more than 7 seconds long, or else it will get denied. This is standard in all of our campaigns. If you post one below 7 seconds and it's your first time, open a ticket, and we will help you bypass it!",
    category: "requirements"
  },
  {
    question: "Do I need to leave my likes & comments public on my clips?",
    answer: "Yes, when submitting clips, please keep all your engagement stats public so we can properly track your views. If they are private videos, they may be ineligible for payment.",
    category: "requirements"
  },
  {
    question: "Is there a maximum limit to how many clips I can post?",
    answer: "You can post up to 30 clips per day. This limit helps prevent spam and keeps our system running smoothly. Need a higher limit? Open a ticket in 🎫・get-help, and we'll help you out.",
    category: "requirements"
  },
  {
    question: "Are all clips allowed?",
    answer: "Clip requirements and content guidelines will always be clearly specified for each campaign. Generally, no illegal, NSFW, or content that portrays the client negatively is allowed.",
    category: "requirements"
  },

  // Earnings & Payments
  {
    question: "How much can I get paid?",
    answer: "Each campaign has different payouts. To see exactly how much you can get paid for a specific campaign, check the payouts in \"campaign details\" channel located under that campaign's category.",
    category: "earnings"
  },
  {
    question: "Is there a max payout per campaign?",
    answer: "Yes. Each clipper can earn a maximum of 30% of the total campaign budget. This ensures fairness, helps new clippers participate, and guarantees our clients get maximum reach from their budget. Important: If we detect view botting or artificial boosting of views, you'll receive a permanent ban.",
    category: "earnings"
  },
  {
    question: "When do I get paid?",
    answer: "Payments are sent within one week after the campaign finishes, often quicker. Throughout the campaign, we regularly review and approve clips. Once the campaign budget is fully spent, we finalize who gets paid and how much. You will receive a DM and Email once the payment has been sent.",
    category: "earnings"
  },
  {
    question: "How do I get paid?",
    answer: "We pay all clippers using PayPal. You initially provide your PayPal email during sign-up, but you can always update or change your payment email later in 🧬・your-account",
    category: "earnings"
  },
  {
    question: "Do my views carry over to the next campaign?",
    answer: "No. Your views only count towards the current active campaign. If your clip didn't reach the minimum views for payout, those views won't roll over to the next campaign.",
    category: "earnings"
  },
  {
    question: "Do I need to hit 10K views on each individual clip, or do the views add up?",
    answer: "All the views from your clips get added up together — it doesn't have to be 10K per clip.",
    category: "earnings"
  },

  // Tracking & Analytics
  {
    question: "How are my clip views tracked?",
    answer: "After posting clips, go into the campaign category and find the submit clips channel. Here, you can either click \"scan account\" to automatically fetch your recent clips, or manually submit the links by clicking \"submit clips.\" Make sure you submit clips regularly because we close campaigns when the budget is almost reached to avoid overspending.",
    category: "tracking"
  },
  {
    question: "How often do my stats update?",
    answer: "After your clips are approved, stats automatically update every 2 hours. We also run one final update right before the campaign ends to ensure everyone gets paid accurately. If your clips haven't updated yet, make sure that it has been approved. You will receive a DM from our bot once it's been approved.",
    category: "tracking"
  },
  {
    question: "What does \"video under review\" mean?",
    answer: "When your video says it's under review, it means our team is manually checking it to confirm it follows campaign guidelines. Once reviewed, it'll either get approved or rejected and you will receive a DM.",
    category: "tracking"
  },

  // Account & Demographics
  {
    question: "How do I verify my account demographics?",
    answer: "Head over to the ✅・verify-demographics channel and type /verify. You'll need to upload a screen recording clearly showing your account's demographics. Our team reviews submissions within 48 hours.",
    category: "account"
  },
  {
    question: "Where do I find my demographics for my page?",
    answer: "On Instagram, locate your \"professional dashboard\" & from there find \"audience.\" On TikTok, go to \"TikTok Studio\" \"Analytics\" \"Viewers\" then \"Locations.\" Other platforms are similar but generally your demographic information is located in your analytics. If your account is new & doesn't yet show this information, first connect your account then open a ticket with your username, niche, and proof of location, so we can manually verify you!",
    category: "account"
  },
  {
    question: "What are country tiers?",
    answer: "Country tiers are a standard system used widely in digital advertising. They group countries based on their general economic situation and market purchasing power. Sometimes clients want to target specific country tiers. Tier 1 includes US, Canada, UK, Germany, Australia, etc. Tier 2 includes Italy, Spain, UAE, Brazil, etc. Tier 3 includes all other countries.",
    category: "account"
  },
  {
    question: "How do I hide my discord username from the leaderboards?",
    answer: "First go to 🧬・your-account, then click analytics, then click hide username!",
    category: "account"
  },

  // Troubleshooting
  {
    question: "Why did my video get denied?",
    answer: "If your clip was denied, the reason will be clearly mentioned in the bot's response. Common reasons include incorrect video length, missing hashtags, or improper sound usage.",
    category: "troubleshooting"
  },
  {
    question: "What should I do if I accidentally submitted the wrong clip or account?",
    answer: "Go to the submit clips channel of that campaign, click \"Remove Clip,\" and paste the link to the video you want to remove.",
    category: "troubleshooting"
  },
  {
    question: "Can I edit or change a clip after it has been approved?",
    answer: "No. Editing your clip after approval is not allowed. We check for any changes that might violate campaign rules. If needed, you can remove the clip completely instead.",
    category: "troubleshooting"
  },
  {
    question: "What happens if my video is flagged or removed by the platform after approval?",
    answer: "If your video gets removed during an active campaign, you won't get paid for those views. However, if it happens after the campaign ends and you've already been paid, it's no problem.",
    category: "troubleshooting"
  },
  {
    question: "Can I delete or archive my clips after submission?",
    answer: "Yes. To remove your clips from tracking, use the \"Remove Clip\" button in the campaign's submit clips channel. If you delete your video from the social platform directly, it will automatically disappear from our system.",
    category: "troubleshooting"
  },
  {
    question: "What counts as suspicious or \"boosted\" views?",
    answer: "Examples include extremely low engagement rates (under 1%), comments from brand-new accounts, unusual engagement ratios, or new accounts with just one viral video. Many factors go into detecting this. If we're unsure, we'll reach out directly to ask for proof.",
    category: "troubleshooting"
  },

  // Support & Community
  {
    question: "How can I open a support ticket if I have questions?",
    answer: "If you have a personal account-related question or need help, open a ticket in the 🎫・get-help channel by clicking one of the provided buttons. Allow up to 24 hours for our response. Tagging staff in chats or sending direct messages won't speed things up, as we handle tickets in order.",
    category: "support"
  },
  {
    question: "What if I have an idea for a feature I want added?",
    answer: "If you have an idea for something we can change or add to improve the overall experience, feel free to open a ticket and let us know! We are always open to ideas and love adding stuff for you guys. Literally anything, just let us know and we will look into making it happen!",
    category: "support"
  },
  {
    question: "Can we add an intro to our edits when participating in audio campaigns?",
    answer: "Yes! Edits are amazing, and you can do intros on these. This is always welcome and will be approved. If you have issues, just open a ticket for support!",
    category: "support"
  },
  {
    question: "What's the best way to find clippers for the referral program?",
    answer: "We have a detailed document showing exactly how to quickly find the best clippers to join the community. Other tactics include DM'ing members from other clipping servers, which works very well also!",
    category: "support"
  },

  // Technical
  {
    question: "How do I add a sound to my video on TikTok for a campaign?",
    answer: "We provide screen recordings showing you exactly how to attach an audio to your video! Check the campaign details or ask in support for the latest tutorial.",
    category: "technical"
  }
]

const categories = [
  { id: "all", label: "All Questions" },
  { id: "getting-started", label: "Getting Started" },
  { id: "campaigns", label: "Campaigns & Submissions" },
  { id: "requirements", label: "Requirements & Guidelines" },
  { id: "earnings", label: "Earnings & Payments" },
  { id: "tracking", label: "Tracking & Analytics" },
  { id: "account", label: "Account & Demographics" },
  { id: "troubleshooting", label: "Troubleshooting" },
  { id: "support", label: "Support & Community" },
  { id: "technical", label: "Technical" }
]

export function ClippersFAQ() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())

  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedItems(newExpanded)
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Search */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 lg:grid-cols-5 h-auto gap-1 p-1">
          {categories.slice(0, 5).map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="text-xs py-2"
            >
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 lg:grid-cols-5 h-auto gap-1 p-1 mt-2">
          {categories.slice(5).map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="text-xs py-2"
            >
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* FAQ Items */}
      <div className="space-y-4">
        {filteredFAQs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No questions found matching your search criteria.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredFAQs.map((faq, index) => {
            const isExpanded = expandedItems.has(index)
            return (
              <Card key={index} className="transition-all duration-200 hover:shadow-md">
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => toggleExpanded(index)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-normal text-left pr-4">
                      {faq.question}
                    </CardTitle>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {faq.answer}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })
        )}
      </div>

      {/* Results count */}
      {searchTerm && (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Found {filteredFAQs.length} question{filteredFAQs.length !== 1 ? 's' : ''} 
          {searchTerm && ` matching "${searchTerm}"`}
        </div>
      )}
    </div>
  )
}
