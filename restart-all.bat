@echo off
echo ============================================
echo  SMART LMS - Complete Restart
echo ============================================
echo.

echo [1/5] Stopping any running servers...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/5] Clearing frontend cache...
cd frontend
if exist .angular rmdir /s /q .angular
if exist dist rmdir /s /q dist
cd ..

echo [3/5] Starting backend server...
start "Smart LMS Backend" cmd /k "cd backend && node server.js"
timeout /t 5 /nobreak >nul

echo [4/5] Starting frontend server...
start "Smart LMS Frontend" cmd /k "cd frontend && ng serve --host 0.0.0.0 --port 4200"

echo.
echo ============================================
echo  Servers Starting!
echo ============================================
echo  Backend: http://192.168.8.168:3000
echo  Frontend: http://192.168.8.168:4200
echo.
echo  Wait 2-3 minutes for frontend to build...
echo  Then open: http://192.168.8.168:4200
echo ============================================
echo.
echo Press any key to close this window...
pause >nul
