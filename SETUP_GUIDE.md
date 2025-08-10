# WhatsApp Web Clone - Complete PC Setup Guide

This guide will walk you through setting up the WhatsApp Web clone on your PC from scratch.

## 📋 Prerequisites

Before we start, make sure you have these installed on your PC:

### 1. Node.js (Required)
- **Download**: https://nodejs.org/
- **Version**: 18.0 or higher
- **Check installation**: Open Command Prompt/Terminal and run:
  \`\`\`bash
  node --version
  npm --version
  \`\`\`

### 2. Git (Required)
- **Download**: https://git-scm.com/
- **Check installation**:
  \`\`\`bash
  git --version
  \`\`\`

### 3. Code Editor (Recommended)
- **VS Code**: https://code.visualstudio.com/
- Or any editor of your choice

### 4. MongoDB Atlas Account (Required)
- **Sign up**: https://www.mongodb.com/atlas
- Free tier is sufficient for this project

## 🚀 Step-by-Step Setup

### Step 1: Create MongoDB Database

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com/
2. **Sign up/Login** to your account
3. **Create a new cluster**:
   - Choose "Free" tier (M0)
   - Select your preferred region
   - Click "Create Cluster"

4. **Create Database User**:
   - Go to "Database Access" in left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Username: `whatsapp_user`
   - Password: Generate a secure password (save it!)
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

5. **Configure Network Access**:
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - Choose "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

6. **Get Connection String**:
   - Go to "Clusters" in left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password
   - Save this connection string!

### Step 2: Download and Setup Project

1. **Create project folder**:
   \`\`\`bash
   mkdir whatsapp-web-clone
   cd whatsapp-web-clone
   \`\`\`

2. **Initialize the project**:
   \`\`\`bash
   npm init -y
   \`\`\`

3. **Install dependencies**:
   \`\`\`bash
   npm install next@14.0.0 react@18 react-dom@18 typescript@5 @types/node@20 @types/react@18 @types/react-dom@18 tailwindcss@3.4.17 autoprefixer@10.0.1 postcss@8 mongodb@6.3.0 socket.io@4.7.4 socket.io-client@4.7.4 adm-zip@0.5.10 lucide-react@0.294.0 class-variance-authority@0.7.1 clsx@2.1.1 tailwind-merge@2.5.5 tailwindcss-animate@1.0.7
   \`\`\`

4. **Install shadcn/ui components**:
   \`\`\`bash
   npx shadcn@latest init
   \`\`\`
   - Choose "Yes" for TypeScript
   - Choose "Tailwind CSS" for styling
   - Choose "Yes" for src/ directory
   - Choose your preferred color scheme

### Step 3: Create Project Structure

Create these folders and files in your project directory:

\`\`\`
whatsapp-web-clone/
├── app/
│   ├── api/
│   │   ├── contacts/
│   │   ├── messages/
│   │   ├── webhook/
│   │   └── socket/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
├── hooks/
├── lib/
├── scripts/
├── .env.local
├── package.json
├── tailwind.config.js
└── tsconfig.json
\`\`\`

### Step 4: Configure Environment Variables

1. **Create `.env.local` file** in your project root:
   \`\`\`bash
   # MongoDB Connection String (replace with your actual connection string)
   MONGODB_URI=mongodb+srv://whatsapp_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/whatsapp?retryWrites=true&w=majority

   # Next.js Configuration
   NEXTAUTH_SECRET=your-super-secret-key-here
   NEXTAUTH_URL=http://localhost:3000

   # For production deployment (add later)
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   \`\`\`

2. **Replace placeholders**:
   - Replace `YOUR_PASSWORD` with your MongoDB user password
   - Replace `cluster0.xxxxx.mongodb.net` with your actual cluster URL
   - Generate a random secret for `NEXTAUTH_SECRET`

### Step 5: Copy Project Files

You'll need to create all the project files. Here's the quickest way:

1. **Copy the code from the previous response** into the appropriate files
2. **Or download from GitHub** (if you have the repository)

### Step 6: Initialize Tailwind CSS

1. **Create `tailwind.config.js`**:
   \`\`\`javascript
   /** @type {import('tailwindcss').Config} */
   module.exports = {
     content: [
       './pages/**/*.{js,ts,jsx,tsx,mdx}',
       './components/**/*.{js,ts,jsx,tsx,mdx}',
       './app/**/*.{js,ts,jsx,tsx,mdx}',
     ],
     theme: {
       extend: {},
     },
     plugins: [],
   }
   \`\`\`

2. **Create `postcss.config.js`**:
   \`\`\`javascript
   module.exports = {
     plugins: {
       tailwindcss: {},
       autoprefixer: {},
     },
   }
   \`\`\`

### Step 7: Process Webhook Payloads

1. **Run the payload processor**:
   \`\`\`bash
   npm run process-payloads
   \`\`\`

   This will:
   - Download the webhook payloads from Google Drive
   - Process all JSON files
   - Insert data into your MongoDB database
   - Create sample conversations

2. **Verify the data**:
   - Check your MongoDB Atlas dashboard
   - You should see a "whatsapp" database with "processed_messages" collection

### Step 8: Start the Development Server

1. **Start the app**:
   \`\`\`bash
   npm run dev
   \`\`\`

2. **Open your browser**:
   - Go to: http://localhost:3000
   - You should see the WhatsApp Web interface with real conversation data!

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. MongoDB Connection Error
\`\`\`
Error: MongoNetworkError: failed to connect to server
\`\`\`
**Solutions**:
- Check your connection string in `.env.local`
- Ensure your IP is whitelisted in MongoDB Atlas
- Verify your username/password are correct

#### 2. Node.js Version Error
\`\`\`
Error: Node.js version not supported
\`\`\`
**Solution**:
- Update Node.js to version 18 or higher
- Download from: https://nodejs.org/

#### 3. Port Already in Use
\`\`\`
Error: Port 3000 is already in use
\`\`\`
**Solution**:
- Kill the process using port 3000
- Or run on different port: `npm run dev -- -p 3001`

#### 4. Module Not Found Errors
\`\`\`
Error: Cannot find module 'xyz'
\`\`\`
**Solution**:
- Delete `node_modules` folder
- Delete `package-lock.json`
- Run `npm install` again

#### 5. Payload Processing Failed
\`\`\`
Error downloading payloads
\`\`\`
**Solution**:
- Check your internet connection
- Try running the script again
- Or download payloads manually

### Manual Payload Processing (If Automatic Fails)

1. **Download payloads manually**:
   - Go to: https://drive.google.com/file/d/1pWZ9HaHLza8k080pP_GhvKIl8j2voy-U/view?usp=sharing
   - Download the zip file
   - Extract to `payloads/` folder in your project

2. **Modify the script** to use local files:
   \`\`\`javascript
   // In scripts/process-payloads.js, replace the download function
   async function getLocalPayloads() {
     const payloadFiles = [];
     const payloadDir = './payloads';
     
     if (fs.existsSync(payloadDir)) {
       const files = fs.readdirSync(payloadDir);
       files.forEach(file => {
         if (file.endsWith('.json')) {
           payloadFiles.push(path.join(payloadDir, file));
         }
       });
     }
     
     return payloadFiles;
   }
   \`\`\`

## 🎯 Verification Checklist

After setup, verify everything works:

- [ ] MongoDB connection successful
- [ ] Payload processing completed
- [ ] Development server starts without errors
- [ ] WhatsApp Web interface loads at http://localhost:3000
- [ ] Contact list shows conversations
- [ ] Clicking contacts shows message history
- [ ] Can send new messages
- [ ] Messages appear in real-time

## 🚀 Next Steps

Once everything is working:

1. **Customize the UI** to match your preferences
2. **Add more features** like file uploads, voice messages
3. **Deploy to production** using Vercel
4. **Set up real webhook endpoints** for live data

## 📞 Need Help?

If you encounter any issues:

1. **Check the console** for error messages
2. **Verify environment variables** are set correctly
3. **Ensure all dependencies** are installed
4. **Check MongoDB connection** in Atlas dashboard
5. **Try restarting** the development server

## 🎉 Success!

If you see the WhatsApp Web interface with conversations, congratulations! You've successfully set up the WhatsApp Web clone on your PC.

The app now includes:
- ✅ Real webhook data from the provided payloads
- ✅ WhatsApp Web-like interface
- ✅ Real-time messaging with Socket.IO
- ✅ MongoDB data persistence
- ✅ Responsive design for mobile and desktop
- ✅ Message status tracking (sent, delivered, read)
