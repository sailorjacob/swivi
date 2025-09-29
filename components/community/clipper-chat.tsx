"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Users, Hash, Lock, Bell, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface Message {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  timestamp: Date
  channel: string
}

interface Channel {
  id: string
  name: string
  description: string
  isPrivate: boolean
  memberCount: number
}

const channels: Channel[] = [
  {
    id: "general",
    name: "general",
    description: "General discussion for all clippers",
    isPrivate: false,
    memberCount: 1234
  },
  {
    id: "viral-strategies",
    name: "viral-strategies",
    description: "Share and discuss viral content strategies",
    isPrivate: false,
    memberCount: 892
  },
  {
    id: "earnings-flex",
    name: "earnings-flex",
    description: "Share your earnings milestones!",
    isPrivate: false,
    memberCount: 567
  },
  {
    id: "vip-lounge",
    name: "vip-lounge",
    description: "Exclusive channel for $30K+ earners",
    isPrivate: true,
    memberCount: 45
  }
]

// Mock messages - in production, these would come from Firebase
const mockMessages: Message[] = [
  {
    id: "1",
    userId: "user1",
    userName: "Alex Thompson",
    content: "Just hit 1M views on my latest clip! 🎉",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    channel: "general"
  },
  {
    id: "2",
    userId: "user2",
    userName: "Sarah Kim",
    content: "Congrats! What niche are you in?",
    timestamp: new Date(Date.now() - 1000 * 60 * 4),
    channel: "general"
  },
  {
    id: "3",
    userId: "user1",
    userName: "Alex Thompson",
    content: "Tech reviews! The new iPhone clips are doing crazy numbers",
    timestamp: new Date(Date.now() - 1000 * 60 * 3),
    channel: "general"
  }
]

export function ClipperChat() {
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [newMessage, setNewMessage] = useState("")
  const [activeChannel, setActiveChannel] = useState("general")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message: Message = {
      id: Date.now().toString(),
      userId: "currentUser",
      userName: "You",
      content: newMessage,
      timestamp: new Date(),
      channel: activeChannel
    }

    setMessages([...messages, message])
    setNewMessage("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true
    }).format(date)
  }

  const filteredMessages = messages.filter(msg => msg.channel === activeChannel)

  return (
    <section className="py-20 md:py-32">
      <div className="max-width-wrapper section-padding">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-6xl"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light mb-4">
              Clipper Community Chat
            </h2>
            <p className="text-lg text-muted-foreground">
              Connect with fellow creators and share strategies
            </p>
          </div>

          <Card className="overflow-hidden">
            <div className="grid md:grid-cols-[250px_1fr] h-[600px]">
              {/* Sidebar */}
              <div className="border-r bg-muted/10">
                <div className="p-4">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Channels
                  </h3>
                  <div className="space-y-1">
                    {channels.map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() => setActiveChannel(channel.id)}
                        className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-2 ${
                          activeChannel === channel.id
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted"
                        }`}
                      >
                        {channel.isPrivate ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <Hash className="h-4 w-4" />
                        )}
                        <span className="flex-1">{channel.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {channel.memberCount}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 border-t">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Online Now
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full" />
                      <span className="text-sm">234 members</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex flex-col">
                {/* Header */}
                <div className="p-4 border-b flex items-center justify-between">
                  <div>
                    <h3 className="font-medium flex items-center gap-2">
                      {channels.find(c => c.id === activeChannel)?.isPrivate ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <Hash className="h-4 w-4" />
                      )}
                      {activeChannel}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {channels.find(c => c.id === activeChannel)?.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Bell className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <AnimatePresence>
                    {filteredMessages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-4 flex gap-3"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.userAvatar} />
                          <AvatarFallback>
                            {message.userName.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="font-medium">{message.userName}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{message.content}</p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={`Message #${activeChannel}`}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage} size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 text-center"
          >
            <p className="text-muted-foreground mb-4">
              Want to join the full community experience?
            </p>
            <Button size="lg">
              Join Swivi Media Pro
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
} 