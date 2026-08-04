import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('academics', '0004_credithourpolicy_remove_course_department_and_more'),
        ('exams', '0002_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='examination',
            name='course',
        ),
        migrations.AddField(
            model_name='examination',
            name='course_offering',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name='examinations',
                to='academics.courseoffering',
            ),
            preserve_default=False,
        ),
    ]
