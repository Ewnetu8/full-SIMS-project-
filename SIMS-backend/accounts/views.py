from django.contrib.auth import authenticate
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.serializers import UserRegisterSerializer, UserResponseSerializer

User = get_user_model()

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Generate JWT credentials immediately upon registration
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            response_data = {
                "user": UserResponseSerializer(user).data,
                "access": str(access_token)
            }
            
            response = Response(response_data, status=status.HTTP_201_CREATED)
            
            # Set cookie
            response.set_cookie(
                key=settings.JWT_AUTH_COOKIE,
                value=str(refresh),
                httponly=settings.JWT_AUTH_COOKIE_HTTP_ONLY,
                secure=settings.JWT_AUTH_COOKIE_SECURE,
                path=settings.JWT_AUTH_COOKIE_PATH,
                samesite=settings.JWT_AUTH_COOKIE_SAMESITE
            )
            return response
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response(
                {"detail": "Both email and password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Authenticate using email-based lookup
        user = authenticate(request, username=email, password=password)

        if user is not None:
            if not user.is_active:
                return Response(
                    {"detail": "User account is disabled."},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Generate credentials
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token

            response_data = {
                "user": UserResponseSerializer(user).data,
                "access": str(access_token)
            }

            response = Response(response_data, status=status.HTTP_200_OK)

            # Set refresh token as HTTP-only cookie
            response.set_cookie(
                key=settings.JWT_AUTH_COOKIE,
                value=str(refresh),
                httponly=settings.JWT_AUTH_COOKIE_HTTP_ONLY,
                secure=settings.JWT_AUTH_COOKIE_SECURE,
                path=settings.JWT_AUTH_COOKIE_PATH,
                samesite=settings.JWT_AUTH_COOKIE_SAMESITE
            )
            return response

        # Enforce generic 401 on login failure
        return Response(
            {"detail": "Invalid email or password."},
            status=status.HTTP_401_UNAUTHORIZED
        )


class CookieTokenRefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.JWT_AUTH_COOKIE)

        if not refresh_token:
            return Response(
                {"detail": "Refresh token is missing."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            # Instantiate token to validate signature, expiration, and blacklist status
            refresh = RefreshToken(refresh_token)
            
            user_id = refresh[settings.SIMPLE_JWT['USER_ID_CLAIM']]
            user = User.objects.get(id=user_id)
            
            # Generate new access token
            access_token = refresh.access_token
            
            response_data = {
                "access": str(access_token)
            }
            
            response = Response(response_data, status=status.HTTP_200_OK)
            
            # If rotation is enabled, rotate refresh token
            if settings.SIMPLE_JWT.get('ROTATE_REFRESH_TOKENS'):
                # Blacklist the old one
                if settings.SIMPLE_JWT.get('BLACKLIST_AFTER_ROTATION'):
                    try:
                        refresh.blacklist()
                    except AttributeError:
                        pass
                
                # Create and set a new refresh token
                new_refresh = RefreshToken.for_user(user)
                response.set_cookie(
                    key=settings.JWT_AUTH_COOKIE,
                    value=str(new_refresh),
                    httponly=settings.JWT_AUTH_COOKIE_HTTP_ONLY,
                    secure=settings.JWT_AUTH_COOKIE_SECURE,
                    path=settings.JWT_AUTH_COOKIE_PATH,
                    samesite=settings.JWT_AUTH_COOKIE_SAMESITE
                )
                
            return response
            
        except Exception:
            return Response(
                {"detail": "Invalid or expired refresh token."},
                status=status.HTTP_401_UNAUTHORIZED
            )


class LogoutView(APIView):
    permission_classes = [AllowAny]  # Allow anyone to access the endpoint, but behavior checks for presence

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.JWT_AUTH_COOKIE)

        if refresh_token:
            try:
                # Blacklist the refresh token
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                # If already blacklisted or invalid, continue with clearing cookie
                pass

        response = Response(
            {"detail": "Logged out successfully."},
            status=status.HTTP_200_OK
        )
        
        # Delete cookie from client browser
        response.delete_cookie(
            key=settings.JWT_AUTH_COOKIE,
            path=settings.JWT_AUTH_COOKIE_PATH
        )
        return response
