@echo off
REM Smart LMS Quick Start Script for Windows

echo ========================================
echo   Starting Smart LMS
echo ========================================
echo.

REM Check if directories exist
if not exist "backend" (
    echo Error: backend directory not found!
    echo Please run this script from the Smart_LMS root directory.
    pause
    exit /b 1
)

if not exist "frontend" (
    echo Error: frontend directory not found!
    echo Please run this script from the Smart_LMS root directory.
    pause
    exit /b 1
)

echo [1/2] Starting Backend Server...
start "Smart LMS - Backend" cmd /k "cd backend && npm start"

timeout /t 2 /nobreak > nul

echo [2/2] Starting Frontend Server...
start "Smart LMS - Frontend" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo   Smart LMS is starting!
echo ========================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:4200
echo.
echo Two new terminal windows have been opened.
echo Close those windows to stop the servers.
echo.
pause
