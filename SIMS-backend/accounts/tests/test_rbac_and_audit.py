import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status

from audit.models import AuditLog
from accounts.models import RoleChoices

User = get_user_model()

pytestmark = pytest.mark.django_db


def create_user(email='lecturer@aastu.edu.et', password='strongpass123', role=RoleChoices.LECTURER):
    return User.objects.create_user(email=email, password=password, role=role)


def test_lecturer_protected_route_for_student_is_forbidden(client):
    student = create_user(email='student@aastu.edu.et', role=RoleChoices.STUDENT)
    login_response = client.post(
        reverse('auth_login'),
        {'email': student.email, 'password': 'strongpass123'},
        content_type='application/json',
    )
    assert login_response.status_code == status.HTTP_200_OK

    access_token = login_response.json()['access']
    protected = client.get(
        reverse('lecturer_protected'),
        HTTP_AUTHORIZATION=f'Bearer {access_token}',
    )
    assert protected.status_code == status.HTTP_403_FORBIDDEN


def test_lecturer_protected_route_for_lecturer_is_allowed(client):
    lecturer = create_user(email='lecturer@aastu.edu.et', role=RoleChoices.LECTURER)
    login_response = client.post(
        reverse('auth_login'),
        {'email': lecturer.email, 'password': 'strongpass123'},
        content_type='application/json',
    )
    assert login_response.status_code == status.HTTP_200_OK

    access_token = login_response.json()['access']
    protected = client.get(
        reverse('lecturer_protected'),
        HTTP_AUTHORIZATION=f'Bearer {access_token}',
    )
    assert protected.status_code == status.HTTP_200_OK
    assert protected.json() == {'detail': 'Access granted for lecturer-only route.'}


def test_audit_log_created_for_login_success_failure_and_logout(client):
    user = create_user(email='auditor@aastu.edu.et', role=RoleChoices.STUDENT)
    login_response = client.post(reverse('auth_login'), {'email': user.email, 'password': 'strongpass123'}, content_type='application/json')
    assert login_response.status_code == status.HTTP_200_OK

    logout_response = client.post(reverse('auth_logout'), {}, content_type='application/json')
    assert logout_response.status_code == status.HTTP_200_OK

    _ = client.post(reverse('auth_login'), {'email': 'bad@aastu.edu.et', 'password': 'wrongpass'}, content_type='application/json')

    audit_entries = AuditLog.objects.filter(action_type__in=['LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGOUT'])
    assert audit_entries.count() == 3
    assert AuditLog.objects.filter(action_type='LOGIN_SUCCESS', actor=user).exists()
    assert AuditLog.objects.filter(action_type='LOGIN_FAILURE', actor__isnull=True).exists()
    assert AuditLog.objects.filter(action_type='LOGOUT', actor=user).exists()
