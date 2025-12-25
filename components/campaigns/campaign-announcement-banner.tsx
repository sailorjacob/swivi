"use client"

import { useState, useEffect } from "react"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ExternalLink, FileText, X } from "lucide-react"

// Storage key for tracking which updates have been seen
const SEEN_UPDATES_KEY = "swivi-seen-updates"

// Campaign updates configuration
// This could later be moved to database
// Add new campaign updates here as needed - they'll automatically show for matching campaigns
export const CAMPAIGN_UPDATES: Record<string, {
  id: string
  title: string
  date: string
  campaignMatch: (title: string) => boolean
  sections: {
    heading?: string
    content: string[]
  }[]
  contentFolders?: { label: string; url: string }[]
}> = {
  // No active campaign updates at this time
  // Add new updates here when needed, using this format:
  // "update-id": {
  //   id: "update-id",
  //   title: "Update Title",
  //   date: "Month Day, Year",
  //   campaignMatch: (title: string) => title.toLowerCase().includes("campaign name"),
  //   sections: [
  //     { heading: "Section Title", content: ["Point 1", "Point 2"] }
  //   ],
  //   contentFolders: [{ label: "Folder Name", url: "https://..." }]
  // }
}

// Get all updates as array
export function getAllUpdates() {
  return Object.values(CAMPAIGN_UPDATES)
}

// Get update for a specific campaign
export function getUpdateForCampaign(campaignTitle: string) {
  return Object.values(CAMPAIGN_UPDATES).find(u => u.campaignMatch(campaignTitle)) || null
}

// Check if update has been seen
export function hasSeenUpdate(updateId: string): boolean {
  if (typeof window === "undefined") return false
  try {
    const seen = localStorage.getItem(SEEN_UPDATES_KEY)
    if (!seen) return false
    const parsed = JSON.parse(seen)
    return !!parsed[updateId]
  } catch {
    return false
  }
}

// Mark update as seen
export function markUpdateSeen(updateId: string) {
  if (typeof window === "undefined") return
  try {
    const seen = localStorage.getItem(SEEN_UPDATES_KEY)
    const parsed = seen ? JSON.parse(seen) : {}
    parsed[updateId] = Date.now()
    localStorage.setItem(SEEN_UPDATES_KEY, JSON.stringify(parsed))
  } catch {
    // Ignore
  }
}

// Clear seen status (for testing or reset)
export function clearSeenUpdates() {
  if (typeof window === "undefined") return
  localStorage.removeItem(SEEN_UPDATES_KEY)
}

interface CampaignUpdateProps {
  campaignTitle: string
}

// Button variant for campaign header
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

// Auto-open version for campaign detail page
export function CampaignUpdateAutoOpen({ campaignTitle }: CampaignUpdateProps) {
  const [open, setOpen] = useState(false)
  const update = getUpdateForCampaign(campaignTitle)
  
  useEffect(() => {
    if (update && !hasSeenUpdate(update.id)) {
      // Small delay so page loads first
      const timer = setTimeout(() => setOpen(true), 500)
      return () => clearTimeout(timer)
    }
  }, [update])

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen && update) {
      markUpdateSeen(update.id)
    }
  }
  
  if (!update) return null

  return (
    <CampaignUpdateDialog 
      open={open} 
      onOpenChange={handleClose} 
      update={update}
    />
  )
}

// Global popup for dashboard login
export function TeamUpdatePopup({ hasSubmittedToCampaign }: { hasSubmittedToCampaign?: boolean }) {
  const [open, setOpen] = useState(false)
  const [currentUpdate, setCurrentUpdate] = useState<typeof CAMPAIGN_UPDATES[string] | null>(null)

  useEffect(() => {
    // Only show if user has submitted to relevant campaign
    if (!hasSubmittedToCampaign) return

    // Find an update they haven't seen
    const unseenUpdate = Object.values(CAMPAIGN_UPDATES).find(u => !hasSeenUpdate(u.id))
    
    if (unseenUpdate) {
      setCurrentUpdate(unseenUpdate)
      // Delay popup slightly after page load
      const timer = setTimeout(() => setOpen(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [hasSubmittedToCampaign])

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen && currentUpdate) {
      markUpdateSeen(currentUpdate.id)
    }
  }

  if (!currentUpdate) return null

  return (
    <CampaignUpdateDialog 
      open={open} 
      onOpenChange={handleClose} 
      update={currentUpdate}
    />
  )
}

// Card for profile page messages section
export function TeamUpdateCard({ update, onRead }: { 
  update: typeof CAMPAIGN_UPDATES[string]
  onRead?: () => void 
}) {
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    setSeen(hasSeenUpdate(update.id))
  }, [update.id])

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      markUpdateSeen(update.id)
      setSeen(true)
      onRead?.()
    }
  }

  return (
    <>
      <div 
        onClick={() => setOpen(true)}
        className={`p-4 border border-border rounded-lg transition-colors cursor-pointer ${
          seen ? 'bg-card hover:bg-muted/30' : 'bg-muted/30 hover:bg-muted/50'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <FileText className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{update.title}</p>
                {!seen && (
                  <span className="w-2 h-2 bg-foreground rounded-full flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{update.date}</p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground flex-shrink-0">→</span>
        </div>
      </div>
      
      <CampaignUpdateDialog 
        open={open} 
        onOpenChange={handleClose} 
        update={update}
      />
    </>
  )
}

// Profile page messages section
export function ProfileMessagesSection() {
  const updates = getAllUpdates()
  const [, forceUpdate] = useState(0)
  
  if (updates.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Team Updates
        </h3>
        <span className="text-xs text-muted-foreground">
          {updates.filter(u => !hasSeenUpdate(u.id)).length} unread
        </span>
      </div>
      <div className="space-y-2">
        {updates.map(update => (
          <TeamUpdateCard 
            key={update.id} 
            update={update} 
            onRead={() => forceUpdate(n => n + 1)}
          />
        ))}
      </div>
    </div>
  )
}

// The dialog content
export function CampaignUpdateDialog({ 
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
export const CampaignAnnouncementBanner = TeamUpdateCard
export const CampaignAnnouncementNotification = ({ campaignTitle, onClick }: { campaignTitle: string, onClick?: () => void }) => {
  const update = getUpdateForCampaign(campaignTitle)
  const [seen, setSeen] = useState(true)
  
  useEffect(() => {
    if (update) {
      setSeen(hasSeenUpdate(update.id))
    }
  }, [update])
  
  if (!update || seen) return null
  
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
