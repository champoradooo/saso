from django.urls import path

from . import views


urlpatterns = [
    path(
        "",
        views.lost_found_list,
        name="lost-found-list",
    ),

    path(
        "<int:pk>/",
        views.lost_found_detail,
        name="lost-found-detail",
    ),
]