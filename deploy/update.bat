@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\powershell\Update-App.ps1"
exit /b %ERRORLEVEL%
