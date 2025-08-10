"use client"

import { useState, useEffect } from "react"
import { ChatList } from "@/components/chat-list"
import { ChatWindow } from "@/components/chat-window"
import { ErrorBoundary } from "@/components/error-boundary"
import { useSocket } from "@/hooks/use-socket"
import { Search, MoreVertical, MessageCircle } from "lucide-react"

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

export default function WhatsAppWeb() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const socket = useSocket()

  // Fetch contacts on component mount
  useEffect(() => {
    fetchContacts()
  }, [])

  // Fetch messages when contact is selected
  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact)
    }
  }, [selectedContact])

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    socket.on("new_message", (message: Message) => {
      if (selectedContact === message.wa_id) {
        setMessages((prev) => [...prev, message])
      }
      // Update contact list
      fetchContacts()
    })

    socket.on("message_status_update", (update: { message_id: string; status: string }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.message_id === update.message_id
            ? { ...msg, status: update.status as "sent" | "delivered" | "read" }
            : msg,
        ),
      )
    })

    return () => {
      socket.off("new_message")
      socket.off("message_status_update")
    }
  }, [socket, selectedContact])

  const fetchContacts = async () => {
    try {
      const response = await fetch("/api/contacts")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setContacts(data)
      setError(null)
    } catch (error) {
      console.error("Error fetching contacts:", error)
      setError("Failed to load contacts. Please check your database connection.")
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (waId: string) => {
    try {
      const response = await fetch(`/api/messages/${waId}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setMessages(data)
    } catch (error) {
      console.error("Error fetching messages:", error)
      setError("Failed to load messages.")
    }
  }

  const sendMessage = async (text: string) => {
    if (!selectedContact || !text.trim()) return

    const newMessage = {
      wa_id: selectedContact,
      type: "text" as const,
      text: text.trim(),
      from_me: true,
      timestamp: new Date().toISOString(),
      status: "sent" as const,
    }

    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMessage),
      })

      if (response.ok) {
        const savedMessage = await response.json()

        // Add message to current conversation immediately
        setMessages((prev) => [...prev, savedMessage])

        // Update contact list with new last message
        setContacts((prev) =>
          prev.map((contact) =>
            contact.wa_id === selectedContact
              ? { ...contact, lastMessage: text.trim(), timestamp: savedMessage.timestamp }
              : contact,
          ),
        )

        // Simulate message status updates
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((msg) => (msg.message_id === savedMessage.message_id ? { ...msg, status: "delivered" } : msg)),
          )
        }, 1000)

        setTimeout(() => {
          setMessages((prev) =>
            prev.map((msg) => (msg.message_id === savedMessage.message_id ? { ...msg, status: "read" } : msg)),
          )
        }, 3000)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      setError("Failed to send message.")
    }
  }

  const selectedContactData = contacts.find((c) => c.wa_id === selectedContact)

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-green-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading WhatsApp Web...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8">
          <MessageCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null)
              setLoading(true)
              fetchContacts()
            }}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="h-screen flex bg-gray-100">
        {/* Sidebar */}
        <div className="w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="bg-gray-50 p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <span className="font-medium text-gray-900">WhatsApp</span>
              </div>
              <MoreVertical className="w-5 h-5 text-gray-600 cursor-pointer" />
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search or start new chat"
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            <ChatList contacts={contacts} selectedContact={selectedContact} onSelectContact={setSelectedContact} />
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          {selectedContact && selectedContactData ? (
            <ChatWindow contact={selectedContactData} messages={messages} onSendMessage={sendMessage} />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageCircle className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-light text-gray-600 mb-2">WhatsApp Web</h2>
                <p className="text-gray-500 max-w-md">
                  Send and receive messages without keeping your phone online. Use WhatsApp on up to 4 linked devices
                  and 1 phone at the same time.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  )
}
