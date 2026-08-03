from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('exams', '0003_examination_course_offering'),
    ]

    operations = [
        migrations.AddField(
            model_name='examination',
            name='allow_retake',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterUniqueTogether(
            name='examattempt',
            unique_together=set(),
        ),
    ]
