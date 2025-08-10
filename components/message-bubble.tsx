import { Check, CheckCheck } from "lucide-react"

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

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const formatTime = (timestamp: string | null | undefined) => {
    if (!timestamp) return ""

    try {
      const date = new Date(timestamp)

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return ""
      }

      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    } catch (error) {
      console.error("Error formatting message timestamp:", timestamp, error)
      return ""
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <Check className="w-4 h-4 text-gray-400" />
      case "delivered":
        return <CheckCheck className="w-4 h-4 text-gray-400" />
      case "read":
        return <CheckCheck className="w-4 h-4 text-blue-500" />
      default:
        return null
    }
  }

  // Provide fallback values
  const messageText = message.text || "[Message content unavailable]"
  const messageStatus = message.status || "sent"
  const messageTimestamp = message.timestamp || new Date().toISOString()

  return (
    <div className={`flex ${message.from_me ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          message.from_me ? "bg-green-500 text-white" : "bg-white text-gray-900 shadow-sm"
        }`}
      >
        <div className="break-words">{messageText}</div>

        <div
          className={`flex items-center justify-end space-x-1 mt-1 ${
            message.from_me ? "text-green-100" : "text-gray-500"
          }`}
        >
          <span className="text-xs">{formatTime(messageTimestamp)}</span>
          {message.from_me && getStatusIcon(messageStatus)}
        </div>
      </div>
    </div>
  )
}
