"use client"

import { useState } from "react"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ExternalLink, FileText } from "lucide-react"

// Campaign updates configuration
// Key is matched against campaign title (lowercase)
const CAMPAIGN_UPDATES: Record<string, {
  id: string
  title: string
  date: string
  sections: {
    heading?: string
    content: string[]
  }[]
  contentFolders?: { label: string; url: string }[]
}> = {
  "owning-manhattan-season-2": {
    id: "serhant-dec-2024",
    title: "SERHANT Team Update",
    date: "December 2024",
    sections: [
      {
        heading: "New Directive",
        content: [
          "New batch of content, some of the punchier moments. There could be shorter clips made out of these.",
          "Need to push clippers to add punchy on-video text.",
          "Have them watch the full video and get the context of the situation.",
          "We need clever stuff, memeable stuff, stuff people can connect and relate to, stuff they want to share with a friend.",
          "Need to avoid duplicate content / posts being accepted into the campaign."
        ]
      },
      {
        heading: "What This Means",
        content: [
          "They're happy with the momentum, but they want the next level.",
          "Funnier. Punchier. Sharper text. More context-aware edits. Zero duplicates."
        ]
      },
      {
        heading: "Action",
        content: [
          "Pull clips from the new batch.",
          "Watch the full videos.",
          "Extract the human moments.",
          "Build edits that hit instantly.",
          "Add on-screen captions that elevate the joke, the awkwardness, the drama, or the relatability.",
          "No recycled angles. No repeats."
        ]
      }
    ],
    contentFolders: [
      { 
        label: "New Content Folder", 
        url: "https://drive.google.com/drive/folders/1PBQcFZhCJrUOGH0QyARz60GshRnbz4kH?usp=drive_link" 
      }
    ]
  }
}

function getUpdateForCampaign(campaignTitle: string) {
  const normalized = campaignTitle.toLowerCase()
  if (normalized.includes("owning manhattan") && normalized.includes("season 2")) {
    return CAMPAIGN_UPDATES["owning-manhattan-season-2"]
  }
  return null
}

interface CampaignUpdateProps {
  campaignTitle: string
}

// Inline trigger for campaign detail page - subtle text link
export function CampaignUpdateTrigger({ campaignTitle }: CampaignUpdateProps) {
  const [open, setOpen] = useState(false)
  const update = getUpdateForCampaign(campaignTitle)
  
  if (!update) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <FileText className="w-4 h-4" />
        <span>Team Update ({update.date})</span>
      </button>
      
      <CampaignUpdateDialog 
        open={open} 
        onOpenChange={setOpen} 
        update={update}
      />
    </>
  )
}

// Button variant for more prominent placement
export function CampaignUpdateButton({ campaignTitle }: CampaignUpdateProps) {
  const [open, setOpen] = useState(false)
  const update = getUpdateForCampaign(campaignTitle)
  
  if (!update) return null

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="border-border"
      >
        <FileText className="w-4 h-4 mr-2" />
        Team Update
      </Button>
      
      <CampaignUpdateDialog 
        open={open} 
        onOpenChange={setOpen} 
        update={update}
      />
    </>
  )
}

// Card variant to show on campaign detail page
export function CampaignUpdateCard({ campaignTitle }: CampaignUpdateProps) {
  const [open, setOpen] = useState(false)
  const update = getUpdateForCampaign(campaignTitle)
  
  if (!update) return null

  return (
    <>
      <div 
        onClick={() => setOpen(true)}
        className="p-4 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{update.title}</p>
              <p className="text-xs text-muted-foreground">{update.date} · Click to read</p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">→</span>
        </div>
      </div>
      
      <CampaignUpdateDialog 
        open={open} 
        onOpenChange={setOpen} 
        update={update}
      />
    </>
  )
}

// The dialog content
function CampaignUpdateDialog({ 
  open, 
  onOpenChange, 
  update 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  update: typeof CAMPAIGN_UPDATES[string]
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-hidden">
        <DialogHeader className="pb-4 border-b border-border">
          <DialogTitle className="text-lg font-semibold">{update.title}</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">{update.date}</p>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(85vh-140px)] pr-2 py-4">
          {update.sections.map((section, idx) => (
            <div key={idx}>
              {section.heading && (
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
                  {section.heading}
                </p>
              )}
              <div className="space-y-2">
                {section.content.map((item, i) => (
                  <p key={i} className="text-sm text-foreground/90 leading-relaxed">
                    {item}
                  </p>
                ))}
              </div>
            </div>
          ))}

          {update.contentFolders && update.contentFolders.length > 0 && (
            <div className="pt-4 border-t border-border">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
                Content
              </p>
              <div className="flex flex-wrap gap-2">
                {update.contentFolders.map((folder, idx) => (
                  <a
                    key={idx}
                    href={folder.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded border border-border bg-muted/50 hover:bg-muted transition-colors text-sm"
                  >
                    {folder.label}
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Check helper for conditional rendering
export function campaignHasUpdate(campaignTitle: string): boolean {
  return getUpdateForCampaign(campaignTitle) !== null
}

// Legacy exports for backwards compatibility
export const CampaignAnnouncementBanner = CampaignUpdateCard
export const CampaignAnnouncementNotification = ({ campaignTitle, onClick }: { campaignTitle: string, onClick?: () => void }) => {
  const update = getUpdateForCampaign(campaignTitle)
  if (!update) return null
  
  return (
    <button
      onClick={onClick}
      className="absolute -top-1 -right-1 z-10 w-5 h-5 bg-foreground text-background rounded-full flex items-center justify-center text-[10px] font-medium"
      title="Team update available"
    >
      !
    </button>
  )
}
export const campaignHasAnnouncement = campaignHasUpdate
