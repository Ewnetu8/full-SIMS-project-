import pytest
from accounts.models import RoleChoices
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

from academics.models import University

User = get_user_model()

pytestmark = pytest.mark.django_db

LIST_URL = reverse("university_list")


def create_user(
    email="admin@aastu.edu.et", password="strongpass123", role=RoleChoices.ADMIN
):
    return User.objects.create_user(email=email, password=password, role=role)


def auth_client(client, user):
    login_response = client.post(
        reverse("auth_login"),
        {"email": user.email, "password": "strongpass123"},
        content_type="application/json",
    )
    assert login_response.status_code == status.HTTP_200_OK
    return login_response.json()["access"]


def test_create_university_succeeds(client):
    admin = create_user()
    token = auth_client(client, admin)

    response = client.post(
        LIST_URL,
        {"name": "Addis Ababa University", "code": "AAU"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["name"] == "Addis Ababa University"
    assert response.json()["code"] == "AAU"
    assert University.objects.filter(code="AAU").exists()


def test_create_duplicate_name_rejected(client):
    admin = create_user()
    token = auth_client(client, admin)

    client.post(
        LIST_URL,
        {"name": "Addis Ababa University", "code": "AAU"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )

    response = client.post(
        LIST_URL,
        {"name": "Addis Ababa University", "code": "AAU2"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "name" in response.json()


def test_create_duplicate_code_rejected(client):
    admin = create_user()
    token = auth_client(client, admin)

    client.post(
        LIST_URL,
        {"name": "Addis Ababa University", "code": "AAU"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )

    response = client.post(
        LIST_URL,
        {"name": "Hawassa University", "code": "AAU"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "code" in response.json()


def test_non_admin_gets_403(client):
    student = create_user(email="student@aastu.edu.et", role=RoleChoices.STUDENT)
    token = auth_client(client, student)

    response = client.get(
        LIST_URL,
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
