from django.contrib import admin
from .models import DisciplinaryCase


@admin.register(DisciplinaryCase)
class DisciplinaryCaseAdmin(admin.ModelAdmin):
    list_display  = ('case_number', 'student', 'violation', 'severity', 'status', 'incident_date')
    list_filter   = ('severity', 'status')
    search_fields = ('case_number', 'student__last_name', 'student__student_id', 'violation')
    ordering      = ('-incident_date',)
    list_per_page = 25
