"use client"

import Link from "next/link"
import { Link2 } from "lucide-react"
import { Card, CardContent } from "../../../../components/ui/card"
import { Button } from "../../../../components/ui/button"


export default function SocialAccountsPage() {
  return (
    <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-light text-white mb-2">Social Accounts</h1>
        <p className="text-muted-foreground">Connect your social media accounts from your profile page.</p>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-8 text-center">
          <Link2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Manage from Profile</h3>
            <p className="text-muted-foreground mb-6">
            Use the social account connection section in your profile to connect and manage your accounts.
          </p>
          <Link href="/clippers/dashboard/profile">
            <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted">
              Go to Profile
              </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
