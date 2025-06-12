@echo off
echo ========================================
echo    Cabinet Warehouse Management System
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if package.json exists
if not exist "package.json" (
    echo ERROR: package.json not found
    echo Please make sure you're running this from the project root directory
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    echo This may take a few minutes on first run...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
)

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo Creating .env file from template...
    copy ".env.example" ".env"
    echo.
    echo IMPORTANT: Please configure your database settings in .env file
    echo Default settings are configured for SQLite database
    echo.
)

REM Create server data directory if it doesn't exist
if not exist "server\data" (
    echo Creating server data directory...
    mkdir "server\data"
)

REM Get local IP address for LAN access
echo Getting network information...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set "ip=%%a"
    goto :found_ip
)
:found_ip
set ip=%ip: =%

echo.
echo ========================================
echo Starting Cabinet WMS...
echo ========================================
echo.
echo Frontend (React): http://localhost:5173
echo Backend (API): http://localhost:3001
if defined ip (
    echo LAN access: http://%ip%:5173
)
echo.
echo Default login credentials:
echo Username: admin
echo Password: admin123
echo.
echo Press Ctrl+C to stop both servers
echo ========================================
echo.

REM Start both frontend and backend servers concurrently
echo Starting both frontend and backend servers...
npm run dev

REM If we get here, the servers stopped
echo.
echo Servers stopped.
pause