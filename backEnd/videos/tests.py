from django.test import TestCase
from django.contrib.auth.models import User
from videos.models import Video, Profile, Like, Comment, Follow


class VideoModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.video = Video.objects.create(
            user=self.user,
            title='Test Video',
            description='Test Description'
        )

    def test_video_creation(self):
        self.assertEqual(self.video.title, 'Test Video')
        self.assertEqual(self.video.user, self.user)
        self.assertEqual(self.video.like_count, 0)

    def test_video_like_increment(self):
        like = Like.objects.create(user=self.user, video=self.video)
        self.video.refresh_from_db()
        self.assertEqual(self.video.like_count, 1)


class ProfileModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com'
        )

    def test_profile_creation(self):
        profile = Profile.objects.get(user=self.user)
        self.assertEqual(profile.followers_count, 0)
        self.assertEqual(profile.following_count, 0)
