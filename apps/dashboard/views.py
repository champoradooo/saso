from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Count
from django.db.models.functions import TruncMonth
from django.utils import timezone
from apps.students.models import Student
from apps.discipline.models import DisciplinaryCase
from apps.activities.models import Activity


class DashboardStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        total_students = Student.objects.count()
        completed_students = Student.objects.filter(status='completed').count()
        pending_students = Student.objects.filter(status='pending').count()

        total_cases = DisciplinaryCase.objects.count()
        pending_cases = DisciplinaryCase.objects.filter(status='pending').count()
        under_review_cases = DisciplinaryCase.objects.filter(status='under_review').count()
        resolved_cases = DisciplinaryCase.objects.filter(status='resolved').count()

        minor_cases = DisciplinaryCase.objects.filter(severity='minor').count()
        moderate_cases = DisciplinaryCase.objects.filter(severity='moderate').count()
        major_cases = DisciplinaryCase.objects.filter(severity='major').count()

        recent_cases = DisciplinaryCase.objects.select_related('student').order_by('-created_at')[:5]
        recent_cases_data = [
            {
                'id': c.id,
                'case_number': c.case_number,
                'student_name': c.student.full_name,
                'student_id': c.student.student_id,
                'violation': c.violation,
                'severity': c.severity,
                'status': c.status,
                'incident_date': c.incident_date,
            }
            for c in recent_cases
        ]

        upcoming_activities = Activity.objects.filter(
            event_date__gte=timezone.now().date()
        ).order_by('event_date')[:5]
        upcoming_data = [
            {
                'id': a.id,
                'title': a.title,
                'event_date': a.event_date,
                'location': a.location,
                'organizer': a.organizer,
            }
            for a in upcoming_activities
        ]

        # Monthly violations for the current year
        current_year = timezone.now().year
        monthly_violations = (
            DisciplinaryCase.objects
            .filter(incident_date__year=current_year)
            .annotate(month=TruncMonth('incident_date'))
            .values('month', 'severity')
            .annotate(count=Count('id'))
            .order_by('month')
        )

        months = {i: {'minor': 0, 'moderate': 0, 'major': 0} for i in range(1, 13)}
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        for entry in monthly_violations:
            m = entry['month'].month
            months[m][entry['severity']] = entry['count']

        chart_data = [
            {
                'month': month_names[i - 1],
                'minor': months[i]['minor'],
                'moderate': months[i]['moderate'],
                'major': months[i]['major'],
            }
            for i in range(1, 13)
        ]

        return Response({
            'students': {
                'total': total_students,
                'completed': completed_students,
                'pending': pending_students,
            },
            'cases': {
                'total': total_cases,
                'pending': pending_cases,
                'under_review': under_review_cases,
                'resolved': resolved_cases,
                'minor': minor_cases,
                'moderate': moderate_cases,
                'major': major_cases,
            },
            'recent_cases': recent_cases_data,
            'upcoming_activities': upcoming_data,
            'monthly_chart': chart_data,
        })
