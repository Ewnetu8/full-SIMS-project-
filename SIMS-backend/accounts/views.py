from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.middleware.csrf import CsrfViewMiddleware
from django.core.exceptions import PermissionDenied
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.serializers import UserRegisterSerializer, UserResponseSerializer
from accounts.models import RoleChoices
from accounts.permissions import HasRole
from audit.utils import log_action

User = get_user_model()


def enforce_csrf(request):
    reason = CsrfViewMiddleware().process_view(request, None, (), {})
    if reason is not None:
        raise PermissionDenied('CSRF verification failed.')

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token

            log_action(
                actor=user,
                action_type='REGISTER',
                request=request,
                payload={
                    'email': user.email,
                    'role': user.role,
                }
            )

            response_data = {
                'user': UserResponseSerializer(user).data,
                'access': str(access_token),
            }

            response = Response(response_data, status=status.HTTP_201_CREATED)
            response.set_cookie(
                key=settings.JWT_AUTH_COOKIE,
                value=str(refresh),
                httponly=settings.JWT_AUTH_COOKIE_HTTP_ONLY,
                secure=settings.JWT_AUTH_COOKIE_SECURE,
                path=settings.JWT_AUTH_COOKIE_PATH,
                samesite=settings.JWT_AUTH_COOKIE_SAMESITE,
            )
            return response

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            log_action(
                actor=None,
                action_type='LOGIN_FAILURE',
                request=request,
                payload={'attempted_email': email or 'unknown', 'reason': 'missing_credentials'},
            )
            return Response(
                {'detail': 'Invalid email or password.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user = authenticate(request, username=email, password=password)

        if user is not None and user.is_active:
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token

            user_logged_in.send(sender=user.__class__, request=request, user=user)

            response = Response(
                {
                    'user': UserResponseSerializer(user).data,
                    'access': str(access_token),
                },
                status=status.HTTP_200_OK,
            )
            response.set_cookie(
                key=settings.JWT_AUTH_COOKIE,
                value=str(refresh),
                httponly=settings.JWT_AUTH_COOKIE_HTTP_ONLY,
                secure=settings.JWT_AUTH_COOKIE_SECURE,
                path=settings.JWT_AUTH_COOKIE_PATH,
                samesite=settings.JWT_AUTH_COOKIE_SAMESITE,
            )
            return response

        return Response(
            {'detail': 'Invalid email or password.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )


class CookieTokenRefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        enforce_csrf(request)

        refresh_token = request.COOKIES.get(settings.JWT_AUTH_COOKIE)

        if not refresh_token:
            return Response(
                {'detail': 'Invalid or expired refresh token.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            refresh = RefreshToken(refresh_token)
            user_id = refresh[settings.SIMPLE_JWT['USER_ID_CLAIM']]
            user = User.objects.get(id=user_id)
            access_token = refresh.access_token

            response = Response({'access': str(access_token)}, status=status.HTTP_200_OK)

            if settings.SIMPLE_JWT.get('ROTATE_REFRESH_TOKENS'):
                if settings.SIMPLE_JWT.get('BLACKLIST_AFTER_ROTATION'):
                    refresh.blacklist()

                new_refresh = RefreshToken.for_user(user)
                response.set_cookie(
                    key=settings.JWT_AUTH_COOKIE,
                    value=str(new_refresh),
                    httponly=settings.JWT_AUTH_COOKIE_HTTP_ONLY,
                    secure=settings.JWT_AUTH_COOKIE_SECURE,
                    path=settings.JWT_AUTH_COOKIE_PATH,
                    samesite=settings.JWT_AUTH_COOKIE_SAMESITE,
                )

            return response

        except Exception:
            return Response(
                {'detail': 'Invalid or expired refresh token.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        enforce_csrf(request)

        refresh_token = request.COOKIES.get(settings.JWT_AUTH_COOKIE)
        actor = None

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                user_id = token[settings.SIMPLE_JWT['USER_ID_CLAIM']]
                actor = User.objects.filter(pk=user_id).first()
                token.blacklist()
            except Exception:
                actor = None

        user_logged_out.send(sender=User, request=request, user=actor)

        response = Response(
            {'detail': 'Logged out successfully.'},
            status=status.HTTP_200_OK,
        )

        response.delete_cookie(
            key=settings.JWT_AUTH_COOKIE,
            path=settings.JWT_AUTH_COOKIE_PATH,
        )
        return response


class LecturerProtectedView(APIView):
    permission_classes = [IsAuthenticated, HasRole(RoleChoices.LECTURER)]

    def get(self, request):
        return Response(
            {'detail': 'Access granted for lecturer-only route.'},
            status=status.HTTP_200_OK,
        )
