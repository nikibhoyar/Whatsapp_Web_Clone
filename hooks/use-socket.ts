"use client"

import { useEffect, useState } from "react"

// Mock socket implementation for development
interface MockSocket {
  on: (event: string, callback: (data: any) => void) => void
  off: (event: string) => void
  emit: (event: string, data: any) => void
  close: () => void
}

export function useSocket(): MockSocket | null {
  const [socket, setSocket] = useState<MockSocket | null>(null)

  useEffect(() => {
    // Create a mock socket for development
    const mockSocket: MockSocket = {
      on: (event: string, callback: (data: any) => void) => {
        console.log(`Mock socket listening for: ${event}`)
        // Store callbacks for potential future use
      },
      off: (event: string) => {
        console.log(`Mock socket stopped listening for: ${event}`)
      },
      emit: (event: string, data: any) => {
        console.log(`Mock socket emitting: ${event}`, data)
      },
      close: () => {
        console.log("Mock socket closed")
      },
    }

    setSocket(mockSocket)
    console.log("Mock Socket.IO connected")

    return () => {
      mockSocket.close()
    }
  }, [])

  return socket
}
