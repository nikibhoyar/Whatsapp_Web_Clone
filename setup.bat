@echo off
echo ========================================
echo WhatsApp Web Clone - Windows Setup
echo ========================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please download and install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✓ Node.js is installed
echo.

echo Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed!
    pause
    exit /b 1
)

echo ✓ npm is installed
echo.

echo Installing project dependencies...
npm install

if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)

echo ✓ Dependencies installed successfully
echo.

echo Checking for .env.local file...
if not exist ".env.local" (
    echo Creating .env.local file...
    echo # MongoDB Connection String > .env.local
    echo MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/whatsapp?retryWrites=true^&w=majority >> .env.local
    echo. >> .env.local
    echo # Next.js Configuration >> .env.local
    echo NEXTAUTH_SECRET=your-super-secret-key-here >> .env.local
    echo NEXTAUTH_URL=http://localhost:3000 >> .env.local
    echo. >> .env.local
    echo IMPORTANT: Please update .env.local with your actual MongoDB connection string!
    echo.
)

echo ✓ Environment file ready
echo.

echo Setup completed successfully!
echo.
echo Next steps:
echo 1. Update .env.local with your MongoDB connection string
echo 2. Run: npm run process-payloads
echo 3. Run: npm run dev
echo 4. Open: http://localhost:3000
echo.
pause
