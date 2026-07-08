@echo off
setlocal

if "%~1"=="" (
    echo Usage: restore_database.bat path\to\backup.sql
    echo.
    echo Example:
    echo   restore_database.bat backups\backup_hallora_20260708_120000.sql
    exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\powershell\Restore-Database.ps1" -BackupFile "%~1"
exit /b %ERRORLEVEL%
