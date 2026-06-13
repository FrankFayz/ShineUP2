"""Google OAuth integration for ShineUP."""
import os
import requests
import json
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from django.conf import settings
from django.contrib.auth.models import User
from videos.models import GoogleOAuthToken, Profile
from django.utils import timezone
from datetime import timedelta


class GoogleOAuthService:
    """Handles Google OAuth authentication."""

    GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
    GOOGLE_USER_INFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

    @staticmethod
    def verify_id_token(token):
        """
        Verify Google ID token and extract user info.
        
        Args:
            token: JWT ID token from Google Sign-In
            
        Returns:
            dict: Decoded token with user info (email, name, picture, sub)
        """
        try:
            # Verify the token and get claims
            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                settings.GOOGLE_OAUTH_CLIENT_ID
            )
            
            # Token is valid, return user info
            return {
                'google_id': idinfo.get('sub'),
                'email': idinfo.get('email'),
                'name': idinfo.get('name'),
                'picture': idinfo.get('picture'),
            }
        except ValueError as e:
            # Invalid token
            raise ValueError(f"Invalid token: {str(e)}")

    @staticmethod
    def get_oauth_url():
        """Generate Google OAuth authorization URL."""
        from urllib.parse import urlencode
        
        params = {
            'client_id': settings.GOOGLE_OAUTH_CLIENT_ID,
            'redirect_uri': settings.GOOGLE_OAUTH_REDIRECT_URI,
            'response_type': 'code',
            'scope': 'openid email profile',
            'access_type': 'offline',  # For refresh token
        }
        return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"

    @staticmethod
    def exchange_code_for_token(code):
        """
        Exchange authorization code for access token.
        
        Args:
            code: Authorization code from Google
            
        Returns:
            dict: Token response with access_token, refresh_token, etc.
        """
        payload = {
            'code': code,
            'client_id': settings.GOOGLE_OAUTH_CLIENT_ID,
            'client_secret': settings.GOOGLE_OAUTH_CLIENT_SECRET,
            'redirect_uri': settings.GOOGLE_OAUTH_REDIRECT_URI,
            'grant_type': 'authorization_code',
        }
        
        try:
            response = requests.post(GoogleOAuthService.GOOGLE_TOKEN_URL, data=payload, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            raise Exception(f"Failed to exchange code for token: {str(e)}")

    @staticmethod
    def get_user_info(access_token):
        """
        Get user info from Google using access token.
        
        Args:
            access_token: Google access token
            
        Returns:
            dict: User info (email, name, picture, etc.)
        """
        headers = {'Authorization': f'Bearer {access_token}'}
        
        try:
            response = requests.get(
                GoogleOAuthService.GOOGLE_USER_INFO_URL,
                headers=headers,
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            raise Exception(f"Failed to get user info: {str(e)}")

    @staticmethod
    def authenticate_or_create_user(token_or_code):
        """
        Authenticate user with Google ID token or authorization code.
        
        Args:
            token_or_code: JWT ID token from Google Sign-In OR authorization code
            
        Returns:
            dict: User data and authentication response
        """
        # Try to verify as JWT token first (for ID token flow)
        try:
            user_info = GoogleOAuthService.verify_id_token(token_or_code)
            google_id = user_info.get('google_id')
            email = user_info.get('email')
            name = user_info.get('name', '')
            picture = user_info.get('picture', '')
        except ValueError:
            # If JWT verification fails, try authorization code flow
            try:
                token_response = GoogleOAuthService.exchange_code_for_token(token_or_code)
                access_token = token_response.get('access_token')
                refresh_token = token_response.get('refresh_token', '')
                expires_in = token_response.get('expires_in', 3600)
                
                # Get user info
                user_info = GoogleOAuthService.get_user_info(access_token)
                google_id = user_info.get('id')
                email = user_info.get('email')
                name = user_info.get('name', '')
                picture = user_info.get('picture', '')
            except Exception as e:
                raise ValueError(f"Invalid token or code: {str(e)}")
        
        # Try to get existing user by Google ID
        try:
            oauth_token = GoogleOAuthToken.objects.get(google_id=google_id)
            user = oauth_token.user
            is_new = False
            
            # Update refresh token if provided
            if 'refresh_token' in locals() and refresh_token:
                oauth_token.refresh_token = refresh_token
                oauth_token.token_expires_at = timezone.now() + timedelta(seconds=expires_in)
                oauth_token.save()
        except GoogleOAuthToken.DoesNotExist:
            # Check if user exists by email
            try:
                user = User.objects.get(email=email)
                is_new = False
            except User.DoesNotExist:
                # Create new user
                username = email.split('@')[0]
                counter = 1
                original_username = username
                
                # Ensure unique username
                while User.objects.filter(username=username).exists():
                    username = f"{original_username}{counter}"
                    counter += 1
                
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    first_name=name.split()[0] if name else '',
                    last_name=' '.join(name.split()[1:]) if len(name.split()) > 1 else '',
                )
                user.is_active = True  # Auto-activate Google OAuth users
                user.save()
                
                # Create profile
                Profile.objects.get_or_create(user=user)
            
            is_new = True
            
            # Create OAuth token record
            GoogleOAuthToken.objects.create(
                user=user,
                google_id=google_id,
                access_token=access_token,
                refresh_token=refresh_token,
                token_expires_at=timezone.now() + timedelta(seconds=expires_in),
            )
        
        return {
            'user': user,
            'is_new': is_new,
            'google_id': google_id,
            'email': email,
            'name': name,
            'picture': picture,
        }

    @staticmethod
    def refresh_access_token(user):
        """
        Refresh Google access token for user.
        
        Args:
            user: User instance
            
        Returns:
            str: New access token
        """
        try:
            oauth_token = GoogleOAuthToken.objects.get(user=user)
            
            if not oauth_token.refresh_token:
                raise Exception("No refresh token available")
            
            payload = {
                'client_id': settings.GOOGLE_OAUTH_CLIENT_ID,
                'client_secret': settings.GOOGLE_OAUTH_CLIENT_SECRET,
                'refresh_token': oauth_token.refresh_token,
                'grant_type': 'refresh_token',
            }
            
            response = requests.post(GoogleOAuthService.GOOGLE_TOKEN_URL, data=payload, timeout=10)
            response.raise_for_status()
            
            token_response = response.json()
            access_token = token_response.get('access_token')
            expires_in = token_response.get('expires_in', 3600)
            
            # Update token in database
            oauth_token.access_token = access_token
            oauth_token.token_expires_at = timezone.now() + timedelta(seconds=expires_in)
            oauth_token.save()
            
            return access_token
        except GoogleOAuthToken.DoesNotExist:
            raise Exception("User has no Google OAuth token")
