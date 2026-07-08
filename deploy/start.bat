@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\powershell\Start-App.ps1"
exit /b %ERRORLEVEL%
