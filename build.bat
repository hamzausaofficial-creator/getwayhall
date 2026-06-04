@echo off
echo ==============================================================
echo   Gateway Marriage Hall SystemStand-alone Windows EXE Builder
echo ==============================================================
echo.

REM 1. Activate backend virtual environment & install requirements
echo [Step 1/5] Installing python production dependencies...
if exist "backend\venv\Scripts\activate.bat" (
    call backend\venv\Scripts\activate.bat
) else if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
) else if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else (
    echo [WARNING] Virtual environment activate script not found. Installing into global/current python path...
)

python -m pip install -r backend/requirements.txt
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to install backend python dependencies.
    pause
    exit /b %ERRORLEVEL%
)

REM 2. Build React frontend using Vite
echo.
echo [Step 2/5] Building React JS production assets...
cd frontend
call npm install
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to build React production assets.
    cd ..
    pause
    exit /b %ERRORLEVEL%
)
cd ..

REM 3. Collect Django Static files
echo.
echo [Step 3/5] Collecting Django static assets...
python backend/manage.py collectstatic --noinput
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to collect static files.
    pause
    exit /b %ERRORLEVEL%
)

REM 4. Compile Stand-alone Executable
echo.
echo [Step 4/5] Packaging application using PyInstaller...

REM Release any process locks on dist/build directories
taskkill /F /IM Gateway_Marriage_Hall.exe 2>nul
if exist "build" rmdir /s /q "build"
if exist "dist" rmdir /s /q "dist"

pyinstaller --clean Gateway_Marriage_Hall.spec

if %ERRORLEVEL% neq 0 (
    echo [ERROR] PyInstaller compilation failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ==============================================================
echo   [SUCCESS] Single-file Executable compiled!
echo   You can find the EXE at: dist\Gateway_Marriage_Hall.exe
echo ==============================================================
pause
