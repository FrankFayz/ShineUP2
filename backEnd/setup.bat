@echo off
REM ShineUP Backend Setup Script for Windows

echo.
echo 🚀 ShineUP Django Backend Setup
echo ================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python first.
    pause
    exit /b 1
)

echo ✅ Python found

REM Create virtual environment
echo 📦 Creating virtual environment...
python -m venv venv

REM Activate virtual environment
echo 🔌 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo 📥 Installing dependencies...
pip install -r requirements.txt

REM Run migrations
echo 🗄️  Running database migrations...
python manage.py migrate

REM Create superuser
echo 👤 Creating superuser...
python manage.py createsuperuser

REM Collect static files
echo 📁 Collecting static files...
python manage.py collectstatic --noinput

echo.
echo ✅ Setup complete!
echo.
echo To start the development server, run:
echo   venv\Scripts\activate.bat
echo   python manage.py runserver
echo.
echo Then visit:
echo   API: http://localhost:8000/api/
echo   Docs: http://localhost:8000/api/docs/
echo   Admin: http://localhost:8000/admin/
echo.
pause
