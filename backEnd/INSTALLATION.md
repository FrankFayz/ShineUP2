# Django Backend Installation Guide

## Step-by-Step Setup

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)
- PostgreSQL (or use Neon Cloud - already configured)
- Cloudinary account (credentials in .env)

### Windows Installation

#### 1. Open Command Prompt and navigate to backend folder
```bash
cd backend
```

#### 2. Run automatic setup
```bash
setup.bat
```

This will automatically:
- Create Python virtual environment
- Install all dependencies from requirements.txt
- Run database migrations
- Create superuser (admin account)
- Collect static files

#### 3. Start Development Server
```bash
venv\Scripts\activate.bat
python manage.py runserver
```

Server runs on: **http://localhost:8000**

---

### macOS/Linux Installation

#### 1. Navigate to backend folder
```bash
cd backend
```

#### 2. Run automatic setup
```bash
bash setup.sh
```

Or manually:

```bash
# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput
```

#### 3. Start Development Server
```bash
source venv/bin/activate
python manage.py runserver
```

Server runs on: **http://localhost:8000**

---

## After Installation

### Access Points

1. **API Root**
   - http://localhost:8000/api/
   - Browse all available endpoints

2. **Interactive API Docs (Swagger)**
   - http://localhost:8000/api/docs/
   - Test API endpoints directly

3. **Alternative Docs (ReDoc)**
   - http://localhost:8000/api/redoc/

4. **Admin Dashboard**
   - http://localhost:8000/admin/
   - Login with superuser credentials created during setup
   - Manage all models and data

5. **Health Check**
   - http://localhost:8000/health/
   - Returns: `{"status": "ok"}`

---

## Common Commands

### Database Operations
```bash
# Create migrations after model changes
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Rollback last migration
python manage.py migrate videos zero

# See migration status
python manage.py showmigrations
```

### User Management
```bash
# Create superuser
python manage.py createsuperuser

# Create regular user (in shell)
python manage.py shell
>>> from django.contrib.auth.models import User
>>> User.objects.create_user('username', 'email@example.com', 'password')
```

### Django Shell
```bash
# Interactive Python shell with Django context
python manage.py shell

# Useful queries:
>>> from django.contrib.auth.models import User
>>> from videos.models import Video
>>> User.objects.all()  # List all users
>>> Video.objects.all()  # List all videos
>>> Video.objects.filter(user__username='john_doe')  # Filter videos
```

### Static Files
```bash
# Collect static files for production
python manage.py collectstatic --noinput

# Clear collected files
python manage.py collectstatic --clear --noinput
```

### Testing
```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test videos

# Run specific test class
python manage.py test videos.tests.VideoModelTest

# Run with verbose output
python manage.py test -v 2
```

---

## Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'django'"

**Solution**: Make sure virtual environment is activated
```bash
# Windows
venv\Scripts\activate.bat

# macOS/Linux
source venv/bin/activate
```

### Issue: "Could not connect to database"

**Solution**: Check .env file has correct DATABASE_URL
```bash
# Verify connection string format:
postgresql://username:password@host:port/database?sslmode=require&channel_binding=require
```

### Issue: "Cloudinary authentication failed"

**Solution**: Verify credentials in .env file
```bash
CLOUDINARY_CLOUD_NAME=dkqp3j62k
CLOUDINARY_API_KEY=482274357235245
CLOUDINARY_API_SECRET=I6o4ZekGQMZewi12Cl7UiTZaTw4
```

### Issue: "Permission denied" on setup.sh (macOS/Linux)

**Solution**: Make script executable
```bash
chmod +x setup.sh
bash setup.sh
```

### Issue: Port 8000 already in use

**Solution**: Use different port
```bash
python manage.py runserver 8001
```

---

## Production Deployment

### Pre-deployment Checklist
- [ ] Set `DEBUG=False` in .env
- [ ] Use strong `SECRET_KEY`
- [ ] Set proper `ALLOWED_HOSTS`
- [ ] Use production database
- [ ] Configure CORS properly
- [ ] Set up HTTPS
- [ ] Run `collectstatic`
- [ ] Configure email for notifications

### Deploy with Gunicorn
```bash
# Install gunicorn
pip install gunicorn

# Run with gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

### Deploy with Docker
```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
```

### Environment Variables for Production
```bash
DEBUG=False
SECRET_KEY=your-super-secret-key
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DATABASE_URL=postgresql://...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
FRONTEND_URL=https://yourdomain.com
```

---

## Performance Optimization

### Enable Caching
```python
# settings.py
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}
```

### Database Connection Pooling
Already configured in settings.py with `conn_max_age=600`

### Compress Responses
Already enabled with WhiteNoise

### CDN for Static Files
Configure Cloudinary or CloudFront for static file delivery

---

## API Rate Limiting (Optional)

Add to settings.py:
```python
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    }
}
```

---

## Monitoring & Logging

### Enable Detailed Logging
Already configured in settings.py

### Log Files
Logs output to console by default. For file logging, add:

```python
LOGGING = {
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'backend.log',
        },
    },
}
```

---

## Support Resources

- **Django Docs**: https://docs.djangoproject.com/
- **DRF Docs**: https://www.django-rest-framework.org/
- **Cloudinary Docs**: https://cloudinary.com/documentation
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Neon Console**: https://console.neon.tech/

---

## Next Steps

1. ✅ Backend is running
2. 🔗 Connect frontend to API endpoints
3. 📝 Test all endpoints with Swagger docs
4. 🚀 Deploy to production
5. 📊 Monitor and optimize performance

Happy coding! 🎉
