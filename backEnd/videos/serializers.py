from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import transaction
from videos.models import Profile, Video


class UserSerializer(serializers.ModelSerializer):
    university = serializers.SerializerMethodField()
    course = serializers.SerializerMethodField()
    year = serializers.SerializerMethodField()
    career_interests = serializers.SerializerMethodField()
    bio = serializers.SerializerMethodField()
    profile_pic = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'university', 'course', 'year', 'career_interests', 'bio', 'profile_pic',
        )
        read_only_fields = fields

    def get_university(self, obj):
        return getattr(getattr(obj, 'profile', None), 'university', '')

    def get_course(self, obj):
        return getattr(getattr(obj, 'profile', None), 'course', '')

    def get_year(self, obj):
        return getattr(getattr(obj, 'profile', None), 'year', None)

    def get_career_interests(self, obj):
        return getattr(getattr(obj, 'profile', None), 'career_interests', '')

    def get_bio(self, obj):
        return getattr(getattr(obj, 'profile', None), 'bio', '') or ''

    def get_profile_pic(self, obj):
        profile = getattr(obj, 'profile', None)
        if profile and profile.profile_pic:
            return profile.profile_pic.url
        return None


class ProfileUpdateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150, required=False)
    email = serializers.EmailField(required=False)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    university = serializers.CharField(max_length=255, required=False)
    course = serializers.CharField(max_length=255, required=False)
    year = serializers.IntegerField(min_value=1, max_value=8, required=False)
    career_interests = serializers.CharField(max_length=500, required=False, allow_blank=True)
    bio = serializers.CharField(max_length=500, required=False, allow_blank=True)
    profile_pic = serializers.FileField(required=False)

    def validate_username(self, value):
        username = value.strip()
        user = self.context['request'].user
        if User.objects.exclude(id=user.id).filter(username__iexact=username).exists():
            raise serializers.ValidationError('A user with this username already exists.')
        return username

    def validate_email(self, value):
        email = value.strip().lower()
        user = self.context['request'].user
        if User.objects.exclude(id=user.id).filter(email__iexact=email).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return email

    def update(self, instance, validated_data):
        profile = instance.profile
        user_fields = ('username', 'email', 'first_name', 'last_name')
        profile_fields = ('university', 'course', 'year', 'career_interests', 'bio', 'profile_pic')

        user_update_fields = []
        for field in user_fields:
            if field in validated_data:
                setattr(instance, field, validated_data[field])
                user_update_fields.append(field)
        if user_update_fields:
            instance.save(update_fields=user_update_fields)

        profile_update_fields = []
        for field in profile_fields:
            if field in validated_data:
                value = validated_data[field]
                if isinstance(value, str):
                    value = value.strip()
                setattr(profile, field, value)
                profile_update_fields.append(field)
        if profile_update_fields:
            profile.save(update_fields=profile_update_fields)
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value

    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save(update_fields=['password'])
        return user


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    university = serializers.CharField(max_length=255)
    course = serializers.CharField(max_length=255)
    year = serializers.IntegerField(min_value=1, max_value=8)
    career_interests = serializers.CharField(max_length=500, required=False, allow_blank=True)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return email

    def validate_username(self, value):
        username = value.strip()
        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError('A user with this username already exists.')
        return username

    def create(self, validated_data):
        profile_data = {
            'university': validated_data.pop('university').strip(),
            'course': validated_data.pop('course').strip(),
            'year': validated_data.pop('year'),
            'career_interests': validated_data.pop('career_interests', '').strip(),
        }

        with transaction.atomic():
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                password=validated_data['password'],
                first_name=validated_data.get('first_name', ''),
                last_name=validated_data.get('last_name', ''),
            )
            Profile.objects.update_or_create(user=user, defaults=profile_data)
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs['username'].strip()
        password = attrs['password']

        user = authenticate(username=username, password=password)
        if user is None:
            raise serializers.ValidationError('Invalid username or password.')
        if not user.is_active:
            raise serializers.ValidationError('This account is disabled.')

        attrs['user'] = user
        return attrs


class VideoFeedSerializer(serializers.ModelSerializer):
    """Lightweight serializer for the scrolling video feed."""

    username = serializers.SerializerMethodField()
    profile_pic = serializers.SerializerMethodField()
    user_id = serializers.SerializerMethodField()
    university = serializers.SerializerMethodField()

    class Meta:
        model = Video
        fields = (
            'id', 'user_id', 'username', 'profile_pic', 'university',
            'title', 'description', 'video_url', 'thumbnail_url',
            'like_count', 'comment_count', 'share_count', 'view_count',
            'created_at',
        )
        read_only_fields = fields

    def get_user_id(self, obj):
        return obj.user_id

    def get_username(self, obj):
        return obj.user.username if obj.user else 'Anonymous'

    def get_profile_pic(self, obj):
        if obj.user and hasattr(obj.user, 'profile') and obj.user.profile.profile_pic:
            return obj.user.profile.profile_pic.url
        return None

    def get_university(self, obj):
        return getattr(getattr(obj.user, 'profile', None), 'university', '') if obj.user else ''


class VideoDetailSerializer(serializers.ModelSerializer):
    """Full video detail for a single video."""

    username = serializers.SerializerMethodField()
    profile_pic = serializers.SerializerMethodField()
    user_id = serializers.SerializerMethodField()
    university = serializers.SerializerMethodField()

    class Meta:
        model = Video
        fields = (
            'id', 'user_id', 'username', 'profile_pic', 'university',
            'title', 'description', 'video_url', 'thumbnail_url', 'duration',
            'like_count', 'comment_count', 'share_count', 'view_count',
            'created_at', 'updated_at',
        )
        read_only_fields = fields

    def get_user_id(self, obj):
        return obj.user_id

    def get_username(self, obj):
        return obj.user.username if obj.user else 'Anonymous'

    def get_profile_pic(self, obj):
        if obj.user and hasattr(obj.user, 'profile') and obj.user.profile.profile_pic:
            return obj.user.profile.profile_pic.url
        return None

    def get_university(self, obj):
        return getattr(getattr(obj.user, 'profile', None), 'university', '') if obj.user else ''


class VideoUploadSerializer(serializers.ModelSerializer):
    """Accept video file uploads."""

    username = serializers.SerializerMethodField()
    profile_pic = serializers.SerializerMethodField()
    user_id = serializers.SerializerMethodField()
    university = serializers.SerializerMethodField()
    description = serializers.CharField(required=True, allow_blank=False, trim_whitespace=True)

    class Meta:
        model = Video
        fields = (
            'id', 'user_id', 'username', 'profile_pic', 'university',
            'title', 'description', 'video', 'video_url', 'cloudinary_public_id', 'created_at',
        )
        read_only_fields = ('id', 'user_id', 'username', 'profile_pic', 'university', 'created_at')
        extra_kwargs = {
            'video': {'required': False, 'allow_null': True},
            'video_url': {'required': False, 'allow_blank': True},
            'cloudinary_public_id': {'required': False, 'allow_blank': True},
        }

    def validate(self, attrs):
        if not attrs.get('video') and not attrs.get('video_url'):
            raise serializers.ValidationError('Please provide a video file or an uploaded video URL.')
        return attrs

    def get_user_id(self, obj):
        return obj.user_id

    def get_username(self, obj):
        return obj.user.username if obj.user else 'Anonymous'

    def get_profile_pic(self, obj):
        if obj.user and hasattr(obj.user, 'profile') and obj.user.profile.profile_pic:
            return obj.user.profile.profile_pic.url
        return None

    def get_university(self, obj):
        return getattr(getattr(obj.user, 'profile', None), 'university', '') if obj.user else ''


class GoogleOAuthSerializer(serializers.Serializer):
    """Serializer for Google OAuth authentication."""
    code = serializers.CharField(required=True, help_text="Authorization code from Google")

    def validate_code(self, value):
        if not value or not isinstance(value, str):
            raise serializers.ValidationError("Invalid authorization code.")
        return value


class EmailVerificationSerializer(serializers.Serializer):
    """Serializer for email verification."""
    token = serializers.CharField(required=True, help_text="Email verification token")

    def validate_token(self, value):
        if not value or not isinstance(value, str):
            raise serializers.ValidationError("Invalid verification token.")
        return value


class ResendVerificationEmailSerializer(serializers.Serializer):
    """Serializer for resending verification email."""
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        email = value.strip().lower()
        try:
            user = User.objects.get(email=email)
            if user.is_active:
                raise serializers.ValidationError("This account is already verified.")
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist.")
        return email
