import pytest
from django.urls import reverse
from rest_framework import status

from accounts.models import RoleChoices, User
from academics.models import University, College, Department, Program, Course, DegreeLevelChoices

pytestmark = pytest.mark.django_db


def create_admin(university=None):
    return User.objects.create_user(email="admin_hier@aastu.edu.et", password="password123", role=RoleChoices.ADMIN, university=university)


def get_token(client, user):
    res = client.post(reverse("auth_login"), {"email": user.email, "password": "password123"}, content_type="application/json")
    return res.json()["access"]


def test_college_crud(client):
    uni = University.objects.create(name="Tech University", code="TECHU")
    admin = create_admin(university=uni)
    token = get_token(client, admin)
    headers = {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    # Create
    res = client.post(
        reverse("college_list"),
        {"university": str(uni.id), "name": "College of Engineering", "code": "coe"},
        content_type="application/json",
        **headers
    )
    assert res.status_code == status.HTTP_201_CREATED
    assert res.json()["code"] == "COE"
    college_id = res.json()["id"]

    # List
    res = client.get(reverse("college_list"), **headers)
    assert res.status_code == status.HTTP_200_OK
    assert len(res.json()) >= 1

    # Detail
    res = client.get(reverse("college_detail", kwargs={"pk": college_id}), **headers)
    assert res.status_code == status.HTTP_200_OK
    assert res.json()["name"] == "College of Engineering"


def test_department_and_program_crud(client):
    uni = University.objects.create(name="Tech University 2", code="TECHU2")
    admin = create_admin(university=uni)
    token = get_token(client, admin)
    headers = {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    college = College.objects.create(university=uni, name="College of Science", code="COS")

    # Department Create
    res = client.post(
        reverse("department_list"),
        {"college": str(college.id), "name": "Computer Science", "code": "cs"},
        content_type="application/json",
        **headers
    )
    assert res.status_code == status.HTTP_201_CREATED
    dept_id = res.json()["id"]

    # Program Create
    res = client.post(
        reverse("program_list"),
        {
            "department": dept_id,
            "name": "BSc Computer Science",
            "code": "BSCS",
            "degree_level": DegreeLevelChoices.BACHELOR,
            "total_credit_hours_required": 120
        },
        content_type="application/json",
        **headers
    )
    assert res.status_code == status.HTTP_201_CREATED
    program_id = res.json()["id"]

    # Course Create
    res = client.post(
        reverse("course_list"),
        {
            "program": program_id,
            "title": "Data Structures & Algorithms",
            "course_code": "cs201",
            "credit_hours": 4,
            "intended_class_standing": "SOPHOMORE"
        },
        content_type="application/json",
        **headers
    )
    assert res.status_code == status.HTTP_201_CREATED
    assert res.json()["course_code"] == "CS201"
