# WhatsApp Webhook Payload Processing Guide

This guide will help you process the specific webhook payload files from the Google Drive link mentioned in your evaluation task.

## Quick Setup

### Option 1: Automatic Processing (Recommended)

1. **Set up your MongoDB connection string**
   \`\`\`bash
   export MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/whatsapp"
   \`\`\`

2. **Run the Node.js payload processor**
   \`\`\`bash
   npm run process-payloads
   \`\`\`

   This will:
   - ✅ Download the zip file from Google Drive automatically
   - ✅ Extract all JSON payload files
   - ✅ Process incoming messages and status updates
   - ✅ Insert data into MongoDB `whatsapp.processed_messages` collection
   - ✅ Add sample outgoing messages for demo
   - ✅ Clean up temporary files

### Option 2: Python Script

1. **Install Python dependencies**
   \`\`\`bash
   pip install pymongo requests
   \`\`\`

2. **Run the Python processor**
   \`\`\`bash
   python scripts/process_webhook_payloads.py
   \`\`\`

### Option 3: Manual Processing

1. **Download the payload files**
   - Download from: https://drive.google.com/file/d/1pWZ9HaHLza8k080pP_GhvKIl8j2voy-U/view?usp=sharing
   - Extract the zip file to a `payloads/` directory

2. **Update the Python script**
   ```python
   # In process_webhook_payloads.py, modify the download function to use local files
   def get_local_payloads():
       payload_files = []
       for filename in os.listdir('payloads'):
           if filename.endswith('.json'):
               payload_files.append(os.path.join('payloads', filename))
       return payload_files
   \`\`\`

3. **Run the processor**
   \`\`\`bash
   python scripts/process_webhook_payloads.py
   \`\`\`

## Expected Payload Formats

The script handles these WhatsApp Business API webhook formats:

### Incoming Message Payload
\`\`\`json
{
  "entry": [{
    "changes": [{
      "field": "messages",
      "value": {
        "messages": [{
          "id": "wamid.xxx",
          "from": "1234567890",
          "timestamp": "1640995200",
          "type": "text",
          "text": {
            "body": "Hello, this is a test message"
          }
        }],
        "contacts": [{
          "wa_id": "1234567890",
          "profile": {
            "name": "John Doe"
          }
        }]
      }
    }]
  }]
}
\`\`\`

### Status Update Payload
\`\`\`json
{
  "entry": [{
    "changes": [{
      "field": "messages",
      "value": {
        "statuses": [{
          "id": "wamid.xxx",
          "status": "delivered",
          "timestamp": "1640995300",
          "recipient_id": "1234567890"
        }]
      }
    }]
  }]
}
\`\`\`

## Database Schema

Messages are stored in `whatsapp.processed_messages` with this structure:

\`\`\`javascript
{
  _id: ObjectId,
  wa_id: "1234567890",           // WhatsApp ID (phone number)
  message_id: "wamid.xxx",       // Unique message identifier
  type: "text",                  // Message type (text, image, document, etc.)
  text: "Hello world",           // Message content
  timestamp: "2023-01-01T12:00:00.000Z", // ISO timestamp
  status: "delivered",           // sent, delivered, read
  from_me: false,               // true for outgoing, false for incoming
  contact_name: "John Doe",     // Contact display name
  created_at: Date              // Database insertion time
}
\`\`\`

## Verification

After processing, you can verify the data:

1. **Check MongoDB directly**
   \`\`\`javascript
   // In MongoDB Compass or shell
   use whatsapp
   db.processed_messages.find().limit(5)
   \`\`\`

2. **Check via the web app**
   - Start the Next.js app: `npm run dev`
   - Visit http://localhost:3000
   - You should see contacts and messages populated

3. **API endpoints**
   - GET `/api/contacts` - View all contacts
   - GET `/api/messages/[waId]` - View messages for specific contact

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   \`\`\`
   Error: MongoNetworkError: failed to connect to server
   \`\`\`
   **Solution**: Check your MONGODB_URI environment variable

2. **Download Failed**
   \`\`\`
   Error downloading payloads: Request failed
   \`\`\`
   **Solution**: Download manually and use Option 3

3. **No Payload Files Found**
   \`\`\`
   Found 0 payload files
   \`\`\`
   **Solution**: Ensure the zip file contains .json files in the expected structure

4. **JSON Parse Error**
   \`\`\`
   JSON decode error: Unexpected token
   \`\`\`
   **Solution**: Check if payload files are valid JSON format

### Debug Mode

Enable detailed logging by setting:
\`\`\`bash
export DEBUG=true
\`\`\`

## Expected Output

When successful, you should see:
\`\`\`
🚀 Starting WhatsApp Webhook Payload Processing
==================================================
✅ MongoDB connection successful
📥 Downloading webhook payloads from Google Drive...
✅ Found 15 payload files

📄 Processing: incoming_message_1.json
  ✓ Inserted new message: wamid.xxx
📄 Processing: status_update_1.json
  ✓ Updated 1 message(s) to status 'read'

📊 PROCESSING COMPLETE
✅ Successfully processed: 15 files
❌ Failed to process: 0 files

DATABASE SUMMARY
==================================================
Total messages: 45
Incoming messages: 32
Outgoing messages: 13

🎉 Webhook payload processing completed!
Your WhatsApp Web clone is now ready with real data!
\`\`\`

Now your WhatsApp Web clone will have realistic conversation data from the provided webhook payloads!
