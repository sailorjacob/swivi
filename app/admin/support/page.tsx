"use client"

import { useState, useEffect } from "react"
import { useSession } from "@/lib/supabase-auth-provider"
import { useRouter } from "next/navigation"
import { authenticatedFetch } from "@/lib/supabase-browser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Send,
  Image as ImageIcon,
  X,
  ArrowLeft,
  Reply,
  User
} from "lucide-react"
import toast from "react-hot-toast"
import Link from "next/link"

interface SupportTicket {
  id: string
  category: string
  subject: string
  message: string
  imageUrl: string | null
  status: string
  adminResponse: string | null
  respondedAt: string | null
  userReply: string | null
  userReplyAt: string | null
  createdAt: string
  users: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

export default function AdminSupportPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [response, setResponse] = useState('')
  const [responseStatus, setResponseStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null)

  useEffect(() => {
    if (authStatus === "loading") return
    if (!session?.user) {
      router.push("/clippers/login")
      return
    }
    if (session.user.role !== "ADMIN") {
      router.push("/clippers/dashboard")
      return
    }
    fetchTickets()
  }, [session, authStatus, router])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const url = filter === 'all' 
        ? '/api/support-tickets' 
        : `/api/support-tickets?status=${filter}`
      const response = await authenticatedFetch(url)
      if (response.ok) {
        const data = await response.json()
        setTickets(data)
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
      toast.error('Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchTickets()
    }
  }, [filter])

  const handleRespond = async () => {
    if (!selectedTicket) return
    if (!response.trim() && !responseStatus) {
      toast.error('Please enter a response or change status')
      return
    }

    setSubmitting(true)
    try {
      const res = await authenticatedFetch(`/api/support-tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          adminResponse: response.trim() || undefined,
          status: responseStatus || undefined
        })
      })

      if (res.ok) {
        toast.success('Ticket updated')
        setSelectedTicket(null)
        setResponse('')
        setResponseStatus('')
        fetchTickets()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update ticket')
      }
    } catch (error) {
      toast.error('Failed to update ticket')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="outline" className="text-xs">Open</Badge>
      case 'IN_PROGRESS':
        return <Badge variant="outline" className="text-xs">In Progress</Badge>
      case 'RESOLVED':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">Resolved</Badge>
      case 'CLOSED':
        return <Badge variant="outline" className="text-xs text-muted-foreground">Closed</Badge>
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>
    }
  }

  const getCategoryBadge = (category: string) => {
    return (
      <Badge variant="outline" className="text-xs bg-muted/50">
        {category.charAt(0) + category.slice(1).toLowerCase()}
      </Badge>
    )
  }

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const openTickets = tickets.filter(t => t.status === 'OPEN').length
  const inProgressTickets = tickets.filter(t => t.status === 'IN_PROGRESS').length

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Support Tickets</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {openTickets} open, {inProgressTickets} in progress
            </p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {['all', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
              filter === status
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {status === 'all' ? 'All' : status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No tickets found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card 
              key={ticket.id} 
              className={`bg-card border-border cursor-pointer hover:border-foreground/20 transition-colors ${
                ticket.status === 'OPEN' ? 'border-l-2 border-l-foreground' : ''
              }`}
              onClick={() => {
                setSelectedTicket(ticket)
                setResponse(ticket.adminResponse || '')
                setResponseStatus(ticket.status)
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarImage src={ticket.users.image || ''} />
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        {ticket.users.name?.[0] || ticket.users.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-foreground truncate">
                          {ticket.users.name || ticket.users.email.split('@')[0]}
                        </span>
                        {getCategoryBadge(ticket.category)}
                        {getStatusBadge(ticket.status)}
                      </div>
                      <h3 className="font-medium text-foreground mb-1">{ticket.subject}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{ticket.message}</p>
                      {(ticket.imageUrl || ticket.userReply) && (
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {ticket.imageUrl && (
                            <span className="flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              Attachment
                            </span>
                          )}
                          {ticket.userReply && (
                            <span className="flex items-center gap-1 text-primary">
                              <Reply className="w-3 h-3" />
                              User replied
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="sm:max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  {getCategoryBadge(selectedTicket.category)}
                  {getStatusBadge(selectedTicket.status)}
                </div>
                <DialogTitle className="text-foreground">{selectedTicket.subject}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* User Info */}
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedTicket.users.image || ''} />
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      {selectedTicket.users.name?.[0] || selectedTicket.users.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">
                      {selectedTicket.users.name || 'No name'}
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedTicket.users.email}</p>
                  </div>
                  <div className="ml-auto text-xs text-muted-foreground">
                    {new Date(selectedTicket.createdAt).toLocaleString()}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Message</h4>
                  <p className="text-foreground whitespace-pre-wrap">{selectedTicket.message}</p>
                </div>

                {/* Image */}
                {selectedTicket.imageUrl && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Attachment</h4>
                    <img 
                      src={selectedTicket.imageUrl} 
                      alt="Ticket attachment"
                      className="max-w-full h-auto max-h-64 rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setImageModalUrl(selectedTicket.imageUrl)}
                    />
                  </div>
                )}

                {/* Conversation Thread */}
                {selectedTicket.adminResponse && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Conversation</h4>
                    
                    {/* Admin's Response */}
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Your Response
                      </p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{selectedTicket.adminResponse}</p>
                      {selectedTicket.respondedAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(selectedTicket.respondedAt).toLocaleString()}
                        </p>
                      )}
                    </div>

                    {/* User's Reply */}
                    {selectedTicket.userReply && (
                      <div className="p-3 bg-muted/30 border border-border/50 rounded-lg">
                        <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          User Reply
                        </p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{selectedTicket.userReply}</p>
                        {selectedTicket.userReplyAt && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(selectedTicket.userReplyAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Response Form */}
                <div className="border-t border-border pt-4">
                  <h4 className="text-sm font-medium text-foreground mb-3">
                    {selectedTicket.adminResponse ? 'Update Response' : 'Send Response'}
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-muted-foreground">Status</label>
                      <Select value={responseStatus} onValueChange={setResponseStatus}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Change status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OPEN">Open</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="RESOLVED">Resolved</SelectItem>
                          <SelectItem value="CLOSED">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm text-muted-foreground">Response Message</label>
                      <Textarea
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        placeholder="Type your response..."
                        className="mt-1 min-h-[100px]"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedTicket(null)}
                        disabled={submitting}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleRespond}
                        disabled={submitting}
                        className="flex-1"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            {selectedTicket.adminResponse ? 'Update' : 'Send Response'}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Modal */}
      <Dialog open={!!imageModalUrl} onOpenChange={() => setImageModalUrl(null)}>
        <DialogContent className="sm:max-w-4xl bg-card border-border p-2">
          {imageModalUrl && (
            <img 
              src={imageModalUrl} 
              alt="Full size attachment"
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export const dynamic = 'force-dynamic'

