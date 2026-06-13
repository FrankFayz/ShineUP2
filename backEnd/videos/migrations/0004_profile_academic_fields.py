from django.db import migrations, models


def create_missing_profiles(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    Profile = apps.get_model('videos', 'Profile')

    existing_profile_user_ids = Profile.objects.values_list('user_id', flat=True)
    missing_users = User.objects.exclude(id__in=existing_profile_user_ids)
    Profile.objects.bulk_create(Profile(user=user) for user in missing_users)


class Migration(migrations.Migration):
    dependencies = [
        ('videos', '0003_unique_user_email'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='career_interests',
            field=models.CharField(blank=True, max_length=500),
        ),
        migrations.AddField(
            model_name='profile',
            name='course',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='profile',
            name='university',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='profile',
            name='year',
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.RunPython(create_missing_profiles, migrations.RunPython.noop),
    ]
