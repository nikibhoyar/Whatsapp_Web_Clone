@echo off
echo ========================================
echo Fixing WhatsApp Web Clone Setup
echo ========================================
echo.

echo Creating Next.js project structure...

echo Creating app directory...
if not exist "app" mkdir app

echo Creating components directory...
if not exist "components" mkdir components
if not exist "components\ui" mkdir components\ui

echo Creating lib directory...
if not exist "lib" mkdir lib

echo Creating hooks directory...
if not exist "hooks" mkdir hooks

echo Creating scripts directory...
if not exist "scripts" mkdir scripts

echo Installing dependencies...
npm install

echo.
echo ✅ Project structure created!
echo.
echo Now you can run:
echo npx shadcn@latest init
echo.
echo Then continue with the setup...
pause
