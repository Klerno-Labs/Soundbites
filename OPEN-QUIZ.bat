@echo off
echo.
echo ========================================
echo   SOUNDBITES QUIZ - OPEN QUIZ
echo ========================================
echo.
echo Starting local web server on port 8000...
echo.
start /B python -m http.server 8000
timeout /t 2 /nobreak >nul

start chrome "http://localhost:8000/index.html"

echo Quiz opened in Chrome!
echo.
echo Server running at: http://localhost:8000
echo Press Ctrl+C in this window to stop the server
echo.
