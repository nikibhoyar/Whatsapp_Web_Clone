"use client"

interface Contact {
  wa_id: string
  name: string
  lastMessage: string
  timestamp: string
  unreadCount: number
  avatar?: string
}

interface ChatListProps {
  contacts: Contact[]
  selectedContact: string | null
  onSelectContact: (waId: string) => void
}

export function ChatList({ contacts, selectedContact, onSelectContact }: ChatListProps) {
  const getInitials = (name: string | null | undefined) => {
    // Handle null, undefined, or empty string
    if (!name || typeof name !== "string" || name.trim() === "") {
      return "?"
    }

    try {
      return name
        .trim()
        .split(" ")
        .filter((n) => n.length > 0) // Filter out empty strings
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    } catch (error) {
      console.error("Error generating initials for name:", name, error)
      return "?"
    }
  }

  const formatTime = (timestamp: string | null | undefined) => {
    if (!timestamp) return ""

    try {
      const date = new Date(timestamp)

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return ""
      }

      const now = new Date()
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

      if (diffInHours < 24) {
        return date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      } else {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      }
    } catch (error) {
      console.error("Error formatting timestamp:", timestamp, error)
      return ""
    }
  }

  // Filter out invalid contacts
  const validContacts = contacts.filter((contact) => contact && contact.wa_id && typeof contact.wa_id === "string")

  return (
    <div className="divide-y divide-gray-100">
      {validContacts.map((contact) => {
        // Provide fallback values for contact properties
        const contactName = contact.name || `+${contact.wa_id}` || "Unknown"
        const lastMessage = contact.lastMessage || "No messages yet"
        const timestamp = contact.timestamp || ""
        const unreadCount = contact.unreadCount || 0

        return (
          <div
            key={contact.wa_id}
            onClick={() => onSelectContact(contact.wa_id)}
            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
              selectedContact === contact.wa_id ? "bg-gray-100" : ""
            }`}
          >
            <div className="flex items-center space-x-3">
              {/* Avatar */}
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                {contact.avatar ? (
                  <img
                    src={contact.avatar || "/placeholder.svg"}
                    alt={contactName}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
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

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-gray-900 truncate">{contactName}</h3>
                  <span className="text-xs text-gray-500 flex-shrink-0">{formatTime(timestamp)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 truncate flex-1">{lastMessage}</p>

                  {unreadCount > 0 && (
                    <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 ml-2 flex-shrink-0">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {validContacts.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <p>No conversations yet</p>
          <p className="text-sm mt-1">Start a new chat to see it here</p>
        </div>
      )}
    </div>
  )
}
