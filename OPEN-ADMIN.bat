@echo off
echo.
echo ========================================
echo   SOUNDBITES QUIZ - ADMIN PANEL
echo ========================================
echo.
echo Starting local web server on port 8000...
echo.
start /B python -m http.server 8000
timeout /t 2 /nobreak >nul

start chrome "http://localhost:8000/Admin%%20App/Soundbites%%20Admin/admin.html"

echo Admin panel opened in Chrome!
echo.
echo Server running at: http://localhost:8000
echo Press Ctrl+C in this window to stop the server
echo.
echo Login: admin / admin123
echo.
timeout /t 2 /nobreak > nul
