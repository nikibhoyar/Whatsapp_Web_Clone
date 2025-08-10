"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, Phone, Video, MoreVertical, Search } from "lucide-react"
import { MessageBubble } from "./message-bubble"

interface Contact {
  wa_id: string
  name: string
  lastMessage: string
  timestamp: string
  unreadCount: number
  avatar?: string
}

interface Message {
  _id: string
  wa_id: string
  message_id: string
  type: "text" | "image" | "document"
  text?: string
  timestamp: string
  status: "sent" | "delivered" | "read"
  from_me: boolean
  contact_name?: string
}

interface ChatWindowProps {
  contact: Contact
  messages: Message[]
  onSendMessage: (text: string) => void
}

export function ChatWindow({ contact, messages, onSendMessage }: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim()) {
      onSendMessage(newMessage)
      setNewMessage("")
    }
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name || typeof name !== "string" || name.trim() === "") {
      return "?"
    }

    try {
      return name
        .trim()
        .split(" ")
        .filter((n) => n.length > 0)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    } catch (error) {
      console.error("Error generating initials:", error)
      return "?"
    }
  }

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {}

    // Filter out invalid messages
    const validMessages = messages.filter((msg) => msg && msg.timestamp && typeof msg.timestamp === "string")

    validMessages.forEach((message) => {
      try {
        const date = new Date(message.timestamp).toDateString()
        if (!groups[date]) {
          groups[date] = []
        }
        groups[date].push(message)
      } catch (error) {
        console.error("Error grouping message by date:", message, error)
      }
    })

    return groups
  }

  const formatDateHeader = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const today = new Date().toDateString()
      const yesterday = new Date(Date.now() - 86400000).toDateString()

      if (dateString === today) return "Today"
      if (dateString === yesterday) return "Yesterday"

      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (error) {
      console.error("Error formatting date header:", dateString, error)
      return dateString
    }
  }

  // Provide fallback values for contact
  const contactName = contact?.name || `+${contact?.wa_id}` || "Unknown Contact"
  const contactWaId = contact?.wa_id || ""

  const messageGroups = groupMessagesByDate(messages || [])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            {contact?.avatar ? (
              <img
                src={contact.avatar || "/placeholder.svg"}
                alt={contactName}
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = "none"
                  const parent = target.parentElement
                  if (parent) {
                    parent.innerHTML = `<span class="text-white font-medium text-sm">${getInitials(contactName)}</span>`
                  }
                }}
              />
            ) : (
              <span className="text-white font-medium text-sm">{getInitials(contactName)}</span>
            )}
          </div>
          <div>
            <h2 className="font-medium text-gray-900">{contactName}</h2>
            <p className="text-sm text-gray-500">+{contactWaId}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Search className="w-5 h-5 text-gray-600 cursor-pointer hover:text-gray-800" />
          <Phone className="w-5 h-5 text-gray-600 cursor-pointer hover:text-gray-800" />
          <Video className="w-5 h-5 text-gray-600 cursor-pointer hover:text-gray-800" />
          <MoreVertical className="w-5 h-5 text-gray-600 cursor-pointer hover:text-gray-800" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
        {Object.entries(messageGroups).map(([date, dateMessages]) => (
          <div key={date}>
            {/* Date Header */}
            <div className="flex justify-center mb-4">
              <span className="bg-white px-3 py-1 rounded-lg text-xs text-gray-600 shadow-sm">
                {formatDateHeader(date)}
              </span>
            </div>

            {/* Messages for this date */}
            <div className="space-y-2">
              {dateMessages.map((message) => (
                <MessageBubble key={message._id || message.message_id} message={message} />
              ))}
            </div>
          </div>
        ))}

        {Object.keys(messageGroups).length === 0 && (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-gray-50 p-4 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white p-3 rounded-full transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  )
}
