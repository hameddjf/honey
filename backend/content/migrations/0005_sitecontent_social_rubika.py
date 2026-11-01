from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("content", "0004_storesettings")]

    operations = [
        migrations.AddField(
            model_name="sitecontent",
            name="social_rubika",
            field=models.URLField(blank=True),
        ),
    ]
