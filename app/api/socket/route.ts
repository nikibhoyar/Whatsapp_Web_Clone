import { type NextRequest, NextResponse } from "next/server"

// Simple endpoint that just confirms Socket.IO is available
export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: "Socket.IO endpoint available",
    timestamp: new Date().toISOString(),
  })
}

export async function POST(req: NextRequest) {
  return NextResponse.json({
    message: "Socket.IO endpoint available",
    timestamp: new Date().toISOString(),
  })
}
