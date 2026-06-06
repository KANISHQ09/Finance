@echo off
echo ==========================================
echo  TradingAgents Microservice - Fast Mode
echo ==========================================
echo.

:: Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH.
    echo Please install Python 3.9+ from https://python.org
    pause
    exit /b 1
)

:: Change to script directory
cd /d "%~dp0"

:: Check if venv exists, create if not
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    echo.
)

:: Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

:: Install/upgrade dependencies
echo Installing dependencies...
pip install -r requirements.txt --quiet

:: Copy .env from parent if it exists and local .env doesn't
if not exist ".env" (
    if exist "..\env" (
        echo Copying .env from project root...
        copy "..\env" ".env" >nul
    ) else (
        echo WARNING: No .env file found. Please create trading-agents-server\.env
        echo See .env.example for required variables.
    )
)

:: Start the server
echo.
echo Starting TradingAgents server on http://localhost:8000
echo Press Ctrl+C to stop.
echo.
python main.py
