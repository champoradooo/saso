from django.db import migrations, models


def map_roles_forward(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    User.objects.filter(role="super_admin").update(role="admin")
    User.objects.filter(role="assistant").update(role="staff")
    User.objects.exclude(role__in=["admin", "staff"]).update(role="staff")


def map_roles_backward(apps, schema_editor):
    # Best-effort reverse: keep admin/staff as-is.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0003_alter_user_role"),
    ]

    operations = [
        migrations.RunPython(map_roles_forward, map_roles_backward),
        migrations.AlterField(
            model_name="user",
            name="role",
            field=models.CharField(
                choices=[
                    ("admin", "Administrator"),
                    ("staff", "Staff"),
                ],
                default="admin",
                max_length=20,
            ),
        ),
    ]
