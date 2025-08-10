import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const db = await getDatabase()
    const collection = db.collection("processed_messages")

    // Aggregate to get latest message for each contact
    const contacts = await collection
      .aggregate([
        {
          $sort: { timestamp: -1 },
        },
        {
          $group: {
            _id: "$wa_id",
            name: { $first: "$contact_name" },
            lastMessage: { $first: "$text" },
            timestamp: { $first: "$timestamp" },
            unreadCount: {
              $sum: {
                $cond: [{ $and: [{ $eq: ["$from_me", false] }, { $ne: ["$status", "read"] }] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            wa_id: "$_id",
            name: {
              $cond: {
                if: { $or: [{ $eq: ["$name", null] }, { $eq: ["$name", ""] }] },
                then: { $concat: ["+", { $toString: "$_id" }] },
                else: "$name",
              },
            },
            lastMessage: {
              $cond: {
                if: { $or: [{ $eq: ["$lastMessage", null] }, { $eq: ["$lastMessage", ""] }] },
                then: "No messages yet",
                else: "$lastMessage",
              },
            },
            timestamp: {
              $cond: {
                if: { $eq: ["$timestamp", null] },
                then: new Date().toISOString(),
                else: "$timestamp",
              },
            },
            unreadCount: { $ifNull: ["$unreadCount", 0] },
            _id: 0,
          },
        },
        {
          $sort: { timestamp: -1 },
        },
      ])
      .toArray()

    // Additional validation on the server side
    const validatedContacts = contacts
      .filter((contact) => contact.wa_id && typeof contact.wa_id === "string")
      .map((contact) => ({
        wa_id: contact.wa_id,
        name: contact.name || `+${contact.wa_id}`,
        lastMessage: contact.lastMessage || "No messages yet",
        timestamp: contact.timestamp || new Date().toISOString(),
        unreadCount: Math.max(0, contact.unreadCount || 0),
      }))

    return NextResponse.json(validatedContacts)
  } catch (error) {
    console.error("Error fetching contacts:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch contacts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
