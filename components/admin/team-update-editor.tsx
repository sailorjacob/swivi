"use client"

import { useState, useEffect } from "react"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { authenticatedFetch } from "@/lib/supabase-browser"
import { FileText, Plus, Trash2, Loader2, ExternalLink } from "lucide-react"
import toast from "react-hot-toast"

interface TeamUpdate {
  title: string
  date: string
  sections: {
    heading?: string
    content: string[]
  }[]
  contentFolders?: { label: string; url: string }[]
}

interface TeamUpdateEditorProps {
  campaignId: string
  campaignTitle: string
  currentUpdate: TeamUpdate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

export function TeamUpdateEditor({
  campaignId,
  campaignTitle,
  currentUpdate,
  open,
  onOpenChange,
  onSave
}: TeamUpdateEditorProps) {
  const [saving, setSaving] = useState(false)
  const [update, setUpdate] = useState<TeamUpdate>({
    title: "",
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    sections: [{ heading: "", content: [""] }],
    contentFolders: []
  })

  // Initialize form with current update or defaults
  useEffect(() => {
    if (currentUpdate) {
      setUpdate(currentUpdate)
    } else {
      setUpdate({
        title: `${campaignTitle} Team Update`,
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        sections: [{ heading: "", content: [""] }],
        contentFolders: []
      })
    }
  }, [currentUpdate, campaignTitle, open])

  const handleSave = async () => {
    // Validate
    if (!update.title.trim()) {
      toast.error("Title is required")
      return
    }
    if (!update.date.trim()) {
      toast.error("Date is required")
      return
    }
    if (update.sections.length === 0 || !update.sections.some(s => s.content.some(c => c.trim()))) {
      toast.error("At least one section with content is required")
      return
    }

    setSaving(true)
    try {
      // Clean up the update - remove empty content lines and empty sections
      const cleanedUpdate: TeamUpdate = {
        ...update,
        sections: update.sections
          .map(s => ({
            ...s,
            heading: s.heading?.trim() || undefined,
            content: s.content.filter(c => c.trim())
          }))
          .filter(s => s.content.length > 0),
        contentFolders: update.contentFolders?.filter(f => f.label.trim() && f.url.trim()) || []
      }

      const response = await authenticatedFetch(`/api/admin/campaigns/${campaignId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamUpdate: cleanedUpdate })
      })

      if (response.ok) {
        toast.success("Team Update saved successfully!")
        onOpenChange(false)
        onSave()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to save team update")
      }
    } catch (error) {
      console.error("Error saving team update:", error)
      toast.error("Failed to save team update")
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    if (!confirm("Remove the Team Update from this campaign? Clippers will no longer see it.")) {
      return
    }

    setSaving(true)
    try {
      const response = await authenticatedFetch(`/api/admin/campaigns/${campaignId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamUpdate: null })
      })

      if (response.ok) {
        toast.success("Team Update removed")
        onOpenChange(false)
        onSave()
      } else {
        toast.error("Failed to remove team update")
      }
    } catch (error) {
      console.error("Error removing team update:", error)
      toast.error("Failed to remove team update")
    } finally {
      setSaving(false)
    }
  }

  const addSection = () => {
    setUpdate({
      ...update,
      sections: [...update.sections, { heading: "", content: [""] }]
    })
  }

  const removeSection = (index: number) => {
    setUpdate({
      ...update,
      sections: update.sections.filter((_, i) => i !== index)
    })
  }

  const updateSection = (index: number, field: 'heading' | 'content', value: string | string[]) => {
    const newSections = [...update.sections]
    if (field === 'heading') {
      newSections[index] = { ...newSections[index], heading: value as string }
    } else {
      newSections[index] = { ...newSections[index], content: value as string[] }
    }
    setUpdate({ ...update, sections: newSections })
  }

  const addContentLine = (sectionIndex: number) => {
    const newSections = [...update.sections]
    newSections[sectionIndex].content.push("")
    setUpdate({ ...update, sections: newSections })
  }

  const updateContentLine = (sectionIndex: number, lineIndex: number, value: string) => {
    const newSections = [...update.sections]
    newSections[sectionIndex].content[lineIndex] = value
    setUpdate({ ...update, sections: newSections })
  }

  const removeContentLine = (sectionIndex: number, lineIndex: number) => {
    const newSections = [...update.sections]
    newSections[sectionIndex].content = newSections[sectionIndex].content.filter((_, i) => i !== lineIndex)
    setUpdate({ ...update, sections: newSections })
  }

  const addContentFolder = () => {
    setUpdate({
      ...update,
      contentFolders: [...(update.contentFolders || []), { label: "", url: "" }]
    })
  }

  const updateContentFolder = (index: number, field: 'label' | 'url', value: string) => {
    const newFolders = [...(update.contentFolders || [])]
    newFolders[index] = { ...newFolders[index], [field]: value }
    setUpdate({ ...update, contentFolders: newFolders })
  }

  const removeContentFolder = (index: number) => {
    setUpdate({
      ...update,
      contentFolders: (update.contentFolders || []).filter((_, i) => i !== index)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {currentUpdate ? "Edit Team Update" : "Create Team Update"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            For: {campaignTitle}
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title and Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="update-title">Update Title *</Label>
              <Input
                id="update-title"
                value={update.title}
                onChange={(e) => setUpdate({ ...update, title: e.target.value })}
                placeholder="e.g., Team Update - Week 2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-date">Date *</Label>
              <Input
                id="update-date"
                value={update.date}
                onChange={(e) => setUpdate({ ...update, date: e.target.value })}
                placeholder="e.g., December 25, 2025"
              />
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Sections *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSection}>
                <Plus className="w-4 h-4 mr-1" /> Add Section
              </Button>
            </div>

            {update.sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={section.heading || ""}
                    onChange={(e) => updateSection(sectionIndex, 'heading', e.target.value)}
                    placeholder="Section heading (optional)"
                    className="flex-1"
                  />
                  {update.sections.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSection(sectionIndex)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  {section.content.map((line, lineIndex) => (
                    <div key={lineIndex} className="flex items-start gap-2">
                      <Textarea
                        value={line}
                        onChange={(e) => updateContentLine(sectionIndex, lineIndex, e.target.value)}
                        placeholder="Content point..."
                        className="flex-1 min-h-[60px]"
                      />
                      {section.content.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeContentLine(sectionIndex, lineIndex)}
                          className="text-muted-foreground hover:text-destructive mt-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addContentLine(sectionIndex)}
                    className="text-muted-foreground"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add point
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Content Folders */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Content Folders (optional)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addContentFolder}>
                <Plus className="w-4 h-4 mr-1" /> Add Folder Link
              </Button>
            </div>

            {(update.contentFolders || []).map((folder, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={folder.label}
                  onChange={(e) => updateContentFolder(index, 'label', e.target.value)}
                  placeholder="Label (e.g., New Content)"
                  className="w-1/3"
                />
                <Input
                  value={folder.url}
                  onChange={(e) => updateContentFolder(index, 'url', e.target.value)}
                  placeholder="URL (e.g., https://drive.google.com/...)"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeContentFolder(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <div>
            {currentUpdate && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleRemove}
                disabled={saving}
              >
                Remove Update
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Team Update"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Button to open the Team Update editor
export function TeamUpdateEditorButton({
  campaignId,
  campaignTitle,
  currentUpdate,
  onSave
}: {
  campaignId: string
  campaignTitle: string
  currentUpdate: any
  onSave: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className={currentUpdate ? "border-green-500/50 text-green-600 dark:text-green-400" : ""}
      >
        <FileText className="w-4 h-4 mr-1" />
        {currentUpdate ? "Edit Update" : "Add Update"}
      </Button>

      <TeamUpdateEditor
        campaignId={campaignId}
        campaignTitle={campaignTitle}
        currentUpdate={currentUpdate}
        open={open}
        onOpenChange={setOpen}
        onSave={onSave}
      />
    </>
  )
}

