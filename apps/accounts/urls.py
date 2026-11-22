from django.urls import path

from . import views


urlpatterns = [

    # =====================================================
    # AUTHENTICATION
    # =====================================================

    path(
        'auth/login/',
        views.login_view,
        name='login'
    ),

    path(
        'auth/logout/',
        views.logout_view,
        name='logout'
    ),

    path(
        'auth/me/',
        views.me_view,
        name='me'
    ),


    # =====================================================
    # FORGOT PASSWORD
    # =====================================================

    path(
        'auth/forgot-password/',
        views.forgot_password_view,
        name='forgot-password'
    ),


    # =====================================================
    # RESET PASSWORD
    # =====================================================

    path(
        'auth/reset-password/',
        views.reset_password_view,
        name='reset-password'
    ),


    # =====================================================
    # USERS
    # =====================================================

    path(
        'users/',
        views.users_view,
        name='users'
    ),

    path(
        'users/<int:pk>/',
        views.user_detail_view,
        name='user-detail'
    ),
]