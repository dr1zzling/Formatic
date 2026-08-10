@echo off
echo ================================
echo Kill Processes on Ports 3000 and 3001
echo ================================
echo.

echo Checking port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Found process %%a on port 3000
    taskkill /F /PID %%a 2>nul
)

echo.
echo Checking port 3001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    echo Found process %%a on port 3001
    taskkill /F /PID %%a 2>nul
)

echo.
echo ================================
echo Ports 3000 and 3001 are now free!
echo ================================
echo.
pause
