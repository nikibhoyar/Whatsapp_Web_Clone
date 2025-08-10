const fs = require("fs")
const path = require("path")

console.log("🔍 Checking WhatsApp Web Clone Setup...\n")

// Check Node.js version
const nodeVersion = process.version
const majorVersion = Number.parseInt(nodeVersion.slice(1).split(".")[0])

if (majorVersion < 18) {
  console.log("❌ Node.js version too old. Please upgrade to Node.js 18 or higher.")
  console.log(`   Current version: ${nodeVersion}`)
  console.log("   Download from: https://nodejs.org/\n")
  process.exit(1)
} else {
  console.log(`✅ Node.js version: ${nodeVersion}`)
}

// Check if .env.local exists
if (!fs.existsSync(".env.local")) {
  console.log("❌ .env.local file not found")
  console.log("   Creating template .env.local file...\n")

  const envTemplate = `# MongoDB Connection String
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/whatsapp?retryWrites=true&w=majority

# Next.js Configuration
NEXTAUTH_SECRET=your-super-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# For production deployment
NEXT_PUBLIC_APP_URL=http://localhost:3000
`

  fs.writeFileSync(".env.local", envTemplate)
  console.log("✅ Created .env.local template")
  console.log("⚠️  Please update it with your actual MongoDB connection string\n")
} else {
  console.log("✅ .env.local file exists")

  // Check if MongoDB URI is configured
  const envContent = fs.readFileSync(".env.local", "utf8")
  if (envContent.includes("username:password@cluster")) {
    console.log("⚠️  Please update MONGODB_URI in .env.local with your actual connection string")
  } else {
    console.log("✅ MongoDB URI appears to be configured")
  }
}

// Check required directories
const requiredDirs = ["app", "components", "lib", "hooks", "scripts"]
const missingDirs = []

requiredDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    missingDirs.push(dir)
  }
})

if (missingDirs.length > 0) {
  console.log("📁 Creating missing directories...")
  missingDirs.forEach((dir) => {
    fs.mkdirSync(dir, { recursive: true })
    console.log(`   Created: ${dir}/`)
  })
  console.log("✅ All directories created\n")
} else {
  console.log("✅ All required directories exist\n")
}

// Check package.json scripts
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"))
const requiredScripts = ["dev", "build", "start", "process-payloads"]
const missingScripts = requiredScripts.filter((script) => !packageJson.scripts[script])

if (missingScripts.length > 0) {
  console.log("❌ Missing required scripts in package.json:")
  missingScripts.forEach((script) => console.log(`   - ${script}`))
  console.log("")
} else {
  console.log("✅ All required scripts are configured\n")
}

console.log("🎯 Setup Status Summary:")
console.log("========================")
console.log(`Node.js: ${majorVersion >= 18 ? "✅" : "❌"} ${nodeVersion}`)
console.log(`Environment: ${fs.existsSync(".env.local") ? "✅" : "❌"} .env.local`)
console.log(`Directories: ${missingDirs.length === 0 ? "✅" : "❌"} Required folders`)
console.log(`Scripts: ${missingScripts.length === 0 ? "✅" : "❌"} Package.json scripts`)

console.log("\n🚀 Next Steps:")
console.log("==============")
console.log("1. Update .env.local with your MongoDB connection string")
console.log("2. Copy all the project files from the code blocks")
console.log("3. Run: npm install")
console.log("4. Run: npm run process-payloads")
console.log("5. Run: npm run dev")
console.log("6. Open: http://localhost:3000")

console.log("\n📚 Need help? Check SETUP_GUIDE.md for detailed instructions.")
