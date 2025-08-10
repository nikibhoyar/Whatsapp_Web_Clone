#!/bin/bash

echo "========================================"
echo "WhatsApp Web Clone - Linux/Mac Setup"
echo "========================================"
echo

# Check Node.js
echo "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js is not installed!"
    echo "Please download and install Node.js from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js is installed: $(node --version)"
echo

# Check npm
echo "Checking npm installation..."
if ! command -v npm &> /dev/null; then
    echo "❌ ERROR: npm is not installed!"
    exit 1
fi

echo "✅ npm is installed: $(npm --version)"
echo

# Install dependencies
echo "Installing project dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ ERROR: Failed to install dependencies!"
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file..."
    cat > .env.local << EOL
# MongoDB Connection String
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/whatsapp?retryWrites=true&w=majority

# Next.js Configuration
NEXTAUTH_SECRET=your-super-secret-key-here
NEXTAUTH_URL=http://localhost:3000
EOL
    echo "⚠️  IMPORTANT: Please update .env.local with your actual MongoDB connection string!"
    echo
fi

echo "✅ Environment file ready"
echo

echo "🎉 Setup completed successfully!"
echo
echo "Next steps:"
echo "1. Update .env.local with your MongoDB connection string"
echo "2. Run: npm run process-payloads"
echo "3. Run: npm run dev"
echo "4. Open: http://localhost:3000"
echo
