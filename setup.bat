@echo off
REM GastroLog Backend Setup Script for Windows
REM This script automates the setup process for the backend

setlocal enabledelayedexpansion

echo.
echo ?? GastroLog Backend Setup
echo ==========================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ? Node.js is not installed. Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ? Node.js %NODE_VERSION% found
echo.

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ? npm is not installed
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ? npm %NPM_VERSION% found
echo.

REM Check if Docker is available
docker --version >nul 2>&1
if errorlevel 1 (
    echo ??  Docker not found. You'll need to set up PostgreSQL and Redis manually.
    echo    See BACKEND_SETUP.md for instructions.
    echo.
) else (
    echo ? Docker found
    echo.
    set /p USE_DOCKER="Do you want to use Docker for PostgreSQL and Redis? (y/n): "
    if /i "!USE_DOCKER!"=="y" (
        echo ?? Starting Docker containers...
        docker-compose up -d
        echo ? Docker containers started
        echo    Waiting for services to be ready...
        timeout /t 5 /nobreak
        echo.
    )
)

REM Install dependencies
echo ?? Installing Node dependencies...
call npm install
if errorlevel 1 (
    echo ? Failed to install dependencies
    pause
    exit /b 1
)
echo ? Dependencies installed
echo.

REM Generate Prisma client
echo ?? Generating Prisma client...
call npm run prisma:generate
if errorlevel 1 (
    echo ? Failed to generate Prisma client
    pause
    exit /b 1
)
echo ? Prisma client generated
echo.

REM Run migrations
echo ???  Running database migrations...
call npm run prisma:migrate
if errorlevel 1 (
    echo ? Failed to run migrations
    pause
    exit /b 1
)
echo ? Database migrations completed
echo.

echo ?? Setup complete!
echo.
echo To start the development server, run:
echo   npm run dev
echo.
echo Backend will be available at: http://localhost:3001
echo.
echo Documentation:
echo   - API endpoints: see API_EXAMPLES.md
echo   - Database setup: see BACKEND_SETUP.md
echo.

pause
