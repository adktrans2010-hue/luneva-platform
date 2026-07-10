@echo off
title Luneva Psy local site
cd /d "%~dp0"

set PORT=3000

netstat -ano | findstr /R /C:":%PORT% .*LISTENING" >nul
if %errorlevel%==0 (
  set PORT=3001
)

set URL=http://localhost:%PORT%

netstat -ano | findstr /R /C:":%PORT% .*LISTENING" >nul
if %errorlevel%==0 (
  echo.
  echo Site is already running.
  echo Opening: %URL%
  start "" "%URL%"
  echo.
  echo You can close this window.
  pause
  exit /b 0
)

echo.
echo Starting Luneva Psy local site...
echo Address: %URL%
echo.
echo Keep this window open while working with the site.
echo Close this window to stop the site.
echo.

start "" "%URL%"
npm.cmd run dev -- -p %PORT%

echo.
echo Server stopped.
pause
