import pytest
from django.conf import settings
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from audit.models import AuditLog
from accounts.models import RoleChoices

User = get_user_model()

pytestmark = pytest.mark.django_db


def set_csrf_cookie(client):
    client.cookies['csrftoken'] = 'test-csrf-token'
    return {'HTTP_X_CSRFTOKEN': 'test-csrf-token'}


def create_user(email='student@aastu.edu.et', password='strongpass123', role=RoleChoices.STUDENT):
    return User.objects.create_user(email=email, password=password, role=role)


def register_user(client, email, password='StrongPass123!', role=RoleChoices.STUDENT, **extra):
    data = {'email': email, 'password': password, 'first_name': 'Test', 'last_name': 'User', 'role': role}
    data.update(extra)
    if role == RoleChoices.STUDENT:
        data.setdefault('student_identifier', f'STU-{email.split("@")[0]}')
    elif role == RoleChoices.LECTURER:
        data.setdefault('faculty_identifier', f'FAC-{email.split("@")[0]}')
    csrf_headers = set_csrf_cookie(client)
    return client.post(reverse('auth_register'), data, content_type='application/json', **csrf_headers)


def test_login_success_and_generic_failure_responses(client):
    user = create_user()

    login_url = reverse('auth_login')
    csrf_headers = set_csrf_cookie(client)
    success = client.post(login_url, {'email': user.email, 'password': 'strongpass123'}, content_type='application/json', **csrf_headers)
    assert success.status_code == status.HTTP_200_OK
    assert 'access' in success.json()
    assert 'refresh_token' in success.cookies
    assert 'csrftoken' in success.cookies

    failure_email = client.post(login_url, {'email': 'wrong@aastu.edu.et', 'password': 'strongpass123'}, content_type='application/json', **csrf_headers)
    failure_password = client.post(login_url, {'email': user.email, 'password': 'wrongpass'}, content_type='application/json', **csrf_headers)

    assert failure_email.status_code == status.HTTP_401_UNAUTHORIZED
    assert failure_password.status_code == status.HTTP_401_UNAUTHORIZED
    assert failure_email.json() == failure_password.json()
    assert failure_email.json() == {'detail': 'Invalid email or password.'}


def test_refresh_with_valid_token_issues_access_token(client):
    user = create_user()
    csrf_headers = set_csrf_cookie(client)
    client.post(reverse('auth_login'), {'email': user.email, 'password': 'strongpass123'}, content_type='application/json', **csrf_headers)

    refresh_url = reverse('auth_refresh')
    response = client.post(refresh_url, {}, content_type='application/json', **csrf_headers)

    assert response.status_code == status.HTTP_200_OK
    assert response.json().get('access')
    assert 'refresh_token' in response.cookies


def test_refresh_with_json_body_payload(client):
    user = create_user()
    refresh = RefreshToken.for_user(user)

    refresh_url = reverse('auth_refresh')
    response = client.post(
        refresh_url,
        {'refresh': str(refresh)},
        content_type='application/json',
    )
    assert response.status_code == status.HTTP_200_OK
    assert 'access' in response.json()
    assert 'refresh' in response.json()


def test_refresh_rejects_missing_token(client):
    client.cookies.clear()
    csrf_headers = set_csrf_cookie(client)
    response = client.post(reverse('auth_refresh'), {}, content_type='application/json', **csrf_headers)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json() == {'detail': 'Invalid or expired refresh token.'}


def test_refresh_rejects_malformed_token(client):
    csrf_headers = set_csrf_cookie(client)
    response = client.post(
        reverse('auth_refresh'),
        {'refresh': 'malformed.token.value'},
        content_type='application/json',
        **csrf_headers,
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json() == {'detail': 'Invalid or expired refresh token.'}


def test_refresh_rejects_expired_or_blacklisted_token(client):
    user = create_user()
    refresh = RefreshToken.for_user(user)
    refresh.blacklist()

    client.cookies[settings.JWT_AUTH_COOKIE] = str(refresh)
    csrf_headers = set_csrf_cookie(client)
    response = client.post(reverse('auth_refresh'), {}, content_type='application/json', **csrf_headers)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_refresh_token_rotation_invalidates_previous_token(client):
    user = create_user()
    csrf_headers = set_csrf_cookie(client)
    login_res = client.post(reverse('auth_login'), {'email': user.email, 'password': 'strongpass123'}, content_type='application/json', **csrf_headers)
    first_cookie = login_res.cookies[settings.JWT_AUTH_COOKIE].value

    # First refresh succeeds and rotates cookie
    first_refresh = client.post(reverse('auth_refresh'), {}, content_type='application/json', **csrf_headers)
    assert first_refresh.status_code == status.HTTP_200_OK
    second_cookie = first_refresh.cookies[settings.JWT_AUTH_COOKIE].value
    assert first_cookie != second_cookie

    # Trying to reuse old rotated token is rejected because it was blacklisted
    client.cookies[settings.JWT_AUTH_COOKIE] = first_cookie
    second_refresh = client.post(reverse('auth_refresh'), {}, content_type='application/json', **csrf_headers)
    assert second_refresh.status_code == status.HTTP_401_UNAUTHORIZED


def test_logout_blacklists_refresh_token_and_prevents_refresh(client):
    user = create_user()
    csrf_headers = set_csrf_cookie(client)
    login_response = client.post(reverse('auth_login'), {'email': user.email, 'password': 'strongpass123'}, content_type='application/json', **csrf_headers)
    assert login_response.status_code == status.HTTP_200_OK

    logout_response = client.post(reverse('auth_logout'), {}, content_type='application/json', **csrf_headers)
    assert logout_response.status_code == status.HTTP_200_OK

    refresh_response = client.post(reverse('auth_refresh'), {}, content_type='application/json', **csrf_headers)
    assert refresh_response.status_code == status.HTTP_401_UNAUTHORIZED


def test_logout_with_body_payload_blacklists_token(client):
    user = create_user()
    refresh = RefreshToken.for_user(user)

    logout_response = client.post(
        reverse('auth_logout'),
        {'refresh': str(refresh)},
        content_type='application/json',
    )
    assert logout_response.status_code == status.HTTP_200_OK

    # Re-using the token to refresh fails
    refresh_response = client.post(
        reverse('auth_refresh'),
        {'refresh': str(refresh)},
        content_type='application/json',
    )
    assert refresh_response.status_code == status.HTTP_401_UNAUTHORIZED


# ── Email domain restriction tests ─────────────────────────────────────────

class TestEmailDomainRestriction:

    def test_student_registration_with_valid_aastu_email(self, client):
        response = register_user(client, 'student@aastu.edu.et')
        assert response.status_code == status.HTTP_201_CREATED
        assert User.objects.filter(email='student@aastu.edu.et').exists()

    def test_student_registration_with_subdomain_aastu_email(self, client):
        response = register_user(client, 'student@cit.aastu.edu.et')
        assert response.status_code == status.HTTP_201_CREATED

    def test_student_registration_with_invalid_domain_rejected(self, client):
        response = register_user(client, 'student@gmail.com')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'approved educational domains' in str(response.json())

    def test_lecturer_registration_with_valid_aastu_email(self, client):
        response = register_user(
            client, 'lecturer@aastu.edu.et', role=RoleChoices.LECTURER
        )
        assert response.status_code == status.HTTP_201_CREATED

    def test_lecturer_registration_with_invalid_domain_rejected(self, client):
        response = register_user(
            client, 'lecturer@yahoo.com', role=RoleChoices.LECTURER
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_admin_registration_with_invalid_domain_rejected(self, client):
        response = register_user(
            client, 'admin@random-domain.com', role=RoleChoices.ADMIN
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_email_is_case_insensitive(self, client):
        response = register_user(client, 'Student@AASTU.EDU.ET')
        assert response.status_code == status.HTTP_201_CREATED
        assert User.objects.filter(email='student@aastu.edu.et').exists()
