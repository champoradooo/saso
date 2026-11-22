from django.contrib import admin
from .models import Student, ClearanceRequirement, CounselingRecord


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display  = ('student_id', 'last_name', 'first_name', 'course', 'year_level', 'status', 'created_at')
    list_filter   = ('status', 'course', 'year_level')
    search_fields = ('student_id', 'first_name', 'last_name', 'email')
    ordering      = ('last_name', 'first_name')
    list_per_page = 25


@admin.register(ClearanceRequirement)
class ClearanceAdmin(admin.ModelAdmin):
    list_display  = ('student', 'requirement', 'is_completed')
    list_filter   = ('is_completed',)
    search_fields = ('student__last_name', 'student__student_id', 'requirement')


@admin.register(CounselingRecord)
class CounselingAdmin(admin.ModelAdmin):
    list_display  = ('student', 'session_date', 'next_session')
    search_fields = ('student__last_name', 'student__student_id')
    ordering      = ('-session_date',)
