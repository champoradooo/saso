from django.contrib.auth import authenticate, login, logout, get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.http import (
    urlsafe_base64_encode,
    urlsafe_base64_decode,
)
from django.utils.encoding import force_bytes, force_str
from django.views.decorators.csrf import ensure_csrf_cookie
from django.db.models import Q

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from .serializers import UserSerializer, CreateUserSerializer


User = get_user_model()


# =========================================================
# LOGIN
# =========================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):

    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(
        request,
        username=username,
        password=password
    )

    if user is None:
        return Response(
            {
                'detail': 'Invalid username or password.'
            },
            status=status.HTTP_401_UNAUTHORIZED
        )

    login(request, user)

    return Response(
        UserSerializer(user).data
    )


# =========================================================
# LOGOUT
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):

    logout(request)

    return Response(
        status=status.HTTP_204_NO_CONTENT
    )


# =========================================================
# CURRENT USER
# =========================================================

@ensure_csrf_cookie
@api_view(['GET'])
@permission_classes([AllowAny])
def me_view(request):

    if not request.user.is_authenticated:
        return Response(
            None,
            status=status.HTTP_200_OK
        )

    return Response(
        UserSerializer(request.user).data
    )


# =========================================================
# FORGOT PASSWORD
# =========================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password_view(request):

    email = request.data.get('email', '').strip()

    if not email:
        return Response(
            {
                'detail': 'Please enter your email address.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # -----------------------------------------------------
    # Find user
    # -----------------------------------------------------

    try:
        user = User.objects.get(
            email__iexact=email
        )

    except User.DoesNotExist:

        # Do not reveal whether an account exists.
        return Response(
            {
                'detail':
                    'If an account with that email exists, '
                    'a password reset link has been sent.'
            },
            status=status.HTTP_200_OK
        )

    # -----------------------------------------------------
    # Generate reset token
    # -----------------------------------------------------

    uid = urlsafe_base64_encode(
        force_bytes(user.pk)
    )

    token = default_token_generator.make_token(
        user
    )

    # -----------------------------------------------------
    # React reset-password URL
    # -----------------------------------------------------

    reset_link = (
        f'http://localhost:5173/reset-password/'
        f'{uid}/{token}/'
    )

    # -----------------------------------------------------
    # Email
    # -----------------------------------------------------

    subject = 'SASO Records System - Password Reset'

    message = f"""
Hello {user.get_full_name() or user.username},

We received a request to reset the password for your SASO Records System account.

Click the link below to reset your password:

{reset_link}

If you did not request a password reset, you can safely ignore this email.

This password reset link is temporary and can only be used once.

Regards,

SASO Records System
Olivarez College Tagaytay
Student Affairs and Services Office
"""

    try:

        send_mail(
    subject,
    message,
    'SASO Records System <mendozamariz986@gmail.com>',
    [user.email],
    fail_silently=False,
)
    except Exception as error:

        print(
            'PASSWORD RESET EMAIL ERROR:',
            error
        )

        return Response(
            {
                'detail':
                    'Unable to send the password reset email. '
                    'Please check the email configuration.'
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return Response(
        {
            'detail':
                'If an account with that email exists, '
                'a password reset link has been sent.'
        },
        status=status.HTTP_200_OK
    )


# =========================================================
# RESET PASSWORD
# =========================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_view(request, uidb64, token):

    password = request.data.get('password', '')
    confirm_password = request.data.get(
        'confirm_password',
        ''
    )

    # -----------------------------------------------------
    # Validate password
    # -----------------------------------------------------

    if not password:
        return Response(
            {
                'detail': 'Please enter a new password.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if not confirm_password:
        return Response(
            {
                'detail': 'Please confirm your new password.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if password != confirm_password:
        return Response(
            {
                'detail': 'Passwords do not match.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(password) < 8:
        return Response(
            {
                'detail':
                    'Password must be at least 8 characters long.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # -----------------------------------------------------
    # Decode user ID
    # -----------------------------------------------------

    try:

        uid = force_str(
            urlsafe_base64_decode(uidb64)
        )

        user = User.objects.get(
            pk=uid
        )

    except (
        TypeError,
        ValueError,
        OverflowError,
        User.DoesNotExist
    ):

        return Response(
            {
                'detail':
                    'This password reset link is invalid.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # -----------------------------------------------------
    # Validate token
    # -----------------------------------------------------

    if not default_token_generator.check_token(
        user,
        token
    ):

        return Response(
            {
                'detail':
                    'This password reset link is invalid or has expired.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # -----------------------------------------------------
    # Set new password
    # -----------------------------------------------------

    user.set_password(password)
    user.save()

    return Response(
        {
            'detail':
                'Your password has been reset successfully.'
        },
        status=status.HTTP_200_OK
    )


# =========================================================
# USERS
# =========================================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def users_view(request):

    if not request.user.can_manage_accounts:

        return Response(
            {
                'detail': 'Forbidden.'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    # -----------------------------------------------------
    # GET USERS
    # -----------------------------------------------------

    if request.method == 'GET':

        if request.user.role == User.ROLE_SUPER_ADMIN:

            users = User.objects.all().order_by(
                'username'
            )

        else:

            users = User.objects.filter(
                Q(id=request.user.id)
                |
                Q(
                    role__in=[
                        User.ROLE_ASSISTANT,
                        User.ROLE_STAFF
                    ]
                )
            ).order_by(
                'username'
            )

        return Response(
            UserSerializer(
                users,
                many=True
            ).data
        )

    # -----------------------------------------------------
    # CREATE USER
    # -----------------------------------------------------

    serializer = CreateUserSerializer(
        data=request.data,
        context={
            'request': request
        }
    )

    if serializer.is_valid():

        user = serializer.save()

        return Response(
            UserSerializer(user).data,
            status=status.HTTP_201_CREATED
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


# =========================================================
# DELETE USER
# =========================================================

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def user_detail_view(request, pk):

    if not request.user.can_manage_accounts:

        return Response(
            {
                'detail': 'Forbidden.'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    # -----------------------------------------------------
    # Find user
    # -----------------------------------------------------

    try:

        user = User.objects.get(
            pk=pk
        )

    except User.DoesNotExist:

        return Response(
            {
                'detail': 'Not found.'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    # -----------------------------------------------------
    # Prevent deleting own account
    # -----------------------------------------------------

    if user.pk == request.user.pk:

        return Response(
            {
                'detail':
                    'You cannot delete your own account.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # -----------------------------------------------------
    # Admin restrictions
    # -----------------------------------------------------

    if (
        request.user.role == User.ROLE_ADMIN
        and
        user.role not in {
            User.ROLE_ASSISTANT,
            User.ROLE_STAFF
        }
    ):

        return Response(
            {
                'detail':
                    'You cannot delete that account.'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    # -----------------------------------------------------
    # Delete
    # -----------------------------------------------------

    user.delete()

    return Response(
        status=status.HTTP_204_NO_CONTENT
    )