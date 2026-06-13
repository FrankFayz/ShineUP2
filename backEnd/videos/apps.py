from django.apps import AppConfig


class VideosConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'videos'

    def ready(self):
        # Auto-create Profile when User is created
        from django.db.models.signals import post_save
        from django.contrib.auth.models import User
        from videos.models import Profile

        def create_profile(sender, instance, created, **kwargs):
            if created:
                Profile.objects.get_or_create(user=instance)

        post_save.connect(create_profile, sender=User, dispatch_uid='create_profile')
