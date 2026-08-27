@echo off
setlocal

cd /d "%~dp0"

where node.exe >nul 2>&1
if errorlevel 1 (
  echo Node.js is required to run the S-Center prototype.
  echo Install Node.js and run this file again.
  pause
  exit /b 1
)

call npm.cmd run open
if errorlevel 1 (
  echo.
  echo The S-Center prototype could not be started.
  pause
  exit /b 1
)

endlocal
