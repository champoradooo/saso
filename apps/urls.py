from django.urls import path, include

urlpatterns = [
    path('', include('apps.accounts.urls')),

    path('dashboard/', include('apps.dashboard.urls')),

    path('', include('apps.students.urls')),

    path('discipline/', include('apps.discipline.urls')),

    path('activities/', include('apps.activities.urls')),

    path('reports/', include('apps.reports.urls')),

    path('lost-found/', include('apps.lost_found.urls')),
]