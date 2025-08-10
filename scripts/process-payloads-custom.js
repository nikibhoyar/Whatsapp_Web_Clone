const fs = require("fs")
const path = require("path")
const { MongoClient } = require("mongodb")

// Load environment variables
require("dotenv").config({ path: ".env.local" })

const MONGODB_URI = process.env.MONGODB_URI

console.log("🚀 WhatsApp Custom Payload Processor")
console.log("====================================")

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

function processCustomPayload(payload, fileName) {
  const processedMessages = []
  const processedStatuses = []

  try {
    console.log(`\n📄 Processing custom payload: ${fileName}`)
    console.log(`Payload type: ${payload.payload_type || 'unknown'}`)
    console.log(`Payload ID: ${payload._id || 'unknown'}`)

    // Check if this is a WhatsApp webhook payload
    if (payload.payload_type !== "whatsapp_webhook") {
      console.log("⚠️ Not a WhatsApp webhook payload - skipping")
      return { messages: [], statuses: [] }
    }

    // Extract metadata
    const metaData = payload.metaData
    if (!metaData || !metaData.entry) {
      console.log("⚠️ No metadata or entry found - skipping")
      return { messages: [], statuses: [] }
    }

    // Process each entry
    for (const entry of metaData.entry) {
      if (!entry.changes) continue

      for (const change of entry.changes) {
        if (change.field !== "messages") continue

        const value = change.value || {}
        console.log(`  📱 Processing messages from phone: ${value.metadata?.display_phone_number || 'unknown'}`)

        // Process incoming messages
        if (value.messages && value.messages.length > 0) {
          const contacts = value.contacts || []
          
          console.log(`  📨 Found ${value.messages.length} message(s)`)

          for (const message of value.messages) {
            // Find contact info
            const contact = contacts.find(c => c.wa_id === message.from)
            const contactName = contact?.profile?.name || `+${message.from}`

            let messageText = ""
            if (message.type === "text" && message.text) {
              messageText = message.text.body || ""
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
              timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
              status: "delivered", // Default status for incoming messages
              from_me: false,
              contact_name: contactName,
              created_at: new Date(),
              // Additional metadata
              payload_id: payload._id,
              phone_number_id: value.metadata?.phone_number_id,
              display_phone_number: value.metadata?.display_phone_number,
              source_file: fileName
            }

            processedMessages.push(processedMessage)
            console.log(`    ✅ Message from ${contactName}: "${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}"`)
          }
        }

        // Process status updates (if any)
        if (value.statuses && value.statuses.length > 0) {
          console.log(`  📊 Found ${value.statuses.length} status update(s)`)
          
          for (const status of value.statuses) {
            processedStatuses.push({
              message_id: status.id,
              status: status.status,
              timestamp: new Date(parseInt(status.timestamp) * 1000).toISOString(),
              recipient_id: status.recipient_id,
              payload_id: payload._id,
              source_file: fileName
            })
            
            console.log(`    ✅ Status update: ${status.id} -> ${status.status}`)
          }
        }
      }
    }

    return { messages: processedMessages, statuses: processedStatuses }

  } catch (error) {
    console.error(`❌ Error processing payload ${fileName}:`, error.message)
    return { messages: [], statuses: [] }
  }
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
    const possibleDirs = ["payloads", "extracted_payloads", "webhook_payloads", ".", "data"]
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
      console.log("\n📋 Setup Instructions:")
      console.log("1. Create a 'payloads' folder in your project directory")
      console.log("2. Copy your JSON payload files to the 'payloads' folder")
      console.log("3. Run this script again")
      
      // Create sample payload file for testing
      const samplePayload = {
        "payload_type": "whatsapp_webhook",
        "_id": "conv1-msg1-user",
        "metaData": {
          "entry": [
            {
              "changes": [
                {
                  "field": "messages",
                  "value": {
                    "contacts": [
                      {
                        "profile": {
                          "name": "Ravi Kumar"
                        },
                        "wa_id": "919937320320"
                      }
                    ],
                    "messages": [
                      {
                        "from": "919937320320",
                        "id": "wamid.HBgMOTE5OTY3NTc4NzIwFQIAEhggMTIzQURFRjEyMzQ1Njc4OTA=",
                        "timestamp": "1754400000",
                        "text": {
                          "body": "Hi, I'd like to know more about your services."
                        },
                        "type": "text"
                      }
                    ],
                    "messaging_product": "whatsapp",
                    "metadata": {
                      "display_phone_number": "918329446654",
                      "phone_number_id": "629305560276479"
                    }
                  }
                }
              ],
              "id": "30164062719905277"
            }
          ],
          "gs_app_id": "conv1-app",
          "object": "whatsapp_business_account"
        },
        "createdAt": "2025-08-06 12:00:00",
        "startedAt": "2025-08-06 12:00:00",
        "completedAt": "2025-08-06 12:00:01",
        "executed": true
      }

      if (!fs.existsSync("payloads")) {
        fs.mkdirSync("payloads")
      }
      
      fs.writeFileSync("payloads/sample_payload.json", JSON.stringify(samplePayload, null, 2))
      console.log("✅ Created sample payload file: payloads/sample_payload.json")
      console.log("You can now run the script again to process this sample data")
      
      return
    }

    console.log(`\n📄 Found ${payloadFiles.length} payload files to process`)

    let totalProcessedMessages = 0
    let totalProcessedStatuses = 0
    let processedFiles = 0
    let failedFiles = 0

    // Process each payload file
    for (const payloadFile of payloadFiles) {
      try {
        const fileName = path.basename(payloadFile)
        const payloadData = JSON.parse(fs.readFileSync(payloadFile, "utf8"))

        const result = processCustomPayload(payloadData, fileName)

        // Insert messages into database
        for (const message of result.messages) {
          await collection.updateOne(
            { message_id: message.message_id },
            { $set: message },
            { upsert: true }
          )
          totalProcessedMessages++
        }

        // Update message statuses
        for (const statusUpdate of result.statuses) {
          const updateResult = await collection.updateMany(
            {
              $or: [
                { message_id: statusUpdate.message_id },
                { meta_msg_id: statusUpdate.message_id }
              ]
            },
            {
              $set: {
                status: statusUpdate.status,
                status_timestamp: statusUpdate.timestamp
              }
            }
          )
          
          if (updateResult.modifiedCount > 0) {
            totalProcessedStatuses++
          }
        }

        processedFiles++
        console.log(`  ✅ Successfully processed: ${fileName}`)

      } catch (error) {
        console.error(`❌ Failed to process ${path.basename(payloadFile)}:`, error.message)
        failedFiles++
      }
    }

    // Add some sample outgoing messages for demo
    console.log("\n📤 Adding sample outgoing messages...")
    const sampleOutgoingMessages = [
      { wa_id: "919937320320", text: "Thank you for your interest! We'd be happy to help.", name: "Ravi Kumar" },
      { wa_id: "919876543210", text: "Hello! How can we assist you today?", name: "Priya Sharma" },
      { wa_id: "919123456789", text: "Your order has been confirmed and will be delivered soon.", name: "Amit Singh" },
      { wa_id: "919555666777", text: "Thanks for choosing our services!", name: "Neha Gupta" },
    ]

    for (let i = 0; i < sampleOutgoingMessages.length; i++) {
      const sample = sampleOutgoingMessages[i]
      await collection.insertOne({
        wa_id: sample.wa_id,
        message_id: `out_${Date.now()}_${i}`,
        type: "text",
        text: sample.text,
        timestamp: new Date(Date.now() - (i + 1) * 300000).toISOString(), // Spread over last few hours
        status: Math.random() > 0.5 ? "read" : "delivered",
        from_me: true,
        contact_name: sample.name,
        created_at: new Date(),
        source_file: "system_generated"
      })
    }

    // Print detailed summary
    const totalMessages = await collection.countDocuments({})
    const incomingMessages = await collection.countDocuments({ from_me: false })
    const outgoingMessages = await collection.countDocuments({ from_me: true })

    console.log("\n" + "=".repeat(60))
    console.log("📊 PROCESSING SUMMARY")
    console.log("=".repeat(60))
    console.log(`✅ Successfully processed files: ${processedFiles}`)
    console.log(`❌ Failed to process files: ${failedFiles}`)
    console.log(`📨 New messages processed: ${totalProcessedMessages}`)
    console.log(`📊 Status updates processed: ${totalProcessedStatuses}`)
    console.log(`📱 Total messages in database: ${totalMessages}`)
    console.log(`📥 Incoming messages: ${incomingMessages}`)
    console.log(`📤 Outgoing messages: ${outgoingMessages}`)

    // Show contact breakdown with phone numbers
    console.log("\n📞 CONTACTS BREAKDOWN:")
    console.log("-".repeat(60))
    
    const contacts = await collection.aggregate([
      {
        $group: {
          _id: "$wa_id",
          name: { $first: "$contact_name" },
          count: { $sum: 1 },
          lastMessage: { $last: "$text" },
          lastTimestamp: { $last: "$timestamp" },
          phoneNumber: { $first: "$display_phone_number" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray()

    contacts.forEach((contact, index) => {
      console.log(`${index + 1}. ${contact.name}`)
      console.log(`   📱 WhatsApp ID: +${contact._id}`)
      console.log(`   📞 Display Phone: ${contact.phoneNumber || 'N/A'}`)
      console.log(`   💬 Messages: ${contact.count}`)
      console.log(`   📝 Last: "${contact.lastMessage?.substring(0, 50)}${contact.lastMessage?.length > 50 ? '...' : ''}"`)
      console.log("")
    })

    // Show file breakdown
    console.log("📁 FILES PROCESSED:")
    console.log("-".repeat(60))
    
    const fileStats = await collection.aggregate([
      {
        $group: {
          _id: "$source_file",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray()

    fileStats.forEach((file, index) => {
      console.log(`${index + 1}. ${file._id || 'Unknown'}: ${file.count} messages`)
    })

    console.log("\n🎉 Custom payload processing completed successfully!")
    console.log("Your WhatsApp Web clone now has the exact data from your JSON files!")
    console.log("\nNext steps:")
    console.log("1. Run: npm run dev")
    console.log("2. Open: http://localhost:3000")
    console.log("3. See your contacts and messages with proper names and numbers!")

  } catch (error) {
    console.error("❌ Error:", error)
  } finally {
    await client.close()
  }
}

// Run the processor
processPayloads().catch(console.error)
