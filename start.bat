@echo off
echo ========================================
echo  MBG Dashboard - Starting Servers...
echo ========================================
echo.
echo [1/2] Starting Backend (FastAPI on port 8000)...
start "MBG Backend" cmd /k "cd /d D:\kimi\nadira\backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 3 /nobreak > nul

echo [2/2] Starting Frontend (Vite on port 5173)...
start "MBG Frontend" cmd /k "cd /d D:\kimi\nadira\frontend && npm run dev"
timeout /t 3 /nobreak > nul

echo.
echo ========================================
echo  Servers started!
echo  Backend API: http://localhost:8000
echo  Frontend:    http://localhost:5173
echo  API Docs:    http://localhost:8000/docs
echo ========================================
echo.
echo Buka browser ke: http://localhost:5173
echo.
pause
