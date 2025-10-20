@echo off
REM Force refresh admin panel
start chrome --new-window --disable-cache "file:///C:/Users/Somli/OneDrive/Desktop/Quiz/admin/admin.html"
echo.
echo Admin panel opened with cache disabled!
echo.
echo If tabs still missing:
echo 1. Press Ctrl+Shift+R to hard refresh
echo 2. Press F12, go to Network tab, check "Disable cache"
echo 3. Login and verify all 4 tabs appear
pause
