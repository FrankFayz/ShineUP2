from django.urls import path, include
from rest_framework.routers import DefaultRouter
from videos.views import (
    ChangePasswordView, EmailVerificationView, GoogleOAuthView,
    LoginView, ProfileView, RegisterView, ResendVerificationEmailView,
    VerifySessionView, VideoViewSet
)

router = DefaultRouter()
router.register(r'videos', VideoViewSet, basename='video')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/google/', GoogleOAuthView.as_view(), name='auth-google'),
    path('auth/verify-email/', EmailVerificationView.as_view(), name='auth-verify-email'),
    path('auth/resend-verification/', ResendVerificationEmailView.as_view(), name='auth-resend-verification'),
    path('auth/verify-session/', VerifySessionView.as_view(), name='auth-verify-session'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('', include(router.urls)),
]
