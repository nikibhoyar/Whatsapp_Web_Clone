const fs = require("fs")
const path = require("path")
const { MongoClient } = require("mongodb")

// Load environment variables
require("dotenv").config({ path: ".env.local" })

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI

console.log("🚀 WhatsApp Webhook Payload Processor (Manual Mode)")
console.log("==================================================")

// Check environment variables
if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes("username:password")) {
  console.log("❌ MONGODB_URI environment variable not configured!")
  console.log("Please update your MongoDB connection string in .env.local")
  process.exit(1)
}

function findJsonFiles(dir) {
  const payloadFiles = []

  function searchDirectory(directory) {
    if (!fs.existsSync(directory)) {
      console.log(`❌ Directory not found: ${directory}`)
      return
    }

    console.log(`🔍 Searching in: ${directory}`)
    const files = fs.readdirSync(directory)

    files.forEach((file) => {
      const filePath = path.join(directory, file)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory()) {
        console.log(`📁 Found subdirectory: ${file}`)
        searchDirectory(filePath)
      } else if (file.endsWith(".json")) {
        console.log(`📄 Found JSON file: ${file}`)
        payloadFiles.push(filePath)
      }
    })
  }

  searchDirectory(dir)
  return payloadFiles
}

async function processPayloads() {
  const client = new MongoClient(MONGODB_URI)

  try {
    console.log("🔌 Connecting to MongoDB...")
    await client.connect()
    console.log("✅ Connected to MongoDB")

    const db = client.db("whatsapp")
    const collection = db.collection("processed_messages")

    // Look for payload files in common locations
    const possibleDirs = ["payloads", "extracted_payloads", "webhook_payloads", "."]
    let payloadFiles = []

    for (const dir of possibleDirs) {
      if (fs.existsSync(dir)) {
        console.log(`\n📂 Checking directory: ${dir}`)
        const files = findJsonFiles(dir)
        payloadFiles = payloadFiles.concat(files)
      }
    }

    if (payloadFiles.length === 0) {
      console.log("\n❌ No JSON payload files found!")
      console.log("\n📋 Manual Setup Instructions:")
      console.log(
        "1. Download the zip file from: https://drive.google.com/file/d/1pWZ9HaHLza8k080pP_GhvKIl8j2voy-U/view?usp=sharing",
      )
      console.log("2. Extract the zip file")
      console.log("3. Copy all .json files to a 'payloads' folder in your project directory")
      console.log("4. Run this script again")
      return
    }

    console.log(`\n📄 Found ${payloadFiles.length} payload files to process`)

    let processedCount = 0
    let messageCount = 0
    let statusCount = 0

    for (const payloadFile of payloadFiles) {
      try {
        console.log(`\n📄 Processing: ${path.basename(payloadFile)}`)

        const payloadData = JSON.parse(fs.readFileSync(payloadFile, "utf8"))

        if (!payloadData.entry) {
          console.log("⚠️ Invalid payload structure - skipping")
          continue
        }

        for (const entry of payloadData.entry) {
          if (!entry.changes) continue

          for (const change of entry.changes) {
            if (change.field !== "messages") continue

            const value = change.value || {}

            // Process incoming messages
            if (value.messages) {
              const contacts = value.contacts || []

              for (const message of value.messages) {
                const contactName = contacts.find((c) => c.wa_id === message.from)?.profile?.name

                let messageText = ""
                if (message.type === "text") {
                  messageText = message.text?.body || ""
                } else if (message.type === "image") {
                  messageText = message.image?.caption || "[Image]"
                } else if (message.type === "document") {
                  messageText = message.document?.caption || `[Document: ${message.document?.filename || "file"}]`
                } else if (message.type === "audio") {
                  messageText = "[Voice Message]"
                } else {
                  messageText = `[${message.type} message]`
                }

                const processedMessage = {
                  wa_id: message.from,
                  message_id: message.id,
                  type: message.type,
                  text: messageText,
                  timestamp: new Date(Number.parseInt(message.timestamp) * 1000).toISOString(),
                  status: "delivered",
                  from_me: false,
                  contact_name: contactName || `+${message.from}`,
                  created_at: new Date(),
                }

                await collection.updateOne({ message_id: message.id }, { $set: processedMessage }, { upsert: true })

                messageCount++
                console.log(`  ✅ Message: ${message.id.substring(0, 20)}...`)
              }
            }

            // Process status updates
            if (value.statuses) {
              for (const status of value.statuses) {
                const result = await collection.updateMany(
                  {
                    $or: [{ message_id: status.id }, { meta_msg_id: status.id }],
                  },
                  {
                    $set: {
                      status: status.status,
                      status_timestamp: new Date(Number.parseInt(status.timestamp) * 1000).toISOString(),
                    },
                  },
                )

                statusCount++
                console.log(`  ✅ Status: ${status.id.substring(0, 20)}... -> ${status.status}`)
              }
            }
          }
        }

        processedCount++
      } catch (error) {
        console.error(`❌ Error processing ${payloadFile}:`, error.message)
      }
    }

    // Add sample outgoing messages
    console.log("\n📤 Adding sample outgoing messages...")
    const sampleMessages = [
      { wa_id: "1234567890", text: "Hello! How are you doing today?", name: "John Doe" },
      { wa_id: "9876543210", text: "Thanks for your message! I'll get back to you soon.", name: "Jane Smith" },
      { wa_id: "5555555555", text: "Let's schedule a meeting for tomorrow at 2 PM.", name: "Bob Johnson" },
      { wa_id: "1111111111", text: "Great work on the project! Keep it up.", name: "Alice Brown" },
      { wa_id: "2222222222", text: "Can you send me the latest reports?", name: "Charlie Wilson" },
    ]

    for (let i = 0; i < sampleMessages.length; i++) {
      const sample = sampleMessages[i]
      await collection.insertOne({
        wa_id: sample.wa_id,
        message_id: `out_${Date.now()}_${i}`,
        type: "text",
        text: sample.text,
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        status: Math.random() > 0.5 ? "read" : "delivered",
        from_me: true,
        contact_name: sample.name,
        created_at: new Date(),
      })
    }

    // Print summary
    const totalMessages = await collection.countDocuments({})
    const incomingMessages = await collection.countDocuments({ from_me: false })
    const outgoingMessages = await collection.countDocuments({ from_me: true })

    console.log("\n" + "=".repeat(50))
    console.log("📊 PROCESSING SUMMARY")
    console.log("=".repeat(50))
    console.log(`✅ Processed files: ${processedCount}`)
    console.log(`📨 New messages processed: ${messageCount}`)
    console.log(`📊 Status updates processed: ${statusCount}`)
    console.log(`📱 Total messages in database: ${totalMessages}`)
    console.log(`📥 Incoming messages: ${incomingMessages}`)
    console.log(`📤 Outgoing messages: ${outgoingMessages}`)

    // Show contact breakdown
    const contacts = await collection
      .aggregate([
        {
          $group: {
            _id: "$wa_id",
            name: { $first: "$contact_name" },
            count: { $sum: 1 },
            lastMessage: { $last: "$text" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ])
      .toArray()

    console.log("\n📞 Top Contacts:")
    contacts.forEach((contact, index) => {
      console.log(`${index + 1}. ${contact.name} (+${contact._id}): ${contact.count} messages`)
    })

    console.log("\n🎉 Payload processing completed successfully!")
    console.log("Your WhatsApp Web clone is now ready with real conversation data!")
    console.log("\nNext steps:")
    console.log("1. Run: npm run dev")
    console.log("2. Open: http://localhost:3000")
    console.log("3. Enjoy your WhatsApp Web clone!")
  } catch (error) {
    console.error("❌ Error:", error)
  } finally {
    await client.close()
  }
}

// Run the processor
processPayloads().catch(console.error)
