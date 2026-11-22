from django.http import FileResponse
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from apps.students.models import Student
from apps.discipline.models import DisciplinaryCase
from apps.activities.models import Activity
from apps.lost_found.models import LostFoundItem
from apps.dashboard.views import DashboardStatsView

from .pdf import (
    generate_students_pdf,
    generate_discipline_pdf,
    generate_activities_pdf,
    generate_performance_pdf,
    generate_lost_found_pdf,
)


class StudentReportView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):

        status_filter = request.query_params.get('status')

        qs = Student.objects.all()

        if status_filter:
            qs = qs.filter(status=status_filter)

        qs = qs.order_by(
            'last_name',
            'first_name'
        )

        buffer = generate_students_pdf(
            list(qs)
        )

        return FileResponse(
            buffer,
            as_attachment=True,
            filename=f'student-records-{status_filter or "all"}.pdf',
            content_type='application/pdf'
        )


class DisciplineReportView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):

        severity = request.query_params.get('severity')
        status = request.query_params.get('status')
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        period = request.query_params.get('period')

        qs = DisciplinaryCase.objects.select_related(
            'student'
        ).all()

        filters = []

        # YEAR
        if year:
            try:
                qs = qs.filter(
                    incident_date__year=int(year)
                )

                filters.append(
                    f'Year: {year}'
                )
            except ValueError:
                pass

        # MONTH
        if (
            period == 'Monthly'
            and month
            and month != 'All'
        ):

            month_map = {
                'January': 1,
                'February': 2,
                'March': 3,
                'April': 4,
                'May': 5,
                'June': 6,
                'July': 7,
                'August': 8,
                'September': 9,
                'October': 10,
                'November': 11,
                'December': 12,
            }

            if month in month_map:
                qs = qs.filter(
                    incident_date__month=month_map[month]
                )

                filters.append(
                    f'Month: {month}'
                )

        # SEVERITY
        if severity:
            qs = qs.filter(
                severity=severity
            )

            filters.append(
                f'Severity: {severity.capitalize()}'
            )

        # STATUS
        if status:
            qs = qs.filter(
                status=status
            )

            filters.append(
                f'Status: {status.replace("_", " ").title()}'
            )

        qs = qs.order_by(
            '-incident_date'
        )

        buffer = generate_discipline_pdf(
            list(qs),
            ' | '.join(filters)
            if filters
            else None
        )

        return FileResponse(
            buffer,
            as_attachment=True,
            filename='disciplinary-cases.pdf',
            content_type='application/pdf'
        )


class ActivitiesReportView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):

        year = request.query_params.get('year')
        month = request.query_params.get('month')
        period = request.query_params.get('period')

        qs = Activity.objects.prefetch_related(
            'participations__student'
        )

        # YEAR
        if year:
            try:
                qs = qs.filter(
                    event_date__year=int(year)
                )
            except ValueError:
                pass

        # MONTH
        if (
            period == 'Monthly'
            and month
            and month != 'All'
        ):

            month_map = {
                'January': 1,
                'February': 2,
                'March': 3,
                'April': 4,
                'May': 5,
                'June': 6,
                'July': 7,
                'August': 8,
                'September': 9,
                'October': 10,
                'November': 11,
                'December': 12,
            }

            if month in month_map:
                qs = qs.filter(
                    event_date__month=month_map[month]
                )

        qs = qs.order_by(
            'event_date'
        )

        buffer = generate_activities_pdf(
            list(qs)
        )

        return FileResponse(
            buffer,
            as_attachment=True,
            filename='activity-participation.pdf',
            content_type='application/pdf'
        )


class PerformanceReportView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):

        view = DashboardStatsView()

        view.request = request

        response = view.get(request)

        buffer = generate_performance_pdf(
            response.data
        )

        return FileResponse(
            buffer,
            as_attachment=True,
            filename='office-performance.pdf',
            content_type='application/pdf'
        )


# =========================================================
# LOST & FOUND REPORT
# =========================================================

class LostFoundReportView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):

        # -------------------------------------------------
        # GET FILTERS
        # -------------------------------------------------

        item_type = request.query_params.get(
            'item_type',
            'All'
        )

        year = request.query_params.get(
            'year'
        )

        month = request.query_params.get(
            'month'
        )

        period = request.query_params.get(
            'period',
            'Monthly'
        )

        semester = request.query_params.get(
            'semester',
            '1st'
        )

        # -------------------------------------------------
        # START QUERY
        # -------------------------------------------------

        qs = LostFoundItem.objects.all()

        # -------------------------------------------------
        # ITEM TYPE FILTER
        # -------------------------------------------------

        if item_type in ['Lost', 'Found']:
            qs = qs.filter(
                item_type=item_type
            )

        # -------------------------------------------------
        # YEAR FILTER
        # -------------------------------------------------

        if year:
            try:
                qs = qs.filter(
                    date_filing__year=int(year)
                )
            except ValueError:
                pass

        # -------------------------------------------------
        # MONTH FILTER
        # -------------------------------------------------

        month_map = {
            'January': 1,
            'February': 2,
            'March': 3,
            'April': 4,
            'May': 5,
            'June': 6,
            'July': 7,
            'August': 8,
            'September': 9,
            'October': 10,
            'November': 11,
            'December': 12,
        }

        if (
            period == 'Monthly'
            and month
            and month != 'All'
            and month in month_map
        ):
            qs = qs.filter(
                date_filing__month=month_map[month]
            )

        # -------------------------------------------------
        # SEMESTER FILTER
        # -------------------------------------------------

        if (
            period == 'Semestral'
            and year
        ):

            try:
                selected_year = int(year)

                if semester == '1st':
                    # August - December
                    qs = qs.filter(
                        date_filing__year=selected_year,
                        date_filing__month__gte=8,
                        date_filing__month__lte=12,
                    )

                elif semester == '2nd':
                    # January - May
                    qs = qs.filter(
                        date_filing__year=selected_year + 1,
                        date_filing__month__gte=1,
                        date_filing__month__lte=5,
                    )

            except ValueError:
                pass

        # -------------------------------------------------
        # ORDER
        # -------------------------------------------------

        qs = qs.order_by(
            '-date_filing',
            '-id'
        )

        records = list(qs)

        # -------------------------------------------------
        # FILTER DESCRIPTION
        # -------------------------------------------------

        filter_parts = []

        if item_type == 'Lost':
            filter_parts.append(
                'Type: Lost Items'
            )

        elif item_type == 'Found':
            filter_parts.append(
                'Type: Found Items'
            )

        else:
            filter_parts.append(
                'Type: All Records'
            )

        if year:
            filter_parts.append(
                f'Year: {year}'
            )

        if period == 'Monthly':

            if month and month != 'All':
                filter_parts.append(
                    f'Month: {month}'
                )
            else:
                filter_parts.append(
                    'Month: All'
                )

        elif period == 'Yearly':
            filter_parts.append(
                'Period: Yearly'
            )

        elif period == 'Semestral':
            filter_parts.append(
                f'Period: {semester} Semester'
            )

        filters = ' | '.join(
            filter_parts
        )

        # -------------------------------------------------
        # GENERATE PDF
        # -------------------------------------------------

        buffer = generate_lost_found_pdf(
            records,
            filters=filters,
            selected_type=item_type,
            selected_year=year,
            selected_month=month,
            selected_period=period,
            selected_semester=semester,
        )

        filename_type = (
            item_type.lower()
            if item_type in ['Lost', 'Found']
            else 'all'
        )

        return FileResponse(
            buffer,
            as_attachment=True,
            filename=f'lost-found-{filename_type}-report.pdf',
            content_type='application/pdf'
        )