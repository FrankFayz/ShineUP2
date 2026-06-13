# 🔐 Google OAuth Setup Guide for ShineUP

This guide walks you through setting up Google OAuth authentication for ShineUP.

---

## ✅ What's Been Fixed

1. ✅ **Backend Package**: Installed `requests` and `google-auth` libraries
2. ✅ **Google OAuth Service**: Enhanced to accept JWT tokens from Google Sign-In
3. ✅ **Frontend Component**: Updated GoogleOAuthButton with better error handling
4. ✅ **Styling**: Added beautiful CSS for OAuth button and divider
5. ✅ **Database Models**: EmailVerificationToken and GoogleOAuthToken ready

---

## 🚀 Setup Steps

### Step 1: Create Google OAuth Credentials

1. **Go to Google Cloud Console**:
   - Open [Google Cloud Console](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create a new project**:
   - Click the project dropdown at the top
   - Click "New Project"
   - Name it: `ShineUP`
   - Click "Create"

3. **Enable Google+ API**:
   - In the search bar, type "Google+ API"
   - Click on "Google+ API"
   - Click "Enable"

4. **Create OAuth 2.0 Credentials**:
   - Go to **Credentials** (left sidebar)
   - Click **"+ Create Credentials"**
   - Choose **"OAuth 2.0 Client ID"**
   - Select **"Web application"**
   - Name it: `ShineUP Web Client`

5. **Configure Authorized Origins and Redirect URIs**:

   **Authorized JavaScript Origins** (add both):
   ```
   http://localhost:5173
   http://localhost:3000
   ```

   **Authorized Redirect URIs** (add both):
   ```
   http://localhost:5173
   http://localhost:3000
   ```

6. **Copy Your Credentials**:
   - Copy the **Client ID** (ends with `.apps.googleusercontent.com`)
   - Copy the **Client Secret** (keep this private!)

---

### Step 2: Configure Backend (.env)

Edit `backEnd/.env` and fill in your Google OAuth credentials:

```env
# Google OAuth Configuration
GOOGLE_OAUTH_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=YOUR_CLIENT_SECRET
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8000/api/auth/google/callback/
```

**Example**:
```env
GOOGLE_OAUTH_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-aBcDeFgHiJkLmNoPqRsTuVwXyZ
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8000/api/auth/google/callback/
```

---

### Step 3: Configure Frontend (.env.local)

Edit `frontEnd/.env.local` and add your Google Client ID:

```env
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

---

### Step 4: Configure Email Service (Optional but Recommended)

To enable email verification, configure Gmail SMTP in `backEnd/.env`:

1. **Enable 2-Step Verification on Gmail**:
   - Go to [myaccount.google.com/security](https://myaccount.google.com/security)
   - Enable "2-Step Verification"

2. **Create App-Specific Password**:
   - Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Windows Computer"
   - Google will generate a 16-character password

3. **Add to .env**:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=xxxx xxxx xxxx xxxx  # 16-character password from above
   DEFAULT_FROM_EMAIL=noreply@shineup.com
   FRONTEND_URL=http://localhost:5173
   ```

---

### Step 5: Verify Installation

1. **Check Backend Packages**:
   ```bash
   cd backEnd
   pip list | grep google-auth
   pip list | grep requests
   ```
   Should show:
   - `google-auth 2.26.2`
   - `requests 2.31.0`

2. **Start Backend**:
   ```bash
   cd backEnd
   python manage.py runserver
   ```
   You should see: `Starting development server at http://127.0.0.1:8000/`

3. **Start Frontend** (in another terminal):
   ```bash
   cd frontEnd
   npm run dev
   ```
   You should see: `Local: http://localhost:5173/`

---

## 🧪 Testing Google OAuth

1. **Navigate to Auth Page**: `http://localhost:5173/auth`

2. **Try Google Sign-In**:
   - Click "Sign In with Google"
   - Google should ask for permission
   - If successful:
     - ✅ New users: Redirected to profile page
     - ✅ Existing users: Redirected to home page

3. **Check Email Verification** (if configured):
   - If new user: Check email for verification link
   - Click link to activate account

---

## 🔧 Troubleshooting

### Error: "The OAuth client was not found" (401)

**Cause**: Invalid or missing `GOOGLE_OAUTH_CLIENT_ID`

**Fix**:
1. Verify `VITE_GOOGLE_CLIENT_ID` in `frontEnd/.env.local`
2. Verify `GOOGLE_OAUTH_CLIENT_ID` in `backEnd/.env`
3. Both should match the Client ID from Google Cloud Console

---

### Error: "Failed to load Google Sign-In script"

**Cause**: Network issue or incorrect Client ID

**Fix**:
1. Check internet connection
2. Verify Client ID is correct
3. Hard refresh browser (Ctrl+Shift+R)

---

### Error: "ModuleNotFoundError: No module named 'requests'"

**Cause**: Package not installed

**Fix**:
```bash
cd backEnd
pip install -r requirements.txt
```

---

### Error: Email not being sent

**Cause**: Gmail SMTP not configured or app password incorrect

**Fix**:
1. Verify EMAIL_HOST_PASSWORD is the 16-character app password
2. Check FRONTEND_URL points to your frontend URL
3. Test with:
   ```bash
   cd backEnd
   python manage.py shell
   from django.core.mail import send_mail
   send_mail('Test', 'Test body', 'your-email@gmail.com', ['recipient@gmail.com'])
   ```

---

## 📋 Environment Variables Checklist

### Backend `.env` ✅
- [ ] DATABASE_URL (Neon PostgreSQL)
- [ ] CLOUDINARY_CLOUD_NAME
- [ ] CLOUDINARY_API_KEY
- [ ] CLOUDINARY_API_SECRET
- [ ] SECRET_KEY (Django)
- [ ] GOOGLE_OAUTH_CLIENT_ID
- [ ] GOOGLE_OAUTH_CLIENT_SECRET
- [ ] GOOGLE_OAUTH_REDIRECT_URI
- [ ] EMAIL_HOST_USER (optional)
- [ ] EMAIL_HOST_PASSWORD (optional)
- [ ] FRONTEND_URL

### Frontend `.env.local` ✅
- [ ] VITE_GOOGLE_CLIENT_ID
- [ ] VITE_API_BASE_URL

---

## 🎨 Features After Setup

✅ **Google Sign-In Button** - Beautiful, responsive button on auth page
✅ **Email Verification** - Secure email activation links (24-hour expiry)
✅ **Auto User Creation** - New users automatically created from Google profile
✅ **Error Handling** - User-friendly error messages with recovery options
✅ **Responsive Design** - Works on mobile and desktop

---

## 📚 Additional Resources

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Django Email Documentation](https://docs.djangoproject.com/en/stable/topics/email/)
- [Google Sign-In for Web](https://developers.google.com/identity/gsi/web)

---

**Questions?** Check the Django server logs or browser console for detailed error messages.
