@echo off
echo ========================================
echo Updating WhatsApp Web Clone Dependencies
echo ========================================
echo.

echo Updating to latest versions...
npm update

echo.
echo Installing any missing dependencies...
npm install

echo.
echo Checking for vulnerabilities...
npm audit fix

echo.
echo ✅ Dependencies updated successfully!
echo.
echo You can now run:
echo npm run dev
echo.
pause
