import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest, { params }: { params: { waId: string } }) {
  try {
    const { waId } = params
    const db = await getDatabase()
    const collection = db.collection("processed_messages")

    const messages = await collection.find({ wa_id: waId }).sort({ timestamp: 1 }).toArray()

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}
