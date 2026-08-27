from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.middleware.csrf import CsrfViewMiddleware, get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.core.exceptions import PermissionDenied
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import PermissionDenied as DRFPermissionDenied
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from drf_spectacular.utils import (
    extend_schema,
    OpenApiExample,
    OpenApiResponse,
    inline_serializer,
)
from drf_spectacular.types import OpenApiTypes
from rest_framework import serializers as drf_serializers

from accounts.serializers import (
    UserRegisterSerializer,
    UserResponseSerializer,
    MFAVerifySerializer,
    MFADisableSerializer,
    MFALoginSerializer,
)
from accounts.models import RoleChoices, MFABackupCode
from accounts.permissions import HasRole
from audit.utils import log_action

User = get_user_model()


from rest_framework.throttling import SimpleRateThrottle


def enforce_csrf(request):
    django_request = getattr(request, '_request', request)
    reason = CsrfViewMiddleware(get_response=lambda req: None).process_view(django_request, None, (), {})
    if reason is not None:
        raise DRFPermissionDenied('CSRF verification failed.')


class AuthRateThrottle(SimpleRateThrottle):
    """Throttle specifically for auth endpoints (login, register, refresh)."""
    scope = 'auth'

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            return None  # No throttle for authenticated users
        ident = self.get_ident(request)
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }


_UserOut = inline_serializer(
    name='UserOut',
    fields={
        'id': drf_serializers.UUIDField(),
        'email': drf_serializers.EmailField(),
        'first_name': drf_serializers.CharField(),
        'last_name': drf_serializers.CharField(),
        'role': drf_serializers.ChoiceField(choices=RoleChoices.choices),
        'created_at': drf_serializers.DateTimeField(),
    }
)

_AuthSuccess = inline_serializer(
    name='AuthSuccess',
    fields={
        'user': _UserOut,
        'access': drf_serializers.CharField(help_text='Short-lived JWT access token (15 min).'),
    }
)

_TokenRefreshOut = inline_serializer(
    name='TokenRefreshOut',
    fields={
        'access': drf_serializers.CharField(help_text='New short-lived JWT access token.'),
    }
)

_DetailOut = inline_serializer(
    name='DetailOut',
    fields={
        'detail': drf_serializers.CharField(),
    }
)

_ErrorOut = inline_serializer(
    name='ErrorOut',
    fields={
        'detail': drf_serializers.CharField(),
    }
)


@method_decorator(ensure_csrf_cookie, name='dispatch')
class RegisterView(APIView):
    """Register a new student or lecturer user."""

    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    @extend_schema(
        tags=['Authentication'],
        summary='Register a new user',
        description=(
            'Registers a new `STUDENT` or `LECTURER` account. '
            'Requires a valid institutional email domain (`aastu.edu.et` or subdomains). '
            'Returns a JWT access token and sets an HttpOnly refresh cookie.'
        ),
        request=UserRegisterSerializer,
        responses={
            201: OpenApiResponse(
                response=_AuthSuccess,
                description='Account created successfully.',
            ),
            400: OpenApiResponse(
                response=_ErrorOut,
                description='Validation error (e.g. weak password, non-institutional email, missing role identifier).',
            ),
        },
        examples=[
            OpenApiExample(
                name='Register a student',
                request_only=True,
                value={
                    'email': 'student@sims.edu',
                    'password': 'Str0ng!Pass',
                    'first_name': 'Abebe',
                    'last_name': 'Kebede',
                    'role': 'STUDENT',
                    'student_identifier': 'STU-2024-001',
                    'department_id': None,
                },
            ),
            OpenApiExample(
                name='Register a lecturer',
                request_only=True,
                value={
                    'email': 'lecturer@sims.edu',
                    'password': 'Str0ng!Pass',
                    'first_name': 'Tigist',
                    'last_name': 'Alemu',
                    'role': 'LECTURER',
                    'faculty_identifier': 'FAC-2024-042',
                    'department_id': None,
                },
            ),
        ],
    )
    def post(self, request):
        get_token(request)
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


@method_decorator(ensure_csrf_cookie, name='dispatch')
class LoginView(APIView):
    """Authenticate and obtain JWT tokens."""

    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    @extend_schema(
        tags=['Authentication'],
        summary='Login – obtain access token',
        description=(
            'Authenticates the user with email and password. '
            'Returns a short-lived **access token** in the body and sets a '
            '**HttpOnly refresh token cookie** (`refresh_token`) for silent renewal. '
            'Pass the access token in subsequent requests as: `Authorization: Bearer <token>`.'
        ),
        request=inline_serializer(
            name='LoginRequest',
            fields={
                'email': drf_serializers.EmailField(help_text='Registered email address.'),
                'password': drf_serializers.CharField(help_text='Account password.'),
            }
        ),
        responses={
            200: OpenApiResponse(
                response=_AuthSuccess,
                description='Login successful. Refresh token set as HttpOnly cookie.',
                examples=[
                    OpenApiExample(
                        name='Successful login',
                        value={
                            'user': {
                                'id': '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                                'email': 'student@sims.edu',
                                'first_name': 'Abebe',
                                'last_name': 'Kebede',
                                'role': 'STUDENT',
                                'created_at': '2024-01-15T10:30:00Z',
                            },
                            'access': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        },
                        response_only=True,
                    )
                ],
            ),
            401: OpenApiResponse(
                response=_ErrorOut,
                description='Invalid credentials.',
                examples=[
                    OpenApiExample(
                        name='Wrong password',
                        value={'detail': 'Invalid email or password.'},
                        response_only=True,
                    )
                ],
            ),
        },
        examples=[
            OpenApiExample(
                name='Student login',
                request_only=True,
                value={'email': 'student@sims.edu', 'password': 'Str0ng!Pass'},
            ),
        ],
        auth=[],  # No auth required
    )
    def post(self, request):
        get_token(request)
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
            user_logged_in.send(sender=user.__class__, request=request, user=user)

            # MFA-enabled users get a short-lived mfa_token instead of JWT
            if user.mfa_enabled:
                from datetime import timedelta
                mfa_token = RefreshToken.for_user(user)
                mfa_token.set_exp(lifetime=timedelta(seconds=settings.MFA_TOKEN_LIFETIME))
                mfa_token['mfa'] = True
                return Response(
                    {
                        'mfa_required': True,
                        'mfa_token': str(mfa_token),
                    },
                    status=status.HTTP_200_OK,
                )

            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token

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


@method_decorator(ensure_csrf_cookie, name='dispatch')
class CookieTokenRefreshView(APIView):
    """Silently refresh the access token using the HttpOnly refresh-token cookie or JSON body."""

    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    @extend_schema(
        tags=['Authentication'],
        summary='Refresh access token (cookie-based or body-based)',
        description=(
            'Uses the **HttpOnly `refresh_token` cookie** (set on login/register) or JSON request body '
            'to issue a new short-lived access token. '
            'Cookie-based requests require a valid CSRF token in the `X-CSRFToken` header. '
            'If `ROTATE_REFRESH_TOKENS` is enabled the old cookie is replaced with a new one.'
        ),
        request=None,
        responses={
            200: OpenApiResponse(
                response=_TokenRefreshOut,
                description='New access token issued.',
                examples=[
                    OpenApiExample(
                        name='Success',
                        value={'access': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'},
                        response_only=True,
                    )
                ],
            ),
            401: OpenApiResponse(
                response=_ErrorOut,
                description='Refresh token missing, invalid, or expired.',
                examples=[
                    OpenApiExample(
                        name='Expired cookie',
                        value={'detail': 'Invalid or expired refresh token.'},
                        response_only=True,
                    )
                ],
            ),
        },
        auth=[],
    )
    def post(self, request):
        cookie_refresh = request.COOKIES.get(settings.JWT_AUTH_COOKIE)
        body_refresh = request.data.get('refresh') or request.data.get('refresh_token')
        refresh_token = cookie_refresh or body_refresh

        if not refresh_token:
            return Response(
                {'detail': 'Invalid or expired refresh token.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if cookie_refresh:
            enforce_csrf(request)

        try:
            refresh = RefreshToken(refresh_token)
            user_id = refresh[settings.SIMPLE_JWT['USER_ID_CLAIM']]
            user = User.objects.get(id=user_id)
            if not user.is_active:
                return Response(
                    {'detail': 'Invalid or expired refresh token.'},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            access_token = refresh.access_token
            response_data = {'access': str(access_token)}

            if settings.SIMPLE_JWT.get('ROTATE_REFRESH_TOKENS'):
                if settings.SIMPLE_JWT.get('BLACKLIST_AFTER_ROTATION'):
                    try:
                        refresh.blacklist()
                    except AttributeError:
                        pass

                new_refresh = RefreshToken.for_user(user)
                if body_refresh:
                    response_data['refresh'] = str(new_refresh)

                response = Response(response_data, status=status.HTTP_200_OK)
                response.set_cookie(
                    key=settings.JWT_AUTH_COOKIE,
                    value=str(new_refresh),
                    httponly=settings.JWT_AUTH_COOKIE_HTTP_ONLY,
                    secure=settings.JWT_AUTH_COOKIE_SECURE,
                    path=settings.JWT_AUTH_COOKIE_PATH,
                    samesite=settings.JWT_AUTH_COOKIE_SAMESITE,
                )
            else:
                if body_refresh:
                    response_data['refresh'] = str(refresh)
                response = Response(response_data, status=status.HTTP_200_OK)

            return response

        except (TokenError, InvalidToken, User.DoesNotExist, Exception):
            return Response(
                {'detail': 'Invalid or expired refresh token.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )


@method_decorator(ensure_csrf_cookie, name='dispatch')
class LogoutView(APIView):
    """Invalidate the refresh token and clear the cookie."""

    permission_classes = [AllowAny]

    @extend_schema(
        tags=['Authentication'],
        summary='Logout – invalidate refresh token',
        description=(
            'Blacklists the current refresh token stored in the HttpOnly cookie and '
            'deletes that cookie from the browser. '
            'Requires a valid CSRF token in the `X-CSRFToken` header when cookie-based. '
            'The access token must be discarded client-side (it cannot be revoked server-side).'
        ),
        request=None,
        responses={
            200: OpenApiResponse(
                response=_DetailOut,
                description='Logged out successfully.',
                examples=[
                    OpenApiExample(
                        name='Success',
                        value={'detail': 'Logged out successfully.'},
                        response_only=True,
                    )
                ],
            ),
        },
        auth=[],
    )
    def post(self, request):
        cookie_refresh = request.COOKIES.get(settings.JWT_AUTH_COOKIE)
        body_refresh = request.data.get('refresh') or request.data.get('refresh_token')
        refresh_token = cookie_refresh or body_refresh

        if cookie_refresh:
            enforce_csrf(request)

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
    """Protected route – accessible only by authenticated Lecturers."""

    permission_classes = [IsAuthenticated, HasRole(RoleChoices.LECTURER)]

    @extend_schema(
        tags=['Protected Routes'],
        summary='Lecturer-only protected endpoint',
        description=(
            'Returns a success message **only** if the requesting user is authenticated '
            'and has the `LECTURER` role. '
            'Pass the access token as `Authorization: Bearer <token>`.'
        ),
        responses={
            200: OpenApiResponse(
                response=_DetailOut,
                description='Access granted.',
                examples=[
                    OpenApiExample(
                        name='Success',
                        value={'detail': 'Access granted for lecturer-only route.'},
                        response_only=True,
                    )
                ],
            ),
            401: OpenApiResponse(
                response=_ErrorOut,
                description='Not authenticated – missing or expired access token.',
            ),
            403: OpenApiResponse(
                response=_ErrorOut,
                description='Authenticated but does not have the LECTURER role.',
            ),
        },
    )
    def get(self, request):
        return Response(
            {'detail': 'Access granted for lecturer-only route.'},
            status=status.HTTP_200_OK,
        )


# MFA helpers 

import hashlib
import secrets

import pyotp
from cryptography.fernet import Fernet


def _encrypt_secret(secret: str) -> str:
    key = settings.MFA_ENCRYPTION_KEY.encode()
    f = Fernet(base64_url_key(key))
    return f.encrypt(secret.encode()).decode()


def _decrypt_secret(encrypted: str) -> str:
    key = settings.MFA_ENCRYPTION_KEY.encode()
    f = Fernet(base64_url_key(key))
    return f.decrypt(encrypted.encode()).decode()


def base64_url_key(key_bytes: bytes) -> bytes:
    """Derive a valid Fernet key (32 url-safe base64-encoded bytes) from arbitrary input."""
    digest = hashlib.sha256(key_bytes).digest()
    import base64
    return base64.urlsafe_b64encode(digest)


def _verify_totp(secret: str, code: str) -> bool:
    totp = pyotp.TOTP(secret, interval=settings.MFA_TOTP_STEP)
    return totp.verify(code, valid_window=settings.MFA_VALID_WINDOW)


def _generate_backup_codes(count=8):
    """Return a list of plain-text 8-digit backup codes and their sha-256 hashes."""
    plain = [f'{secrets.randbelow(10**8):08d}' for _ in range(count)]
    hashed = [hashlib.sha256(c.encode()).hexdigest() for c in plain]
    return plain, hashed


def _hash_backup_code(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


# MFA Views 

class MFASetupView(APIView):
    """Generate a TOTP secret and return the otpauth URI for QR code scanning."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['MFA'],
        summary='Set up MFA – generate TOTP secret',
        description=(
            '**Authenticated**\n\n'
            'Generates a new TOTP secret, stores it encrypted on the user account, '
            'and returns an `otpauth://` URI the client can render as a QR code. '
            'MFA is **not** active yet — call `/auth/mfa/verify` with the first code '
            'to activate it.'
        ),
        responses={200: inline_serializer(
            name='MFASetupOut',
            fields={
                'otpauth_uri': drf_serializers.CharField(),
                'secret': drf_serializers.CharField(help_text='Raw secret for manual entry.'),
            },
        )},
    )
    def post(self, request):
        user = request.user
        if user.mfa_enabled:
            return Response(
                {'detail': 'MFA is already enabled. Disable it first to re-setup.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        secret = pyotp.random_base32()
        user.mfa_secret = _encrypt_secret(secret)
        user.save(update_fields=['mfa_secret', 'updated_at'])

        totp = pyotp.TOTP(secret, interval=settings.MFA_TOTP_STEP)
        otpauth_uri = totp.provisioning_uri(
            name=user.email,
            issuer_name='SIMS',
        )

        return Response({'otpauth_uri': otpauth_uri, 'secret': secret})


class MFAVerifyView(APIView):
    """Verify a TOTP code to activate MFA and return backup codes."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['MFA'],
        summary='Verify TOTP code – activate MFA',
        description=(
            '**Authenticated**\n\n'
            'Confirms the TOTP code from the user\'s authenticator app. '
            'On success, enables MFA on the account and returns 8 one-time '
            'backup codes. **Store these securely — they cannot be retrieved later.**'
        ),
        request=MFAVerifySerializer,
        responses={
            200: inline_serializer(
                name='MFAVerifyOut',
                fields={
                    'detail': drf_serializers.CharField(),
                    'backup_codes': drf_serializers.ListSerializer(
                        child=drf_serializers.CharField()
                    ),
                },
            ),
            400: _ErrorOut,
        },
    )
    def post(self, request):
        serializer = MFAVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if user.mfa_enabled:
            return Response(
                {'detail': 'MFA is already enabled.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.mfa_secret:
            return Response(
                {'detail': 'Call /auth/mfa/setup first to generate a secret.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        secret = _decrypt_secret(user.mfa_secret)
        if not _verify_totp(secret, serializer.validated_data['totp_code']):
            return Response(
                {'detail': 'Invalid TOTP code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Activate MFA and generate backup codes
        plain_codes, hashed_codes = _generate_backup_codes()
        user.mfa_enabled = True
        user.save(update_fields=['mfa_enabled', 'updated_at'])

        MFABackupCode.objects.bulk_create([
            MFABackupCode(user=user, code_hash=h) for h in hashed_codes
        ])

        log_action(
            actor=user,
            action_type='MFA_ENABLED',
            request=request,
            payload={'email': user.email},
        )

        return Response({
            'detail': 'MFA enabled successfully.',
            'backup_codes': plain_codes,
        })


class MFADisableView(APIView):
    """Disable MFA after verifying password and TOTP code."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['MFA'],
        summary='Disable MFA',
        description=(
            '**Authenticated**\n\n'
            'Requires both the account password and a valid TOTP code. '
            'Clears the MFA secret and deletes all backup codes.'
        ),
        request=MFADisableSerializer,
        responses={200: _DetailOut, 400: _ErrorOut},
    )
    def post(self, request):
        serializer = MFADisableSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.mfa_enabled:
            return Response(
                {'detail': 'MFA is not enabled.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verify password
        if not user.check_password(serializer.validated_data['password']):
            return Response(
                {'detail': 'Invalid password.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verify TOTP
        secret = _decrypt_secret(user.mfa_secret)
        if not _verify_totp(secret, serializer.validated_data['totp_code']):
            return Response(
                {'detail': 'Invalid TOTP code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.mfa_enabled = False
        user.mfa_secret = ''
        user.save(update_fields=['mfa_enabled', 'mfa_secret', 'updated_at'])

        MFABackupCode.objects.filter(user=user).delete()

        log_action(
            actor=user,
            action_type='MFA_DISABLED',
            request=request,
            payload={'email': user.email},
        )

        return Response({'detail': 'MFA disabled successfully.'})


@method_decorator(ensure_csrf_cookie, name='dispatch')
class MFALoginView(APIView):
    """Second step of login for MFA-enabled users: verify TOTP or backup code."""

    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    @extend_schema(
        tags=['MFA'],
        summary='MFA login – verify TOTP or backup code',
        description=(
            '**Second step of login for MFA-enabled users.**\n\n'
            'Sends the `mfa_token` (from `/auth/login`) and a 6-digit TOTP code '
            'or 8-digit backup code. Returns the real JWT on success.'
        ),
        request=MFALoginSerializer,
        responses={
            200: _AuthSuccess,
            401: _ErrorOut,
        },
    )
    def post(self, request):
        get_token(request)
        serializer = MFALoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        mfa_token_str = serializer.validated_data['mfa_token']
        code = serializer.validated_data['totp_code']

        # Validate the mfa_token
        try:
            mfa_token = RefreshToken(mfa_token_str)
            if not mfa_token.get('mfa'):
                return Response(
                    {'detail': 'Invalid MFA token.'},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            user_id = mfa_token[settings.SIMPLE_JWT['USER_ID_CLAIM']]
            user = User.objects.get(id=user_id)
        except Exception:
            return Response(
                {'detail': 'Invalid or expired MFA token.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active or not user.mfa_enabled:
            return Response(
                {'detail': 'Invalid or expired MFA token.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # 8-digit code → backup code; 6-digit → TOTP
        verified = False
        if len(code) == 8:
            code_hash = _hash_backup_code(code)
            backup = MFABackupCode.objects.filter(
                user=user, code_hash=code_hash, used=False
            ).first()
            if backup:
                backup.used = True
                backup.save(update_fields=['used'])
                verified = True
        elif len(code) == 6:
            secret = _decrypt_secret(user.mfa_secret)
            verified = _verify_totp(secret, code)

        if not verified:
            return Response(
                {'detail': 'Invalid TOTP code or backup code.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Issue real JWT
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token

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


