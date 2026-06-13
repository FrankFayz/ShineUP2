from rest_framework import viewsets, status, permissions
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.views import APIView
from django.conf import settings
from django.db.models import Sum, F, Prefetch
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from videos.models import Video
from videos.serializers import (
    ChangePasswordSerializer,
    EmailVerificationSerializer,
    GoogleOAuthSerializer,
    LoginSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    ResendVerificationEmailSerializer,
    UserSerializer,
    VideoDetailSerializer,
    VideoUploadSerializer,
    VideoFeedSerializer,
)
from videos.email_service import EmailService
from videos.google_oauth_service import GoogleOAuthService
import cloudinary.uploader
import cloudinary.utils
import time


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # User is inactive until email verification
        user.is_active = False
        user.save(update_fields=['is_active'])
        
        # Send verification email
        try:
            EmailService.send_verification_email(user, email=user.email)
        except Exception as e:
            # If email fails, delete the user and return error
            user.delete()
            return Response({
                'detail': 'Failed to send verification email. Please try again.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
            'detail': 'Account created! Please check your email to verify your account.',
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
        })


class VerifySessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({
            'user': UserSerializer(request.user).data,
        })


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get_dashboard_data(self, user):
        # Optimize queries: use select_related and only fetch needed fields
        videos = Video.objects.filter(user=user).select_related(
            'user', 'user__profile'
        ).only(
            'id', 'user_id', 'title', 'description', 'video_url', 'thumbnail_url',
            'like_count', 'comment_count', 'share_count', 'view_count', 'created_at',
            'user__id', 'user__username', 'user__profile__university', 'user__profile__profile_pic',
        )
        
        # Single aggregation query instead of separate queries
        totals = videos.aggregate(
            total_likes=Sum('like_count'),
            total_views=Sum('view_count'),
            total_comments=Sum('comment_count'),
        )
        stats = {
            'followers': getattr(user.profile, 'followers_count', 0),
            'total_likes': totals['total_likes'] or 0,
            'total_views': totals['total_views'] or 0,
            'total_comments': totals['total_comments'] or 0,
            'total_videos': videos.count(),
        }
        return {
            'user': UserSerializer(user).data,
            'stats': stats,
            'videos': VideoFeedSerializer(videos, many=True).data,
        }

    def get(self, request):
        return Response(self.get_dashboard_data(request.user))

    def patch(self, request):
        serializer = ProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(self.get_dashboard_data(request.user))

    def delete(self, request):
        current_password = request.data.get('current_password', '')
        if not request.user.check_password(current_password):
            return Response(
                {'current_password': ['Current password is incorrect.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        for video in request.user.videos.all():
            if video.cloudinary_public_id:
                cloudinary.uploader.destroy(video.cloudinary_public_id, resource_type='video')
        request.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        Token.objects.filter(user=request.user).delete()
        token, _ = Token.objects.get_or_create(user=request.user)
        return Response({'message': 'Password changed successfully.', 'token': token.key})


class VideoViewSet(viewsets.ModelViewSet):
    """Public video API — list, stream, upload, and delete without authentication."""

    queryset = Video.objects.select_related('user', 'user__profile').all()
    serializer_class = VideoDetailSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    http_method_names = ['get', 'post', 'delete', 'head', 'options']
    filterset_fields = ['title']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'like_count', 'view_count']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action in ('list', 'feed'):
            return queryset.only(
                'id', 'user_id', 'title', 'description', 'video_url', 'thumbnail_url',
                'like_count', 'comment_count', 'share_count', 'view_count', 'created_at',
                'user__id', 'user__username', 'user__profile__university', 'user__profile__profile_pic',
            )
        return queryset

    def get_serializer_class(self):
        if self.action in ('list', 'feed'):
            return VideoFeedSerializer
        if self.action == 'create':
            return VideoUploadSerializer
        return VideoDetailSerializer

    def get_permissions(self):
        if self.action in ('create', 'destroy', 'upload_signature'):
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        video = serializer.save(user=self.request.user)
        # Only update if cloudinary fields are set
        if video.video:
            update_fields = []
            if not video.video_url:
                video.video_url = video.video.url
                update_fields.append('video_url')
            if not video.cloudinary_public_id:
                video.cloudinary_public_id = video.video.public_id
                update_fields.append('cloudinary_public_id')
            if update_fields:
                video.save(update_fields=update_fields)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        video_id = response.data.get('id')
        if video_id:
            try:
                video = Video.objects.get(id=video_id)
                response.data['video_url'] = video.video_url
                response.data['video'] = video.video_url
            except Video.DoesNotExist:
                pass
        return response

    @action(detail=False, methods=['get'], url_path='feed')
    def feed(self, request):
        """GET /api/videos/feed/?limit=15&offset=0 — optimized infinite scroll feed."""
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
            # Add cache headers for 1 minute on client side, 5 minutes server side
            response['Cache-Control'] = 'public, max-age=60'
            response['X-Content-Type-Options'] = 'nosniff'
            return response
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='upload-signature')
    def upload_signature(self, request):
        """Return a short-lived Cloudinary signature so the browser can upload directly."""
        config = cloudinary.config()
        if not config.cloud_name or not config.api_key or not config.api_secret:
            return Response(
                {'detail': 'Cloudinary is not configured on the server.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        timestamp = int(time.time())
        params_to_sign = {
            'folder': 'shineup-videos',
            'timestamp': timestamp,
        }
        signature = cloudinary.utils.api_sign_request(params_to_sign, config.api_secret)
        return Response({
            'cloud_name': config.cloud_name,
            'api_key': config.api_key,
            'timestamp': timestamp,
            'folder': params_to_sign['folder'],
            'signature': signature,
        })

    @action(detail=True, methods=['post'], url_path='view')
    def view(self, request, pk=None):
        """POST /api/videos/{id}/view/ — increment view count efficiently using F()."""
        video = self.get_object()
        # Use F() expression to avoid race conditions and db read
        Video.objects.filter(id=pk).update(view_count=F('view_count') + 1)
        video.refresh_from_db()
        return Response({'view_count': video.view_count})

    def destroy(self, request, *args, **kwargs):
        video = self.get_object()
        if video.user_id != request.user.id:
            return Response(
                {'detail': 'You can only delete your own videos.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if video.cloudinary_public_id:
            cloudinary.uploader.destroy(video.cloudinary_public_id, resource_type='video')
        return super().destroy(request, *args, **kwargs)


class GoogleOAuthView(APIView):
    """Google OAuth authentication endpoint."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """
        Exchange Google authorization code for user token.
        
        Expects: { "code": "authorization_code_from_google" }
        Returns: { "token": "...", "user": {...}, "is_new": true/false }
        """
        serializer = GoogleOAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            code = serializer.validated_data['code']
            user_data = GoogleOAuthService.authenticate_or_create_user(code)
            
            user = user_data['user']
            is_new = user_data['is_new']
            
            # Get or create token
            token, _ = Token.objects.get_or_create(user=user)
            
            response_data = {
                'token': token.key,
                'user': UserSerializer(user).data,
                'is_new': is_new,
                'email_verified': user.is_active,
            }
            
            if is_new:
                response_data['detail'] = 'Welcome to ShineUP!'
            
            return Response(response_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'detail': f'Google authentication failed: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        """Get Google OAuth authorization URL for frontend."""
        try:
            oauth_url = GoogleOAuthService.get_oauth_url()
            return Response({'oauth_url': oauth_url})
        except Exception as e:
            return Response({
                'detail': f'Failed to generate OAuth URL: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


class EmailVerificationView(APIView):
    """Email verification endpoint."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """
        Verify email using token.
        
        Expects: { "token": "verification_token" }
        Returns: { "message": "Email verified", "user": {...} }
        """
        serializer = EmailVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token = serializer.validated_data['token']
        user = EmailService.verify_email(token)
        
        if user is None:
            return Response({
                'detail': 'Invalid or expired verification token.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get or create token
        auth_token, _ = Token.objects.get_or_create(user=user)
        
        return Response({
            'message': 'Email verified successfully! Your account is now active.',
            'token': auth_token.key,
            'user': UserSerializer(user).data,
        }, status=status.HTTP_200_OK)


class ResendVerificationEmailView(APIView):
    """Resend verification email endpoint."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """
        Resend verification email.
        
        Expects: { "email": "user@example.com" }
        Returns: { "message": "Verification email sent" }
        """
        serializer = ResendVerificationEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        try:
            user = request.user if request.user.is_authenticated else None
            if not user:
                from django.contrib.auth.models import User as DjangoUser
                user = DjangoUser.objects.get(email=email)
            
            # Send verification email
            EmailService.send_verification_email(user, email=email)
            
            return Response({
                'message': 'Verification email sent! Please check your email.',
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'detail': f'Failed to send email: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
