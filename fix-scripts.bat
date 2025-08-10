@echo off
echo ========================================
echo Fixing WhatsApp Web Clone Scripts
echo ========================================
echo.

echo Checking project structure...

if not exist "scripts" (
    echo Creating scripts directory...
    mkdir scripts
)

echo Installing required dependencies...
npm install mongodb adm-zip dotenv

echo.
echo Checking .env.local file...
if not exist ".env.local" (
    echo Creating .env.local template...
    echo # MongoDB Connection String > .env.local
    echo MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/whatsapp?retryWrites=true^&w=majority >> .env.local
    echo. >> .env.local
    echo # Next.js Configuration >> .env.local
    echo NEXTAUTH_SECRET=your-super-secret-key-here >> .env.local
    echo NEXTAUTH_URL=http://localhost:3000 >> .env.local
    echo.
    echo ⚠️  Please update .env.local with your actual MongoDB connection string!
)

echo.
echo ✅ Setup fixed! Now you can run:
echo npm run process-payloads
echo.
pause
