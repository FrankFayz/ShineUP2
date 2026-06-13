from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import F
from cloudinary.models import CloudinaryField
import uuid

class Profile(models.Model):
    """Extended user profile with video platform specific data"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    university = models.CharField(max_length=255, blank=True)
    course = models.CharField(max_length=255, blank=True)
    year = models.PositiveSmallIntegerField(blank=True, null=True)
    career_interests = models.CharField(max_length=500, blank=True)
    bio = models.TextField(blank=True, null=True, max_length=500)
    profile_pic = CloudinaryField('image', blank=True, null=True, folder='shineup-profiles')
    followers_count = models.IntegerField(default=0)
    following_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} Profile"

    class Meta:
        ordering = ['-created_at']


class Video(models.Model):
    """Video content with engagement metrics"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='videos', null=True, blank=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    
    # Cloudinary video storage
    video = CloudinaryField('video', folder='shineup-videos', resource_type='video', blank=True, null=True)
    video_url = models.URLField(max_length=500, blank=True, null=True)
    cloudinary_public_id = models.CharField(max_length=500, blank=True, null=True)
    
    # Thumbnail
    thumbnail = CloudinaryField('image', blank=True, null=True, folder='shineup-thumbnails')
    thumbnail_url = models.URLField(max_length=500, blank=True, null=True)
    
    # Video metadata
    duration = models.IntegerField(blank=True, null=True, help_text="Duration in seconds")
    
    # Engagement metrics
    like_count = models.IntegerField(default=0)
    comment_count = models.IntegerField(default=0)
    share_count = models.IntegerField(default=0)
    view_count = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['user']),
            models.Index(fields=['user', '-created_at']),  # For user's video feeds
            models.Index(fields=['-view_count']),  # For trending sort
            models.Index(fields=['-like_count']),  # For popular sort
            models.Index(fields=['cloudinary_public_id']),  # For video lookups
        ]


class Like(models.Model):
    """Video likes with user and video relationship"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='likes')
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'video')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'video']),
        ]

    def __str__(self):
        return f"{self.user.username} liked {self.video.title}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Increment like count atomically
        Video.objects.filter(id=self.video_id).update(like_count=F('like_count') + 1)

    def delete(self, *args, **kwargs):
        video_id = self.video_id
        super().delete(*args, **kwargs)
        # Decrement like count atomically
        Video.objects.filter(id=video_id).update(like_count=F('like_count') - 1)


class Comment(models.Model):
    """Video comments with user and video relationship"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='comments')
    comment_text = models.TextField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['video', '-created_at']),
        ]

    def __str__(self):
        return f"Comment by {self.user.username} on {self.video.title}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Increment comment count atomically
        Video.objects.filter(id=self.video_id).update(comment_count=F('comment_count') + 1)

    def delete(self, *args, **kwargs):
        video_id = self.video_id
        super().delete(*args, **kwargs)
        # Decrement comment count atomically
        Video.objects.filter(id=video_id).update(comment_count=F('comment_count') - 1)


class Follow(models.Model):
    """User follow relationships"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following')
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followers')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'following')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['follower', 'following']),
        ]

    def __str__(self):
        return f"{self.follower.username} follows {self.following.username}"

    def save(self, *args, **kwargs):
        if self.follower == self.following:
            raise ValueError("Users cannot follow themselves")
        super().save(*args, **kwargs)
        
        # Update follower counts
        self.following.profile.followers_count = self.following.followers.count()
        self.following.profile.save()
        
        self.follower.profile.following_count = self.follower.following.count()
        self.follower.profile.save()

    def delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)
        
        # Update follower counts
        self.following.profile.followers_count = self.following.followers.count()
        self.following.profile.save()
        
        self.follower.profile.following_count = self.follower.following.count()
        self.follower.profile.save()


class Share(models.Model):
    """Track video shares for analytics"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shares')
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='shares')
    shared_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-shared_at']

    def __str__(self):
        return f"{self.user.username} shared {self.video.title}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update video share count
        self.video.share_count = self.video.shares.count()
        self.video.save()

    def delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)
        # Update video share count
        self.video.share_count = self.video.shares.count()
        self.video.save()


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.get_or_create(user=instance)


class EmailVerificationToken(models.Model):
    """Email verification tokens with expiration"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='email_verification_token')
    token = models.CharField(max_length=255, unique=True, db_index=True)
    email = models.EmailField()  # Store email in case user changes it during verification
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Email verification for {self.user.username}"

    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at


class GoogleOAuthToken(models.Model):
    """Store Google OAuth tokens for users"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='google_oauth_token')
    google_id = models.CharField(max_length=255, unique=True, db_index=True)
    access_token = models.TextField()
    refresh_token = models.TextField(blank=True, null=True)
    token_expires_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Google OAuth for {self.user.username}"

