@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0apply-profile-squash.ps1"
if errorlevel 1 (
  echo.
  echo Patch failed. No changes were applied if the check failed.
  pause
  exit /b 1
)
echo.
echo Done.
pause
