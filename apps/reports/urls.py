from django.urls import path

from .views import (
    StudentReportView,
    DisciplineReportView,
    ActivitiesReportView,
    PerformanceReportView,
    LostFoundReportView,
)


urlpatterns = [

    path(
        'students/',
        StudentReportView.as_view(),
        name='student-report'
    ),

    path(
        'discipline/',
        DisciplineReportView.as_view(),
        name='discipline-report'
    ),

    path(
        'activities/',
        ActivitiesReportView.as_view(),
        name='activities-report'
    ),

    path(
        'performance/',
        PerformanceReportView.as_view(),
        name='performance-report'
    ),

    path(
        'lost-found/',
        LostFoundReportView.as_view(),
        name='lost-found-report'
    ),

]