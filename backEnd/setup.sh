#!/bin/bash

# ShineUP Backend Setup Script

echo "🚀 ShineUP Django Backend Setup"
echo "================================"

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null
then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

echo "✅ Python 3 found"

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate || . venv/Scripts/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Run migrations
echo "🗄️  Running database migrations..."
python manage.py migrate

# Create superuser
echo "👤 Creating superuser..."
python manage.py createsuperuser

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the development server, run:"
echo "  source venv/bin/activate  (or venv\\Scripts\\activate on Windows)"
echo "  python manage.py runserver"
echo ""
echo "Then visit:"
echo "  API: http://localhost:8000/api/"
echo "  Docs: http://localhost:8000/api/docs/"
echo "  Admin: http://localhost:8000/admin/"
