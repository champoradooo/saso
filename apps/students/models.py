from django.db import models


class Student(models.Model):
    STATUS_COMPLETED = 'completed'
    STATUS_PENDING = 'pending'
    STATUS_CHOICES = [
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_PENDING, 'Pending'),
    ]

    student_id = models.CharField(max_length=20, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    course = models.CharField(max_length=100)
    year_level = models.PositiveSmallIntegerField()
    address = models.TextField()
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Archive Information
    is_archived = models.BooleanField(default=False)

    is_archived = models.BooleanField(default=False)

    archive_reason = models.CharField(
    max_length=50,
    blank=True,
    null=True
)

    archived_date = models.DateField(
    blank=True,
    null=True
)

    class Meta:
        ordering = ['last_name', 'first_name']
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.last_name}, {self.first_name} ({self.student_id})"

    @property
    def full_name(self):
        parts = [self.first_name]
        if self.middle_name:
            parts.append(self.middle_name[0] + '.')
        parts.append(self.last_name)
        return ' '.join(parts)


class ClearanceRequirement(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='clearance_requirements')
    requirement = models.CharField(max_length=200)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.student} - {self.requirement}"


class CounselingRecord(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='counseling_records')
    session_date = models.DateField()
    notes = models.TextField()
    next_session = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-session_date']

    def __str__(self):
        return f"{self.student} - {self.session_date}"
