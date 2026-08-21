import pyotp
import pytest
from django.conf import settings
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import MFABackupCode, RoleChoices
from accounts.views import _decrypt_secret, _encrypt_secret, _hash_backup_code

User = get_user_model()

pytestmark = pytest.mark.django_db


def set_csrf_cookie(client):
    client.cookies['csrftoken'] = 'test-csrf-token'
    return {'HTTP_X_CSRFTOKEN': 'test-csrf-token'}


def create_user(email='user@aastu.edu.et', password='strongpass123', role=RoleChoices.STUDENT):
    return User.objects.create_user(email=email, password=password, role=role)


def get_jwt_header(user):
    """Build an Authorization header from a JWT — works even when MFA is enabled."""
    refresh = RefreshToken.for_user(user)
    return {'HTTP_AUTHORIZATION': f'Bearer {refresh.access_token}'}


def login(client, email, password):
    csrf = set_csrf_cookie(client)
    return client.post(
        reverse('auth_login'),
        {'email': email, 'password': password},
        content_type='application/json',
        **csrf,
    )


def get_current_totp(user):
    secret = _decrypt_secret(user.mfa_secret)
    return pyotp.TOTP(secret, interval=settings.MFA_TOTP_STEP).now()


# ── Setup ──────────────────────────────────────────────────────────────────

class TestMFASetup:

    def test_setup_returns_otpauth_uri_and_secret(self, client):
        user = create_user()
        headers = get_jwt_header(user)
        csrf = set_csrf_cookie(client)

        response = client.post(
            reverse('mfa_setup'), {}, content_type='application/json', **headers, **csrf,
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert 'otpauth_uri' in data
        assert 'secret' in data
        assert data['otpauth_uri'].startswith('otpauth://')
        assert len(data['secret']) == 32

    def test_setup_stores_encrypted_secret(self, client):
        user = create_user()
        headers = get_jwt_header(user)
        csrf = set_csrf_cookie(client)

        resp = client.post(
            reverse('mfa_setup'), {}, content_type='application/json', **headers, **csrf,
        )
        user.refresh_from_db()
        assert user.mfa_secret != ''
        # Stored value is encrypted, not a plain base32 secret
        assert user.mfa_secret != resp.json()['secret']

    def test_setup_rejected_when_mfa_already_enabled(self, client):
        user = create_user()
        user.mfa_enabled = True
        user.save(update_fields=['mfa_enabled'])

        headers = get_jwt_header(user)
        csrf = set_csrf_cookie(client)

        response = client.post(
            reverse('mfa_setup'), {}, content_type='application/json', **headers, **csrf,
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_setup_requires_authentication(self, client):
        response = client.post(
            reverse('mfa_setup'), {}, content_type='application/json',
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ── Verify ─────────────────────────────────────────────────────────────────

class TestMFAVerify:

    def _setup_secret(self, user):
        secret = pyotp.random_base32()
        user.mfa_secret = _encrypt_secret(secret)
        user.save(update_fields=['mfa_secret'])
        return secret

    def test_verify_activates_mfa_and_returns_backup_codes(self, client):
        user = create_user()
        secret = self._setup_secret(user)

        headers = get_jwt_header(user)
        csrf = set_csrf_cookie(client)

        code = pyotp.TOTP(secret, interval=settings.MFA_TOTP_STEP).now()
        response = client.post(
            reverse('mfa_verify'),
            {'totp_code': code},
            content_type='application/json',
            **headers, **csrf,
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['detail'] == 'MFA enabled successfully.'
        assert len(data['backup_codes']) == 8

        user.refresh_from_db()
        assert user.mfa_enabled is True

    def test_verify_rejects_wrong_code(self, client):
        user = create_user()
        self._setup_secret(user)

        headers = get_jwt_header(user)
        csrf = set_csrf_cookie(client)

        response = client.post(
            reverse('mfa_verify'),
            {'totp_code': '000000'},
            content_type='application/json',
            **headers, **csrf,
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_verify_rejected_without_setup(self, client):
        user = create_user()
        headers = get_jwt_header(user)
        csrf = set_csrf_cookie(client)

        response = client.post(
            reverse('mfa_verify'),
            {'totp_code': '123456'},
            content_type='application/json',
            **headers, **csrf,
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_verify_rejected_when_already_enabled(self, client):
        user = create_user()
        user.mfa_enabled = True
        user.save(update_fields=['mfa_enabled'])

        headers = get_jwt_header(user)
        csrf = set_csrf_cookie(client)

        response = client.post(
            reverse('mfa_verify'),
            {'totp_code': '123456'},
            content_type='application/json',
            **headers, **csrf,
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ── Login two-step flow ────────────────────────────────────────────────────

class TestMFALogin:

    def test_login_without_mfa_returns_jwt_normally(self, client):
        user = create_user()
        response = login(client, user.email, 'strongpass123')
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.json()
        assert 'mfa_required' not in response.json()

    def test_login_with_mfa_returns_mfa_token(self, client):
        user = create_user()
        user.mfa_enabled = True
        user.mfa_secret = _encrypt_secret(pyotp.random_base32())
        user.save(update_fields=['mfa_enabled', 'mfa_secret'])

        response = login(client, user.email, 'strongpass123')
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['mfa_required'] is True
        assert 'mfa_token' in data
        assert 'access' not in data

    def test_mfa_login_with_valid_totp_returns_jwt(self, client):
        user = create_user()
        secret = pyotp.random_base32()
        user.mfa_enabled = True
        user.mfa_secret = _encrypt_secret(secret)
        user.save(update_fields=['mfa_enabled', 'mfa_secret'])

        login_resp = login(client, user.email, 'strongpass123')
        mfa_token = login_resp.json()['mfa_token']

        csrf = set_csrf_cookie(client)
        code = pyotp.TOTP(secret, interval=settings.MFA_TOTP_STEP).now()
        response = client.post(
            reverse('mfa_login'),
            {'mfa_token': mfa_token, 'totp_code': code},
            content_type='application/json',
            **csrf,
        )
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.json()
        assert 'refresh_token' in response.cookies

    def test_mfa_login_with_backup_code_returns_jwt(self, client):
        user = create_user()
        secret = pyotp.random_base32()
        user.mfa_enabled = True
        user.mfa_secret = _encrypt_secret(secret)
        user.save(update_fields=['mfa_enabled', 'mfa_secret'])

        plain_code = '12345678'
        MFABackupCode.objects.create(
            user=user, code_hash=_hash_backup_code(plain_code)
        )

        login_resp = login(client, user.email, 'strongpass123')
        mfa_token = login_resp.json()['mfa_token']

        csrf = set_csrf_cookie(client)
        response = client.post(
            reverse('mfa_login'),
            {'mfa_token': mfa_token, 'totp_code': plain_code},
            content_type='application/json',
            **csrf,
        )
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.json()

        backup = MFABackupCode.objects.get(user=user, code_hash=_hash_backup_code(plain_code))
        assert backup.used is True

    def test_mfa_login_rejects_used_backup_code(self, client):
        user = create_user()
        secret = pyotp.random_base32()
        user.mfa_enabled = True
        user.mfa_secret = _encrypt_secret(secret)
        user.save(update_fields=['mfa_enabled', 'mfa_secret'])

        plain_code = '12345678'
        MFABackupCode.objects.create(
            user=user, code_hash=_hash_backup_code(plain_code), used=True
        )

        login_resp = login(client, user.email, 'strongpass123')
        mfa_token = login_resp.json()['mfa_token']

        csrf = set_csrf_cookie(client)
        response = client.post(
            reverse('mfa_login'),
            {'mfa_token': mfa_token, 'totp_code': plain_code},
            content_type='application/json',
            **csrf,
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_mfa_login_rejects_invalid_token(self, client):
        csrf = set_csrf_cookie(client)
        response = client.post(
            reverse('mfa_login'),
            {'mfa_token': 'invalid.token.here', 'totp_code': '123456'},
            content_type='application/json',
            **csrf,
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_mfa_login_rejects_wrong_code(self, client):
        user = create_user()
        secret = pyotp.random_base32()
        user.mfa_enabled = True
        user.mfa_secret = _encrypt_secret(secret)
        user.save(update_fields=['mfa_enabled', 'mfa_secret'])

        login_resp = login(client, user.email, 'strongpass123')
        mfa_token = login_resp.json()['mfa_token']

        csrf = set_csrf_cookie(client)
        response = client.post(
            reverse('mfa_login'),
            {'mfa_token': mfa_token, 'totp_code': '000000'},
            content_type='application/json',
            **csrf,
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ── Disable ────────────────────────────────────────────────────────────────

class TestMFADisable:

    def test_disable_mfa_with_password_and_totp(self, client):
        user = create_user()
        secret = pyotp.random_base32()
        user.mfa_enabled = True
        user.mfa_secret = _encrypt_secret(secret)
        user.save(update_fields=['mfa_enabled', 'mfa_secret'])
        MFABackupCode.objects.create(user=user, code_hash='fake')

        headers = get_jwt_header(user)
        csrf = set_csrf_cookie(client)

        code = pyotp.TOTP(secret, interval=settings.MFA_TOTP_STEP).now()
        response = client.post(
            reverse('mfa_disable'),
            {'password': 'strongpass123', 'totp_code': code},
            content_type='application/json',
            **headers, **csrf,
        )
        assert response.status_code == status.HTTP_200_OK

        user.refresh_from_db()
        assert user.mfa_enabled is False
        assert user.mfa_secret == ''
        assert MFABackupCode.objects.filter(user=user).count() == 0

    def test_disable_rejects_wrong_password(self, client):
        user = create_user()
        secret = pyotp.random_base32()
        user.mfa_enabled = True
        user.mfa_secret = _encrypt_secret(secret)
        user.save(update_fields=['mfa_enabled', 'mfa_secret'])

        headers = get_jwt_header(user)
        csrf = set_csrf_cookie(client)

        code = pyotp.TOTP(secret, interval=settings.MFA_TOTP_STEP).now()
        response = client.post(
            reverse('mfa_disable'),
            {'password': 'wrongpassword', 'totp_code': code},
            content_type='application/json',
            **headers, **csrf,
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_disable_rejects_wrong_totp(self, client):
        user = create_user()
        secret = pyotp.random_base32()
        user.mfa_enabled = True
        user.mfa_secret = _encrypt_secret(secret)
        user.save(update_fields=['mfa_enabled', 'mfa_secret'])

        headers = get_jwt_header(user)
        csrf = set_csrf_cookie(client)

        response = client.post(
            reverse('mfa_disable'),
            {'password': 'strongpass123', 'totp_code': '000000'},
            content_type='application/json',
            **headers, **csrf,
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_disable_rejected_when_mfa_not_enabled(self, client):
        user = create_user()
        headers = get_jwt_header(user)
        csrf = set_csrf_cookie(client)

        response = client.post(
            reverse('mfa_disable'),
            {'password': 'strongpass123', 'totp_code': '123456'},
            content_type='application/json',
            **headers, **csrf,
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
