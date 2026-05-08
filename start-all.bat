@echo off
echo.
echo ================================
echo  MLM Platform - Full Stack Setup
echo ================================
echo.

REM Colors aren't supported in CMD, so we'll just use text

echo [1] Installing Backend Dependencies...
python -m pip install pydantic pydantic-settings fastapi uvicorn -q 2>nul

echo [2] Starting Backend API (Port 8000)...
cd app
start "Backend API" python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

cd ..
timeout /t 3 /nobreak

echo [3] Installing Frontend Dependencies...
cd frontend
call npm install 2>nul

echo [4] Starting Frontend Dev Server (Port 3000)...
start "Frontend Dev" cmd /c npm run dev

cd ..

echo.
echo ================================
echo ✅ Both servers are starting!
echo ================================
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔌 Backend:  http://localhost:8000
echo 📚 API Docs: http://localhost:8000/docs
echo.
echo Press any key to continue...
pause >nul
