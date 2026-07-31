import pytest
from accounts.models import RoleChoices
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

from questions.models import Tag

User = get_user_model()

pytestmark = pytest.mark.django_db

LIST_URL = reverse("tag_list")


def create_user(email="admin@example.com", password="strongpass123", role=RoleChoices.ADMIN):
    return User.objects.create_user(email=email, password=password, role=role)


def auth_client(client, user):
    login_response = client.post(
        reverse("auth_login"),
        {"email": user.email, "password": "strongpass123"},
        content_type="application/json",
    )
    assert login_response.status_code == status.HTTP_200_OK
    return login_response.json()["access"]


def test_create_tag_succeeds(client):
    admin = create_user()
    token = auth_client(client, admin)

    response = client.post(
        LIST_URL,
        {"name": "algebra"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["name"] == "algebra"
    assert Tag.objects.filter(name="algebra").exists()


def test_create_duplicate_tag_rejected(client):
    admin = create_user()
    token = auth_client(client, admin)

    client.post(
        LIST_URL,
        {"name": "algebra"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )

    response = client.post(
        LIST_URL,
        {"name": "algebra"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_list_tags(client):
    admin = create_user()
    token = auth_client(client, admin)

    Tag.objects.create(name="algebra")
    Tag.objects.create(name="geometry")

    response = client.get(
        LIST_URL,
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 2


def test_tag_detail(client):
    admin = create_user()
    token = auth_client(client, admin)

    tag = Tag.objects.create(name="calculus")

    url = reverse("tag_detail", kwargs={"pk": tag.pk})
    response = client.get(
        url,
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["name"] == "calculus"


def test_tag_update(client):
    admin = create_user()
    token = auth_client(client, admin)

    tag = Tag.objects.create(name="old-name")

    url = reverse("tag_detail", kwargs={"pk": tag.pk})
    response = client.put(
        url,
        {"name": "new-name"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["name"] == "new-name"


def test_tag_partial_update(client):
    admin = create_user()
    token = auth_client(client, admin)

    tag = Tag.objects.create(name="partial")

    url = reverse("tag_detail", kwargs={"pk": tag.pk})
    response = client.patch(
        url,
        {"name": "updated"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["name"] == "updated"


def test_tag_delete(client):
    admin = create_user()
    token = auth_client(client, admin)

    tag = Tag.objects.create(name="delete-me")

    url = reverse("tag_detail", kwargs={"pk": tag.pk})
    response = client.delete(
        url,
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert not Tag.objects.filter(pk=tag.pk).exists()


def test_non_admin_cannot_create(client):
    student = create_user(email="student@example.com", role=RoleChoices.STUDENT)
    token = auth_client(client, student)

    response = client.post(
        LIST_URL,
        {"name": "test"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
