import json
import os
import zipfile
import requests
from pymongo import MongoClient
from datetime import datetime
import tempfile
from urllib.parse import urlparse

# MongoDB connection
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
client = MongoClient(MONGODB_URI)
db = client['whatsapp']
collection = db['processed_messages']

def download_payloads_from_drive():
    """Download the payload zip file from Google Drive"""
    # Google Drive direct download link
    file_id = "1pWZ9HaHLza8k080pP_GhvKIl8j2voy-U"
    download_url = f"https://drive.google.com/uc?export=download&id={file_id}"
    
    print("Downloading webhook payloads from Google Drive...")
    
    try:
        response = requests.get(download_url)
        response.raise_for_status()
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.zip') as temp_file:
            temp_file.write(response.content)
            zip_path = temp_file.name
        
        # Extract zip file
        extract_dir = tempfile.mkdtemp()
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
        
        # Find all JSON files
        payload_files = []
        for root, dirs, files in os.walk(extract_dir):
            for file in files:
                if file.endswith('.json'):
                    payload_files.append(os.path.join(root, file))
        
        print(f"Found {len(payload_files)} payload files")
        return payload_files
        
    except Exception as e:
        print(f"Error downloading payloads: {str(e)}")
        return []

def process_incoming_message(message_data, contacts_data=None):
    """Process a single incoming message"""
    try:
        # Extract contact information
        contact_name = None
        if contacts_data:
            for contact in contacts_data:
                if contact.get('wa_id') == message_data.get('from'):
                    contact_name = contact.get('profile', {}).get('name')
                    break
        
        # Create processed message document
        processed_message = {
            'wa_id': message_data['from'],
            'message_id': message_data['id'],
            'type': message_data.get('type', 'text'),
            'timestamp': datetime.fromtimestamp(int(message_data['timestamp'])).isoformat(),
            'status': 'delivered',  # Default status for incoming messages
            'from_me': False,
            'contact_name': contact_name or f"+{message_data['from']}",
            'created_at': datetime.now()
        }
        
        # Handle different message types
        if message_data['type'] == 'text':
            processed_message['text'] = message_data.get('text', {}).get('body', '')
        elif message_data['type'] == 'image':
            processed_message['text'] = message_data.get('image', {}).get('caption', '[Image]')
            processed_message['media_id'] = message_data.get('image', {}).get('id')
        elif message_data['type'] == 'document':
            processed_message['text'] = message_data.get('document', {}).get('caption', '[Document]')
            processed_message['media_id'] = message_data.get('document', {}).get('id')
            processed_message['filename'] = message_data.get('document', {}).get('filename')
        elif message_data['type'] == 'audio':
            processed_message['text'] = '[Voice Message]'
            processed_message['media_id'] = message_data.get('audio', {}).get('id')
        else:
            processed_message['text'] = f'[{message_data["type"].title()} Message]'
        
        # Insert or update in database
        result = collection.update_one(
            {'message_id': message_data['id']},
            {'$set': processed_message},
            upsert=True
        )
        
        if result.upserted_id:
            print(f"✓ Inserted new message: {message_data['id']}")
        else:
            print(f"✓ Updated existing message: {message_data['id']}")
            
        return True
        
    except Exception as e:
        print(f"✗ Error processing message {message_data.get('id', 'unknown')}: {str(e)}")
        return False

def process_status_update(status_data):
    """Process message status update"""
    try:
        message_id = status_data['id']
        new_status = status_data['status']
        recipient_id = status_data.get('recipient_id', '')
        
        # Update message status in database
        query = {
            '$or': [
                {'message_id': message_id},
                {'meta_msg_id': message_id}
            ]
        }
        
        update = {
            '$set': {
                'status': new_status,
                'status_timestamp': datetime.fromtimestamp(int(status_data['timestamp'])).isoformat()
            }
        }
        
        result = collection.update_many(query, update)
        
        if result.modified_count > 0:
            print(f"✓ Updated {result.modified_count} message(s) to status '{new_status}' for message ID: {message_id}")
        else:
            print(f"⚠ No messages found to update for message ID: {message_id}")
            
        return True
        
    except Exception as e:
        print(f"✗ Error processing status update: {str(e)}")
        return False

def process_webhook_payload(payload_file):
    """Process a single webhook payload file"""
    try:
        with open(payload_file, 'r', encoding='utf-8') as f:
            payload = json.load(f)
        
        print(f"\n📄 Processing: {os.path.basename(payload_file)}")
        
        # Validate payload structure
        if 'entry' not in payload:
            print("⚠ Invalid payload structure - missing 'entry' field")
            return False
        
        processed_items = 0
        
        for entry in payload['entry']:
            if 'changes' not in entry:
                continue
                
            for change in entry['changes']:
                if change.get('field') != 'messages':
                    continue
                    
                value = change.get('value', {})
                
                # Process incoming messages
                if 'messages' in value:
                    messages = value['messages']
                    contacts = value.get('contacts', [])
                    
                    print(f"  📨 Processing {len(messages)} message(s)")
                    
                    for message in messages:
                        if process_incoming_message(message, contacts):
                            processed_items += 1
                
                # Process status updates
                if 'statuses' in value:
                    statuses = value['statuses']
                    
                    print(f"  📊 Processing {len(statuses)} status update(s)")
                    
                    for status in statuses:
                        if process_status_update(status):
                            processed_items += 1
        
        print(f"  ✅ Processed {processed_items} items from {os.path.basename(payload_file)}")
        return True
        
    except json.JSONDecodeError as e:
        print(f"✗ JSON decode error in {payload_file}: {str(e)}")
        return False
    except Exception as e:
        print(f"✗ Error processing {payload_file}: {str(e)}")
        return False

def create_sample_outgoing_messages():
    """Create some sample outgoing messages for demo purposes"""
    sample_contacts = [
        {'wa_id': '1234567890', 'name': 'John Doe'},
        {'wa_id': '9876543210', 'name': 'Jane Smith'},
        {'wa_id': '5555555555', 'name': 'Bob Johnson'}
    ]
    
    sample_messages = [
        "Hello! How are you doing?",
        "Thanks for your message!",
        "Let's schedule a meeting tomorrow.",
        "Great work on the project!",
        "Can you send me the documents?"
    ]
    
    print("\n📤 Creating sample outgoing messages...")
    
    for i, contact in enumerate(sample_contacts):
        message = {
            'wa_id': contact['wa_id'],
            'message_id': f'out_msg_{int(datetime.now().timestamp())}_{i}',
            'type': 'text',
            'text': sample_messages[i % len(sample_messages)],
            'timestamp': datetime.now().isoformat(),
            'status': 'read',
            'from_me': True,
            'contact_name': contact['name'],
            'created_at': datetime.now()
        }
        
        collection.insert_one(message)
        print(f"  ✓ Created outgoing message to {contact['name']}")

def print_database_summary():
    """Print summary of processed data"""
    print("\n" + "="*50)
    print("DATABASE SUMMARY")
    print("="*50)
    
    total_messages = collection.count_documents({})
    incoming_messages = collection.count_documents({'from_me': False})
    outgoing_messages = collection.count_documents({'from_me': True})
    
    print(f"Total messages: {total_messages}")
    print(f"Incoming messages: {incoming_messages}")
    print(f"Outgoing messages: {outgoing_messages}")
    
    # Status breakdown
    status_counts = collection.aggregate([
        {'$group': {'_id': '$status', 'count': {'$sum': 1}}},
        {'$sort': {'count': -1}}
    ])
    
    print("\nMessage status breakdown:")
    for status in status_counts:
        print(f"  {status['_id']}: {status['count']}")
    
    # Contact breakdown
    contact_counts = collection.aggregate([
        {'$group': {'_id': '$wa_id', 'name': {'$first': '$contact_name'}, 'count': {'$sum': 1}}},
        {'$sort': {'count': -1}},
        {'$limit': 10}
    ])
    
    print("\nTop contacts by message count:")
    for contact in contact_counts:
        print(f"  {contact['name']} (+{contact['_id']}): {contact['count']} messages")

def main():
    """Main function to process all webhook payloads"""
    print("🚀 Starting WhatsApp Webhook Payload Processing")
    print("="*50)
    
    try:
        # Test MongoDB connection
        client.admin.command('ping')
        print("✅ MongoDB connection successful")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {str(e)}")
        return
    
    # Download and extract payloads
    payload_files = download_payloads_from_drive()
    
    if not payload_files:
        print("❌ No payload files found. Please check the download.")
        return
    
    print(f"\n📦 Found {len(payload_files)} payload files to process")
    
    # Process each payload file
    successful_files = 0
    failed_files = 0
    
    for payload_file in payload_files:
        if process_webhook_payload(payload_file):
            successful_files += 1
        else:
            failed_files += 1
    
    # Create sample outgoing messages
    create_sample_outgoing_messages()
    
    # Print summary
    print(f"\n📊 PROCESSING COMPLETE")
    print(f"✅ Successfully processed: {successful_files} files")
    print(f"❌ Failed to process: {failed_files} files")
    
    print_database_summary()
    
    print(f"\n🎉 Webhook payload processing completed!")
    print(f"Your WhatsApp Web clone is now ready with real data!")

if __name__ == "__main__":
    main()
