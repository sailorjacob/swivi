"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import { useSession } from "@/lib/supabase-auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { 
  ArrowLeft,
  FileText,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const documents = [
  {
    id: "msa",
    title: "Master Services Agreement (MSA)",
    description: "The governing contract for long-term client relationships. Sign once, covers 1-3 years.",
    filename: "Swivi_MSA_Template.txt",
    content: `MASTER SERVICES AGREEMENT

This Master Services Agreement ("Agreement") is entered into as of [DATE] ("Effective Date") by and between:

SWIVI MEDIA LLC ("Agency")
[Your Address]
[City, State ZIP]

and

[CLIENT NAME] ("Client")
[Client Address]
[City, State ZIP]

1. SERVICES

1.1 Agency agrees to provide influencer marketing, creator network management, and related services ("Services") as described in individual Statements of Work ("SOW") executed under this Agreement.

1.2 Each SOW will specify the scope, deliverables, timeline, and compensation for specific projects.

2. TERM

2.1 This Agreement shall commence on the Effective Date and continue for a period of one (1) year, unless terminated earlier in accordance with Section 8.

2.2 This Agreement shall automatically renew for successive one (1) year terms unless either party provides written notice of non-renewal at least thirty (30) days prior to the end of the then-current term.

3. COMPENSATION AND PAYMENT

3.1 Client shall pay Agency the fees set forth in each SOW.

3.2 Unless otherwise specified in an SOW, payment terms are Net 30 from invoice date.

3.3 Late payments shall accrue interest at the rate of 1.5% per month or the maximum rate permitted by law, whichever is less.

3.4 Agency may suspend Services for any invoice outstanding more than 45 days.

4. INTELLECTUAL PROPERTY

4.1 Creator Content: Creators retain ownership of all content created. Client receives a limited license as specified in each SOW.

4.2 Agency Materials: Agency retains ownership of all proprietary methodologies, tools, and processes.

4.3 Client Materials: Client retains ownership of all trademarks, brand guidelines, and pre-existing materials.

5. CONFIDENTIALITY

5.1 Each party agrees to maintain the confidentiality of the other party's Confidential Information.

5.2 "Confidential Information" includes pricing, campaign strategies, performance data, and business information.

5.3 This obligation shall survive termination of this Agreement for a period of two (2) years.

6. REPRESENTATIONS AND WARRANTIES

6.1 Agency represents that:
   (a) It has the authority to enter into this Agreement
   (b) Services will be performed in a professional manner
   (c) All creators in its network are properly vetted

6.2 Client represents that:
   (a) It has the authority to enter into this Agreement
   (b) All materials provided to Agency do not infringe third-party rights

7. LIMITATION OF LIABILITY

7.1 EXCEPT FOR BREACHES OF CONFIDENTIALITY OR INDEMNIFICATION OBLIGATIONS, NEITHER PARTY SHALL BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.

7.2 Agency's total liability under this Agreement shall not exceed the fees paid by Client in the twelve (12) months preceding the claim.

8. TERMINATION

8.1 Either party may terminate this Agreement upon thirty (30) days written notice.

8.2 Either party may terminate immediately upon material breach by the other party that remains uncured for fifteen (15) days after written notice.

8.3 Upon termination:
   (a) Client shall pay for all Services rendered through the termination date
   (b) All SOWs in progress shall terminate unless otherwise agreed
   (c) Confidentiality obligations survive

9. INDEMNIFICATION

9.1 Agency shall indemnify Client against third-party claims arising from Agency's gross negligence or willful misconduct.

9.2 Client shall indemnify Agency against third-party claims arising from Client's materials or instructions.

10. GENERAL PROVISIONS

10.1 Independent Contractor: Agency is an independent contractor, not an employee of Client.

10.2 Assignment: Neither party may assign this Agreement without written consent.

10.3 Governing Law: This Agreement shall be governed by the laws of [STATE].

10.4 Entire Agreement: This Agreement, together with all SOWs, constitutes the entire agreement between the parties.

10.5 Amendments: Amendments must be in writing and signed by both parties.

10.6 Notices: All notices shall be in writing and sent to the addresses above.


IN WITNESS WHEREOF, the parties have executed this Agreement as of the Effective Date.

SWIVI MEDIA LLC                          [CLIENT NAME]

By: _________________________            By: _________________________

Name: _______________________            Name: _______________________

Title: ______________________            Title: ______________________

Date: _______________________            Date: _______________________`
  },
  {
    id: "sow",
    title: "Statement of Work (SOW)",
    description: "Project-specific contract for individual campaigns. Falls under the MSA.",
    filename: "Swivi_SOW_Template.txt",
    content: `STATEMENT OF WORK

SOW Number: [SOW-XXXX]
Effective Date: [DATE]
Client: [CLIENT NAME]

This Statement of Work ("SOW") is entered into pursuant to the Master Services Agreement dated [MSA DATE] between Swivi Media LLC ("Agency") and [CLIENT NAME] ("Client").

1. PROJECT OVERVIEW

Campaign Name: [CAMPAIGN NAME]
Campaign Objective: [DESCRIPTION OF GOALS]
Campaign Duration: [START DATE] to [END DATE]

2. SCOPE OF SERVICES

Agency will provide the following services:

2.1 Creator Sourcing & Management
   - Source and vet [NUMBER] creators from Agency's network
   - Provide creator list for Client approval within [X] business days
   - Manage all creator communications and deliverables

2.2 Content Production
   - Brief creators on campaign requirements and brand guidelines
   - Review and quality control all content before posting
   - Coordinate posting schedule across all creators

2.3 Campaign Management
   - Monitor campaign performance daily
   - Provide weekly progress reports
   - Final campaign report within 7 days of campaign end

3. DELIVERABLES

| Deliverable | Quantity | Platform | Timeline |
|-------------|----------|----------|----------|
| Creator Videos | [NUMBER] | TikTok/Instagram | [DATES] |
| [ADDITIONAL] | [NUMBER] | [PLATFORM] | [DATES] |

4. COMPENSATION

4.1 Media Budget (Pass-Through)
   Creator payments: $[AMOUNT]
   
4.2 Agency Service Fee
   Management fee ([X]% of media budget): $[AMOUNT]
   
4.3 Content Strategy Fee
   Creative direction and briefing: $[AMOUNT]

4.4 Total Project Fee: $[TOTAL]

5. PAYMENT SCHEDULE

   - 50% due upon SOW execution: $[AMOUNT]
   - 50% due upon campaign completion: $[AMOUNT]

Payment terms: Net 30 from invoice date.

6. USAGE RIGHTS

6.1 Standard License: Client receives a [90-DAY] license for organic use on owned channels.

6.2 Extended Use: Additional licensing available at [RATE] per video per month.

6.3 Whitelisting/Paid Amplification: Available for $[AMOUNT] per post.

6.4 Exclusions: Perpetual rights, broadcast use, and out-of-home require separate negotiation.

7. APPROVAL PROCESS

7.1 Creator List: Client has [48] hours to approve or request changes. No response = approved.

7.2 Content Review: Client has [48] hours to approve or request revisions.

7.3 Revisions: [2] rounds of revisions included. Additional revisions at $[AMOUNT] per round.

8. CLIENT RESPONSIBILITIES

Client shall:
   - Provide brand guidelines within [X] days of SOW execution
   - Provide product/access for creator content as needed
   - Respond to approval requests within stated timeframes
   - Designate a single point of contact for campaign decisions

9. CANCELLATION

9.1 Cancellation before creator briefing: 10% kill fee
9.2 Cancellation after creator briefing: 25% kill fee
9.3 Cancellation after content production begins: 50% kill fee

10. SUCCESS METRICS

Campaign will be measured against:
   - Total Views: [TARGET]
   - Engagement Rate: [TARGET]
   - [ADDITIONAL METRICS]

Note: These are targets, not guarantees. Actual performance depends on content quality, timing, and platform algorithms.


ACCEPTED AND AGREED:

SWIVI MEDIA LLC                          [CLIENT NAME]

By: _________________________            By: _________________________

Name: _______________________            Name: _______________________

Title: ______________________            Title: ______________________

Date: _______________________            Date: _______________________`
  },
  {
    id: "proposal",
    title: "Campaign Proposal Template",
    description: "Pre-contract document to pitch campaigns to prospects.",
    filename: "Swivi_Proposal_Template.txt",
    content: `CAMPAIGN PROPOSAL

Prepared for: [CLIENT NAME]
Prepared by: Swivi Media
Date: [DATE]
Valid Until: [DATE + 30 DAYS]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXECUTIVE SUMMARY

We propose a creator-driven campaign to [OBJECTIVE] through authentic, platform-native content distributed across our network of [NUMBER]+ vetted creators.

Our approach delivers:
• Authentic engagement at scale
• 48-hour activation capability
• Proven CPM efficiency ($1-2 vs. industry standard $4-8)
• Full-service management from briefing to reporting

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THE OPPORTUNITY

[DESCRIBE THE CLIENT'S CHALLENGE OR GOAL]

[EXPLAIN WHY CREATOR-DRIVEN CONTENT IS THE SOLUTION]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RECOMMENDED APPROACH

Campaign Structure:
• [NUMBER] creators across [PLATFORMS]
• [DURATION] flight with [POSTING CADENCE]
• Content themes: [LIST 2-3 ANGLES]

Creator Profile:
• Audience: [DEMOGRAPHICS]
• Content style: [DESCRIPTION]
• Engagement focus: [METRICS]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DELIVERABLES

| Item | Quantity | Details |
|------|----------|---------|
| Creator Videos | [NUMBER] | Original TikTok/Reels content |
| Total Reach | [ESTIMATE] | Based on creator audiences |
| Campaign Reports | [NUMBER] | Weekly + Final |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INVESTMENT

Media Budget (Creator Payments)          $[AMOUNT]
Agency Management Fee ([X]%)             $[AMOUNT]
Content Strategy & Creative Direction    $[AMOUNT]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Investment                         $[TOTAL]

Optional Add-Ons:
• Usage Rights Extension (6 months): $[AMOUNT]
• Whitelisting for Paid Amplification: $[AMOUNT]
• Additional [X] Creators: $[AMOUNT]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROJECTED OUTCOMES

Based on similar campaigns, we project:

• Views: [RANGE]
• Engagements: [RANGE]
• Effective CPM: $[RANGE]
• CPE: $[RANGE]

Note: Projections based on historical performance. Actual results vary.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CASE STUDY: [PREVIOUS CAMPAIGN]

Challenge: [BRIEF DESCRIPTION]
Solution: [WHAT WE DID]
Results:
• [METRIC]: [RESULT]
• [METRIC]: [RESULT]
• CPM Achieved: $[AMOUNT]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TIMELINE

Week 1: Briefing & Creator Selection
Week 2: Content Production
Week 3-4: Content Distribution
Week 5: Final Reporting

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEXT STEPS

1. Schedule kickoff call to finalize scope
2. Execute SOW and submit 50% deposit
3. Begin creator sourcing (48-hour turnaround)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONTACT

Swivi Media
team@swivimedia.com
swivimedia.com`
  },
  {
    id: "invoice",
    title: "Invoice Template",
    description: "Standard invoice format for billing clients.",
    filename: "Swivi_Invoice_Template.txt",
    content: `INVOICE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SWIVI MEDIA LLC
[Your Address]
[City, State ZIP]
team@swivimedia.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Invoice Number: [INV-XXXX]
Invoice Date: [DATE]
Due Date: [DATE + 30 DAYS]
SOW Reference: [SOW-XXXX]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BILL TO:

[CLIENT NAME]
[Client Contact Name]
[Client Address]
[City, State ZIP]
[Client Email]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROJECT: [CAMPAIGN NAME]

| Description | Amount |
|-------------|--------|
| Media Budget - Creator Payments (Pass-through) | $[AMOUNT] |
| Agency Management Fee ([X]% of media) | $[AMOUNT] |
| Content Strategy & Creative Direction | $[AMOUNT] |
| Usage Rights - [X] Month License | $[AMOUNT] |
| Whitelisting Access | $[AMOUNT] |
|-------------|--------|
| SUBTOTAL | $[AMOUNT] |
| Less: Deposit Paid ([DATE]) | -$[AMOUNT] |
|-------------|--------|
| AMOUNT DUE | $[AMOUNT] |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PAYMENT INFORMATION

Bank Transfer:
Bank Name: [BANK]
Account Name: Swivi Media LLC
Routing Number: [ROUTING]
Account Number: [ACCOUNT]

Or PayPal: [PAYPAL EMAIL]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TERMS

• Payment due within 30 days of invoice date
• Late payments subject to 1.5% monthly interest
• Questions? Contact team@swivimedia.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thank you for your business.`
  },
  {
    id: "usage-rights",
    title: "Usage Rights Addendum",
    description: "Additional agreement for extended content usage and licensing.",
    filename: "Swivi_Usage_Rights_Addendum.txt",
    content: `USAGE RIGHTS ADDENDUM

This Usage Rights Addendum ("Addendum") is entered into as of [DATE] and supplements the Statement of Work [SOW-XXXX] ("SOW") between Swivi Media LLC ("Agency") and [CLIENT NAME] ("Client").

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. STANDARD LICENSE (Included in SOW)

Client receives the following rights at no additional cost:

Duration: [90] days from content posting date
Scope:
• Organic reposting on Client's owned social channels
• Internal use for presentations and reviews
• Embedding on Client's website with creator credit

Restrictions:
• No paid amplification without Whitelisting Agreement
• No editing or alteration of creator content
• No use beyond licensed duration without extension

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. EXTENDED LICENSE OPTIONS

2.1 Duration Extension
[ ] 6-month extension: $[AMOUNT] per video
[ ] 12-month extension: $[AMOUNT] per video
[ ] Perpetual license: $[AMOUNT] per video (100% premium)

2.2 Expanded Use Rights
[ ] Paid Social Amplification: See Whitelisting Agreement
[ ] Email Marketing: $[AMOUNT] per video
[ ] Broadcast/TV: $[AMOUNT] per video
[ ] Out-of-Home/Digital Signage: $[AMOUNT] per video
[ ] Print Advertising: $[AMOUNT] per video

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. WHITELISTING / SPARK ADS AGREEMENT

Client wishes to run paid advertisements using creator content.

Selected Videos:
[ ] All campaign videos
[ ] Selected videos (list attached)

Whitelisting Fee: $[AMOUNT] per video for [DURATION]

Terms:
• Agency will coordinate with creators to enable whitelisting access
• Client may run ads using creator handles/identities
• Ad spend is Client's responsibility (not included in fee)
• Creators may revoke access with 7 days notice
• Usage limited to agreed platforms and markets

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. TERRITORY

[ ] United States only
[ ] North America
[ ] Worldwide
[ ] Other: _______________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5. CONTENT COVERED

This Addendum applies to the following content from [SOW-XXXX]:

[ ] All [NUMBER] videos from campaign
[ ] Selected videos only:
    Video 1: [CREATOR] - [DESCRIPTION]
    Video 2: [CREATOR] - [DESCRIPTION]
    Video 3: [CREATOR] - [DESCRIPTION]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

6. COMPENSATION

Total Additional Licensing Fee: $[AMOUNT]

Payment due upon execution of this Addendum.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

7. REPRESENTATIONS

Agency represents that:
• All creators have agreed to the usage rights granted herein
• Agency has authority to grant these rights on creators' behalf

Client agrees to:
• Use content only within the scope of this Addendum
• Maintain creator attribution where required
• Not sublicense rights without written consent

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACCEPTED AND AGREED:

SWIVI MEDIA LLC                          [CLIENT NAME]

By: _________________________            By: _________________________

Name: _______________________            Name: _______________________

Title: ______________________            Title: ______________________

Date: _______________________            Date: _______________________`
  }
]

export default function DocumentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null)
  const [copiedDoc, setCopiedDoc] = useState<string | null>(null)
  
  const isDemoMode = process.env.NODE_ENV === "development"

  useEffect(() => {
    if (status === "loading") return
    if (!isDemoMode && !session) {
      router.push("/creators/login?error=AccessDenied")
    }
    if (!isDemoMode && session?.user?.role !== "ADMIN") {
      router.push("/creators/dashboard?error=AdminAccessRequired")
    }
  }, [session, status, router, isDemoMode])

  if (status === "loading" || (!isDemoMode && (!session || session.user?.role !== "ADMIN"))) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const handleDownload = (doc: typeof documents[0]) => {
    const blob = new Blob([doc.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = doc.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopy = async (doc: typeof documents[0]) => {
    await navigator.clipboard.writeText(doc.content)
    setCopiedDoc(doc.id)
    setTimeout(() => setCopiedDoc(null), 2000)
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container mx-auto px-6 py-6">
          <Link href="/admin/agency" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Agency
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Document Templates</h1>
          <p className="text-muted-foreground mt-1">
            Ready-to-use contracts and templates for client engagements
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="space-y-4">
          {documents.map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{doc.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCopy(doc)}
                        className="gap-2"
                      >
                        {copiedDoc === doc.id ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownload(doc)}
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <button
                    onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {expandedDoc === doc.id ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Hide Preview
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Show Preview
                      </>
                    )}
                  </button>
                  
                  {expandedDoc === doc.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-4"
                    >
                      <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto max-h-96 overflow-y-auto font-mono whitespace-pre-wrap">
                        {doc.content}
                      </pre>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Usage Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-8"
        >
          <Card className="border-foreground/10 bg-foreground/5">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Important</h3>
              <p className="text-sm text-muted-foreground">
                These templates are starting points. Have legal counsel review and customize them for your specific jurisdiction 
                and business needs before use with clients. Replace all bracketed [PLACEHOLDER] text with your actual information.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

