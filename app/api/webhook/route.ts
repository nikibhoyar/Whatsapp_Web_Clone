import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const db = await getDatabase()
    const collection = db.collection("processed_messages")

    // Process webhook payload
    if (payload.entry && payload.entry[0] && payload.entry[0].changes) {
      const changes = payload.entry[0].changes[0]

      if (changes.field === "messages" && changes.value.messages) {
        // Process incoming messages
        for (const message of changes.value.messages) {
          const processedMessage = {
            _id: new ObjectId(),
            wa_id: message.from,
            message_id: message.id,
            type: message.type,
            text: message.text?.body || "",
            timestamp: new Date(Number.parseInt(message.timestamp) * 1000).toISOString(),
            status: "delivered",
            from_me: false,
            contact_name: changes.value.contacts?.[0]?.profile?.name || `+${message.from}`,
            created_at: new Date(),
          }

          await collection.insertOne(processedMessage)

          // Emit to all connected clients
          if (global.io) {
            global.io.emit("new_message", processedMessage)
          }
        }
      }

      if (changes.field === "messages" && changes.value.statuses) {
        // Process status updates
        for (const status of changes.value.statuses) {
          await collection.updateOne({ message_id: status.id }, { $set: { status: status.status } })

          // Emit status update
          if (global.io) {
            global.io.emit("message_status_update", {
              message_id: status.id,
              status: status.status,
            })
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 })
  }
}
