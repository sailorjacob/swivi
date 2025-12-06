"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { HelpCircle, ArrowRight, Eye, EyeOff, FlaskConical, Archive } from "lucide-react"

export function CampaignStatusGuide() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <HelpCircle className="w-4 h-4" />
          Status Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Campaign Status & Visibility Guide</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8 text-sm mt-4">
          {/* Status Overview */}
          <section>
            <h3 className="font-semibold text-base mb-3">Campaign Statuses</h3>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 text-xs border border-dashed rounded">DRAFT</span>
                  <span className="font-medium">Draft</span>
                </div>
                <p className="text-muted-foreground">Work in progress. Hidden from creators. No submissions accepted. Use this to prepare campaigns before launch.</p>
              </div>
              
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 text-xs border rounded">SCHEDULED</span>
                  <span className="font-medium">Scheduled</span>
                </div>
                <p className="text-muted-foreground">Visible to creators but no submissions accepted until the launch date. Creators can see it's "coming soon".</p>
              </div>
              
              <div className="p-3 border rounded-lg bg-foreground/5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 text-xs bg-foreground text-background rounded">ACTIVE</span>
                  <span className="font-medium">Active (Live)</span>
                </div>
                <p className="text-muted-foreground">Fully live. Visible to creators. Accepting submissions. View tracking is running. Earnings are being calculated.</p>
              </div>
              
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 text-xs border-2 rounded">PAUSED</span>
                  <span className="font-medium">Paused</span>
                </div>
                <p className="text-muted-foreground">Temporarily stopped. Hidden from new creators. Existing submissions still tracked but no new submissions accepted.</p>
              </div>
              
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 text-xs bg-muted rounded">COMPLETED</span>
                  <span className="font-medium">Completed</span>
                </div>
                <p className="text-muted-foreground">Campaign ended (budget exhausted or manually completed). Shows in creators' "completed" tab. No new submissions. View tracking stopped.</p>
              </div>
              
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 text-xs bg-muted line-through rounded">CANCELLED</span>
                  <span className="font-medium">Cancelled</span>
                </div>
                <p className="text-muted-foreground">Campaign terminated. Hidden from creators. No submissions or tracking. Can be moved back to DRAFT for editing.</p>
              </div>
            </div>
          </section>

          {/* Status Transitions */}
          <section>
            <h3 className="font-semibold text-base mb-3">Valid Status Transitions</h3>
            <div className="p-4 bg-muted/30 rounded-lg font-mono text-xs space-y-2">
              <div className="flex items-center gap-2">
                <span>DRAFT</span>
                <ArrowRight className="w-3 h-3" />
                <span>SCHEDULED, ACTIVE, or CANCELLED</span>
              </div>
              <div className="flex items-center gap-2">
                <span>SCHEDULED</span>
                <ArrowRight className="w-3 h-3" />
                <span>DRAFT, ACTIVE, or CANCELLED</span>
              </div>
              <div className="flex items-center gap-2">
                <span>ACTIVE</span>
                <ArrowRight className="w-3 h-3" />
                <span>PAUSED, COMPLETED, or CANCELLED</span>
              </div>
              <div className="flex items-center gap-2">
                <span>PAUSED</span>
                <ArrowRight className="w-3 h-3" />
                <span>ACTIVE, COMPLETED, or CANCELLED</span>
              </div>
              <div className="flex items-center gap-2">
                <span>COMPLETED</span>
                <ArrowRight className="w-3 h-3" />
                <span>ACTIVE (reactivate with more budget)</span>
              </div>
              <div className="flex items-center gap-2">
                <span>CANCELLED</span>
                <ArrowRight className="w-3 h-3" />
                <span>DRAFT (to edit and relaunch)</span>
              </div>
            </div>
          </section>

          {/* Visibility Flags */}
          <section>
            <h3 className="font-semibold text-base mb-3">Visibility Flags</h3>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <EyeOff className="w-4 h-4" />
                  <span className="font-medium">Hidden</span>
                </div>
                <p className="text-muted-foreground mb-2">Campaign is invisible to creators but still fully functional.</p>
                <ul className="text-muted-foreground list-disc list-inside space-y-1">
                  <li>Creators cannot see or find this campaign</li>
                  <li>If ACTIVE, submissions ARE accepted (admin must share direct link)</li>
                  <li>View tracking IS running normally</li>
                  <li>Earnings ARE being calculated</li>
                  <li><strong>Use case:</strong> Private campaigns, invite-only testing</li>
                </ul>
              </div>
              
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <FlaskConical className="w-4 h-4" />
                  <span className="font-medium">Test Campaign</span>
                </div>
                <p className="text-muted-foreground mb-2">Flagged as test data - excluded from analytics and tracking.</p>
                <ul className="text-muted-foreground list-disc list-inside space-y-1">
                  <li>Hidden from creators (like hidden flag)</li>
                  <li>If ACTIVE, submissions ARE accepted</li>
                  <li>View tracking is DISABLED (won't track views)</li>
                  <li>Excluded from all analytics and reports</li>
                  <li>Can be permanently deleted (hard delete)</li>
                  <li><strong>Use case:</strong> Testing submission flow without affecting data</li>
                </ul>
              </div>
              
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Archive className="w-4 h-4" />
                  <span className="font-medium">Archived (Soft Deleted)</span>
                </div>
                <p className="text-muted-foreground mb-2">Campaign removed but data preserved.</p>
                <ul className="text-muted-foreground list-disc list-inside space-y-1">
                  <li>Hidden from everyone (admin and creators)</li>
                  <li>No submissions, no tracking</li>
                  <li>All historical data preserved</li>
                  <li>Can be restored back to DRAFT</li>
                  <li><strong>Use case:</strong> Removing old campaigns while keeping records</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Testing Guide */}
          <section className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold text-base mb-3">🧪 How to Test Submissions (Ghost Campaign)</h3>
            <p className="text-muted-foreground mb-3">
              To test the submission flow without affecting real data or being visible to creators:
            </p>
            <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
              <li>Create a new campaign with any title (e.g., "Test Campaign - Delete Later")</li>
              <li>Set status to <strong>ACTIVE</strong></li>
              <li>Toggle the <strong>Test Campaign</strong> flag ON (flask icon)</li>
              <li>Save the campaign</li>
              <li>The campaign is now:
                <ul className="list-disc list-inside ml-6 mt-1">
                  <li>Invisible to all creators</li>
                  <li>Accepting submissions (admins can submit via direct URL)</li>
                  <li>NOT being tracked for views (saves API calls)</li>
                  <li>NOT included in any analytics</li>
                </ul>
              </li>
              <li>When done testing, you can <strong>permanently delete</strong> the test campaign</li>
            </ol>
            <p className="text-muted-foreground mt-3 text-xs">
              Note: Regular campaigns with earnings cannot be permanently deleted - they are soft-deleted (archived) to preserve financial records.
            </p>
          </section>

          {/* Quick Reference Table */}
          <section>
            <h3 className="font-semibold text-base mb-3">Quick Reference</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">State</th>
                    <th className="text-left py-2 px-2">Visible?</th>
                    <th className="text-left py-2 px-2">Submissions?</th>
                    <th className="text-left py-2 px-2">Tracking?</th>
                    <th className="text-left py-2 px-2">Analytics?</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b">
                    <td className="py-2 px-2">DRAFT</td>
                    <td className="py-2 px-2">❌ No</td>
                    <td className="py-2 px-2">❌ No</td>
                    <td className="py-2 px-2">❌ No</td>
                    <td className="py-2 px-2">❌ No</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-2">SCHEDULED</td>
                    <td className="py-2 px-2">✅ Yes</td>
                    <td className="py-2 px-2">❌ No</td>
                    <td className="py-2 px-2">❌ No</td>
                    <td className="py-2 px-2">❌ No</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-2">ACTIVE</td>
                    <td className="py-2 px-2">✅ Yes</td>
                    <td className="py-2 px-2">✅ Yes</td>
                    <td className="py-2 px-2">✅ Yes</td>
                    <td className="py-2 px-2">✅ Yes</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-2">ACTIVE + Hidden</td>
                    <td className="py-2 px-2">❌ No</td>
                    <td className="py-2 px-2">✅ Yes*</td>
                    <td className="py-2 px-2">✅ Yes</td>
                    <td className="py-2 px-2">✅ Yes</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-2">ACTIVE + Test</td>
                    <td className="py-2 px-2">❌ No</td>
                    <td className="py-2 px-2">✅ Yes*</td>
                    <td className="py-2 px-2">❌ No</td>
                    <td className="py-2 px-2">❌ No</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-2">PAUSED</td>
                    <td className="py-2 px-2">❌ No</td>
                    <td className="py-2 px-2">❌ No</td>
                    <td className="py-2 px-2">✅ Yes</td>
                    <td className="py-2 px-2">✅ Yes</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-2">COMPLETED</td>
                    <td className="py-2 px-2">✅ Yes**</td>
                    <td className="py-2 px-2">❌ No</td>
                    <td className="py-2 px-2">❌ No</td>
                    <td className="py-2 px-2">✅ Yes</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-2">CANCELLED</td>
                    <td className="py-2 px-2">❌ No</td>
                    <td className="py-2 px-2">❌ No</td>
                    <td className="py-2 px-2">❌ No</td>
                    <td className="py-2 px-2">✅ Yes</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2">Archived</td>
                    <td className="py-2 px-2">❌ No</td>
                    <td className="py-2 px-2">❌ No</td>
                    <td className="py-2 px-2">❌ No</td>
                    <td className="py-2 px-2">❌ No</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              * Admin must share direct campaign URL for submissions<br />
              ** Shows in creators' "completed campaigns" tab
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}

