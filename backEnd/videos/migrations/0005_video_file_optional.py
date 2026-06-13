from django.db import migrations
import cloudinary.models


class Migration(migrations.Migration):

    dependencies = [
        ('videos', '0004_profile_academic_fields'),
    ]

    operations = [
        migrations.AlterField(
            model_name='video',
            name='video',
            field=cloudinary.models.CloudinaryField(
                blank=True,
                folder='shineup-videos',
                max_length=255,
                null=True,
                resource_type='video',
                verbose_name='video',
            ),
        ),
    ]
