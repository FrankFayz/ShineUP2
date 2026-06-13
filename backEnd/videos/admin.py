from django.contrib import admin
from videos.models import Profile, Video, Like, Comment, Follow, Share


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'university', 'course', 'year', 'followers_count', 'following_count', 'created_at')
    search_fields = ('user__username', 'user__email', 'university', 'course', 'career_interests')
    readonly_fields = ('id', 'followers_count', 'following_count', 'created_at', 'updated_at')


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'like_count', 'comment_count', 'view_count', 'created_at')
    search_fields = ('title', 'user__username', 'description')
    list_filter = ('created_at', 'like_count', 'view_count')
    readonly_fields = ('id', 'like_count', 'comment_count', 'share_count', 'view_count', 'created_at', 'updated_at')
    fieldsets = (
        ('Video Info', {
            'fields': ('id', 'user', 'title', 'description', 'video', 'thumbnail')
        }),
        ('Cloudinary', {
            'fields': ('video_url', 'cloudinary_public_id', 'thumbnail_url', 'duration')
        }),
        ('Engagement', {
            'fields': ('like_count', 'comment_count', 'share_count', 'view_count')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ('user', 'video', 'created_at')
    search_fields = ('user__username', 'video__title')
    list_filter = ('created_at',)
    readonly_fields = ('id', 'created_at')


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('user', 'video', 'comment_text', 'created_at')
    search_fields = ('user__username', 'video__title', 'comment_text')
    list_filter = ('created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ('follower', 'following', 'created_at')
    search_fields = ('follower__username', 'following__username')
    list_filter = ('created_at',)
    readonly_fields = ('id', 'created_at')


@admin.register(Share)
class ShareAdmin(admin.ModelAdmin):
    list_display = ('user', 'video', 'shared_at')
    search_fields = ('user__username', 'video__title')
    list_filter = ('shared_at',)
    readonly_fields = ('id', 'shared_at')
