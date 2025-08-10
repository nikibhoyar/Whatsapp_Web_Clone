import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const db = await getDatabase()
    const collection = db.collection("processed_messages")

    const message = {
      _id: new ObjectId(),
      wa_id: body.wa_id,
      message_id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: body.type || "text",
      text: body.text,
      timestamp: new Date().toISOString(),
      status: "sent",
      from_me: true,
      contact_name: body.contact_name || `+${body.wa_id}`,
      created_at: new Date(),
    }

    const result = await collection.insertOne(message)

    // Since we don't have real-time sockets working yet,
    // we'll just return the message
    console.log("Message sent:", message.message_id)

    return NextResponse.json(message)
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
