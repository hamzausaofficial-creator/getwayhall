@echo off
echo ==============================================================
echo   Gateway Marriage Hall System - Launching Application...
echo ==============================================================
echo.

if exist "dist\Gateway_Marriage_Hall.exe" (
    echo [ℹ] Launching compiled desktop application...
    start "" "dist\Gateway_Marriage_Hall.exe"
) else (
    echo [❌] Error: Compiled executable not found!
    echo Please run 'build.bat' first to compile the application.
    echo.
    pause
)
