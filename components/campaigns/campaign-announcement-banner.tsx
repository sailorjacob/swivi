"use client"

import { useState, useEffect } from "react"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ExternalLink, FileText, Loader2 } from "lucide-react"
import { authenticatedFetch } from "@/lib/supabase-browser"

// Storage key for tracking which updates have been seen
const SEEN_UPDATES_KEY = "swivi-seen-updates"

// Team Update type (matches database schema)
export interface TeamUpdate {
  title: string
  date: string
  sections: {
    heading?: string
    content: string[]
  }[]
  contentFolders?: { label: string; url: string }[]
}

// Check if update has been seen (by campaignId)
export function hasSeenUpdate(campaignId: string): boolean {
  if (typeof window === "undefined") return false
  try {
    const seen = localStorage.getItem(SEEN_UPDATES_KEY)
    if (!seen) return false
    const parsed = JSON.parse(seen)
    return !!parsed[campaignId]
  } catch {
    return false
  }
}

// Mark update as seen (by campaignId)
export function markUpdateSeen(campaignId: string) {
  if (typeof window === "undefined") return
  try {
    const seen = localStorage.getItem(SEEN_UPDATES_KEY)
    const parsed = seen ? JSON.parse(seen) : {}
    parsed[campaignId] = Date.now()
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

interface CampaignUpdateButtonProps {
  campaignId: string
  campaignTitle?: string
}

// Button variant for campaign header - fetches update from database
export function CampaignUpdateButton({ campaignId, campaignTitle }: CampaignUpdateButtonProps) {
  const [open, setOpen] = useState(false)
  const [update, setUpdate] = useState<TeamUpdate | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUpdate() {
      try {
        const response = await authenticatedFetch(`/api/campaigns/${campaignId}/team-update`)
        if (response.ok) {
          const data = await response.json()
          setUpdate(data.teamUpdate || null)
        }
      } catch (error) {
        console.error("Error fetching team update:", error)
      } finally {
        setLoading(false)
      }
    }
    
    if (campaignId) {
      fetchUpdate()
    }
  }, [campaignId])
  
  // Don't show button if no update exists
  if (loading || !update) return null

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
        onOpenChange={(isOpen) => {
          setOpen(isOpen)
          if (!isOpen) {
            markUpdateSeen(campaignId)
          }
        }} 
        update={update}
      />
    </>
  )
}

// Auto-open version for campaign detail page
export function CampaignUpdateAutoOpen({ campaignId }: { campaignId: string }) {
  const [open, setOpen] = useState(false)
  const [update, setUpdate] = useState<TeamUpdate | null>(null)

  useEffect(() => {
    async function fetchAndMaybeShow() {
      try {
        const response = await authenticatedFetch(`/api/campaigns/${campaignId}/team-update`)
        if (response.ok) {
          const data = await response.json()
          if (data.teamUpdate && !hasSeenUpdate(campaignId)) {
            setUpdate(data.teamUpdate)
            // Small delay so page loads first
            setTimeout(() => setOpen(true), 500)
          }
        }
      } catch (error) {
        console.error("Error fetching team update:", error)
      }
    }
    
    if (campaignId) {
      fetchAndMaybeShow()
    }
  }, [campaignId])

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      markUpdateSeen(campaignId)
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

// The dialog content
export function CampaignUpdateDialog({ 
  open, 
  onOpenChange, 
  update 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  update: TeamUpdate
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

// Check helper for conditional rendering (now requires async fetch, so less useful)
// Kept for backwards compatibility but recommend using CampaignUpdateButton directly
export function campaignHasUpdate(campaignTitle: string): boolean {
  // This is deprecated - updates are now fetched from database
  // The CampaignUpdateButton handles showing/hiding itself based on data
  return false
}

// Legacy exports for backwards compatibility - these now do nothing
export const CAMPAIGN_UPDATES: Record<string, any> = {}
export function getAllUpdates() { return [] }
export function getUpdateForCampaign(campaignTitle: string) { return null }
export const TeamUpdatePopup = ({ hasSubmittedToCampaign }: { hasSubmittedToCampaign?: boolean }) => null
export const ProfileMessagesSection = () => null
export const TeamUpdateCard = ({ update, onRead }: { update: any, onRead?: () => void }) => null
export const CampaignAnnouncementBanner = TeamUpdateCard
export const CampaignAnnouncementNotification = ({ campaignTitle, onClick }: { campaignTitle: string, onClick?: () => void }) => null
export const campaignHasAnnouncement = campaignHasUpdate
