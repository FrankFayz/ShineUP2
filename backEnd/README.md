# ShineUP Backend - Django API

Production-ready video platform backend with Cloudinary CDN integration, PostgreSQL database, and real-world engagement tracking.

## Technology Stack

- **Framework**: Django 4.2 + Django REST Framework
- **Database**: PostgreSQL (Neon Cloud)
- **Video Storage**: Cloudinary CDN
- **Authentication**: Django Token Authentication
- **Documentation**: Swagger/Redoc with drf-yasg

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Environment Setup

Create a `.env` file in the backend folder with your credentials:

```env
DATABASE_URL=postgresql://user:password@host/database
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SECRET_KEY=your-super-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
FRONTEND_URL=http://localhost:5173
```

### 3. Database Migrations

```bash
python manage.py migrate
```

### 4. Create Admin User

```bash
python manage.py createsuperuser
```

### 5. Run Development Server

```bash
python manage.py runserver
```

Server runs on `http://localhost:8000`

## Database Schema

### User & Profile
- **Django User Model** (built-in)
  - username, email, password, first_name, last_name
  - is_active, is_staff, date_joined

- **Profile** (Extended)
  - user (OneToOne → User)
  - bio, profile_pic (Cloudinary)
  - followers_count, following_count
  - created_at, updated_at

### Videos & Content
- **Video**
  - id (UUID)
  - user (FK → User)
  - title, description
  - video (CloudinaryField), video_url, cloudinary_public_id
  - thumbnail (CloudinaryField), thumbnail_url
  - duration (seconds)
  - like_count, comment_count, share_count, view_count
  - created_at, updated_at

- **Comment**
  - id (UUID)
  - user (FK → User), video (FK → Video)
  - comment_text
  - created_at, updated_at

- **Like**
  - id (UUID)
  - user (FK → User), video (FK → Video)
  - created_at
  - Unique constraint: (user, video)

- **Share**
  - id (UUID)
  - user (FK → User), video (FK → Video)
  - shared_at

- **Follow**
  - id (UUID)
  - follower (FK → User), following (FK → User)
  - created_at
  - Unique constraint: (follower, following)

## API Endpoints

### Documentation
- **Swagger UI**: `http://localhost:8000/api/docs/`
- **ReDoc**: `http://localhost:8000/api/redoc/`
- **Health Check**: `http://localhost:8000/health/`

### Authentication

All endpoints support Token Authentication:

```http
Authorization: Token <your_token>
```

### User Endpoints

#### List/Search Users
```http
GET /api/users/
GET /api/users/?search=username
GET /api/users/?ordering=date_joined

Response:
{
  "count": 100,
  "next": "http://...",
  "previous": null,
  "results": [
    {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe"
    }
  ]
}
```

#### Get User Profile
```http
GET /api/users/{id}/profile/

Response:
{
  "id": "uuid",
  "user": {...},
  "bio": "I love videos!",
  "profile_pic": "cloudinary_url",
  "followers_count": 150,
  "following_count": 45,
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### Get User Videos
```http
GET /api/users/{id}/videos/?page=1

Response:
{
  "count": 50,
  "next": "...",
  "results": [...]
}
```

#### Get User Followers
```http
GET /api/users/{id}/followers/?page=1
```

#### Get User Following
```http
GET /api/users/{id}/following/?page=1
```

#### Follow User
```http
POST /api/users/{id}/follow/
Authorization: Token <token>

Response:
{
  "message": "User followed",
  "following": true
}
```

#### Unfollow User
```http
DELETE /api/users/{id}/unfollow/
Authorization: Token <token>
```

#### Check Follow Status
```http
GET /api/users/{id}/check_follow/

Response:
{
  "following": true|false
}
```

### Video Endpoints

#### List Videos
```http
GET /api/videos/
GET /api/videos/?search=title
GET /api/videos/?user__username=john_doe
GET /api/videos/?ordering=-created_at
GET /api/videos/?page=2&limit=20

Response:
{
  "count": 500,
  "next": "...",
  "results": [
    {
      "id": "uuid",
      "user": 1,
      "username": "creator",
      "profile_pic": "url",
      "title": "My Video",
      "description": "...",
      "video_url": "cloudinary_url",
      "thumbnail_url": "cloudinary_url",
      "like_count": 42,
      "comment_count": 15,
      "share_count": 3,
      "view_count": 128,
      "created_at": "2024-01-01T00:00:00Z",
      "liked_by_user": false
    }
  ]
}
```

#### Get Video Detail
```http
GET /api/videos/{id}/

Response:
{
  "id": "uuid",
  "user": {...},
  "username": "creator",
  "profile_pic": "url",
  "followers_count": 150,
  "title": "My Video",
  "description": "...",
  "video_url": "cloudinary_url",
  "thumbnail_url": "cloudinary_url",
  "duration": 120,
  "like_count": 42,
  "comment_count": 15,
  "share_count": 3,
  "view_count": 128,
  "comments": [
    {
      "id": "uuid",
      "user": 2,
      "username": "commenter",
      "profile_pic": "url",
      "comment_text": "Great video!",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "liked_by_user": false,
  "user_follows_creator": false,
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### Upload Video
```http
POST /api/videos/
Authorization: Token <token>
Content-Type: multipart/form-data

Form Data:
  - title: "My Video Title"
  - description: "Video description" (optional)
  - video: <video_file> (supports mp4, webm, etc.)

Response:
{
  "id": "uuid",
  "title": "My Video Title",
  "description": "Video description",
  "video": "cloudinary_url",
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### Delete Video
```http
DELETE /api/videos/{id}/
Authorization: Token <token>

Response: 204 No Content
```

#### Like Video
```http
POST /api/videos/{id}/like/
Authorization: Token <token>

Response:
{
  "message": "Video liked",
  "liked": true
}
```

#### Unlike Video
```http
DELETE /api/videos/{id}/unlike/
Authorization: Token <token>
```

#### Check Like Status
```http
GET /api/videos/{id}/check_like/
Authorization: Token <token> (optional)

Response:
{
  "liked": true|false
}
```

#### View Video (increment view count)
```http
POST /api/videos/{id}/view/

Response:
{
  "view_count": 129
}
```

#### Share Video
```http
POST /api/videos/{id}/share/
Authorization: Token <token>

Response:
{
  "message": "Share recorded",
  "share_count": 4
}
```

#### Add Comment
```http
POST /api/videos/{id}/add_comment/
Authorization: Token <token>
Content-Type: application/json

{
  "comment_text": "Great video!"
}

Response:
{
  "id": "uuid",
  "user": 1,
  "username": "commenter",
  "profile_pic": "url",
  "comment_text": "Great video!",
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### Get Video Comments
```http
GET /api/videos/{id}/comments/?page=1

Response:
{
  "count": 15,
  "next": "...",
  "results": [...]
}
```

### Comment Endpoints

#### List Comments
```http
GET /api/comments/
GET /api/comments/?page=1
```

#### Delete Comment
```http
DELETE /api/comments/{id}/
Authorization: Token <token>

Response: 204 No Content
```

## Real-World Features

✅ **Video Storage**: Cloudinary CDN with automatic 9:16 aspect ratio  
✅ **Thumbnail Generation**: Automatic extraction from uploaded videos  
✅ **Engagement Tracking**: Real-time like, comment, view, share counts  
✅ **User System**: Profiles with followers/following  
✅ **Authentication**: Token-based secure authentication  
✅ **Access Control**: Users can only modify their own content  
✅ **Pagination**: Efficient data loading with page-based pagination  
✅ **Search & Filter**: Full-text search and filtering capabilities  
✅ **Admin Dashboard**: Django admin with all models  
✅ **API Documentation**: Interactive Swagger/Redoc docs  

## Cloudinary Integration

Videos are stored in Cloudinary with:
- Auto-transformation to 9:16 mobile aspect ratio
- Automatic thumbnail generation
- CDN delivery for performance
- Secure URL generation

Public IDs are stored for safe deletion.

## Production Deployment

### Environment Setup
```bash
export DEBUG=False
export SECRET_KEY=<your-secret-key>
export DATABASE_URL=<your-production-db-url>
export ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
```

### Collect Static Files
```bash
python manage.py collectstatic --noinput
```

### Run with Gunicorn
```bash
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

## Admin Panel

Access Django admin at `http://localhost:8000/admin/`

- Manage users and profiles
- View and moderate videos, comments
- Track engagement metrics
- Manage follows and relationships

## Error Handling

All endpoints return standardized responses:

### Success (200-201)
```json
{
  "data": {...},
  "message": "Success"
}
```

### Error (400-500)
```json
{
  "error": "Error description",
  "detail": "Detailed error message"
}
```

Common Status Codes:
- `200`: OK
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `500`: Server Error

## Development

### Run Tests
```bash
python manage.py test
```

### Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Shell Access
```bash
python manage.py shell
```

## API Rate Limiting

Consider adding rate limiting for production:

```python
# settings.py
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

## Caching

Implement caching for better performance:

```python
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
    }
}
```

## Support & Documentation

- Django: https://docs.djangoproject.com/
- Django REST Framework: https://www.django-rest-framework.org/
- Cloudinary: https://cloudinary.com/documentation
- PostgreSQL: https://www.postgresql.org/docs/

## License

MIT License - See LICENSE file for details
