# AI-Powered Examination & Grading System — SIMS Backend

This directory contains the complete backend scaffold for the AASTU AI-Powered Student Information & Examination Management System, written using **Django 5.x**, **Django REST Framework (DRF)**, **PostgreSQL**, **Redis**, and **Celery**.

The backend layer is completely stateless (sessionless) and relies on HTTP-only, secure, SameSite JSON Web Tokens (JWT) for authentication.

---

## Technical Stack & Ports
- **Nginx**: Ports `80` (redirects to HTTPS) and `443` (TLS termination with self-signed certificate).
- **Gunicorn / Web**: Port `8000` (internal, served via Nginx reverse proxy).
- **PostgreSQL 15**: Port `5432` (internal & exposed locally).
- **Redis 7**: Port `6379` (internal broker).
- **Celery Worker**: Background task consumer.

---

## Directory Structure
- `core/`: Main Django project configuration, Celery worker configuration, and settings split (`base.py`, `dev.py`, `prod.py`).
- `common/`: Houses the abstract `BaseModel` (inherits UUID primary keys, `created_at` and `updated_at` fields).
- `accounts/`: Handles User registration, login, logout, refresh token blacklisting, role permissions, and signal audit handlers.
- `academics/`: Contains schema definitions for Department, Course, AcademicYear, Semester, and Enrollment.
- `questions/`: Contains Question and QuestionOption models.
- `exams/`: Schema models for Examinations, ExamAttempts, and StudentAnswers.
- `ai_grading/`: Models for AIEvaluation and AIFeedback.
- `results/`: Models for final Results and Transcripts.
- `notifications/`: User notifications.
- `audit/`: Append-only `AuditLog` database table.

---

## Local Setup & Containerization

### 1. Configure Environment Variables
Copy `.env.example` to `.env` and adjust the variables if needed:
```bash
cp .env.example .env
```

### 2. Boot up using Docker Compose
To boot all services (PostgreSQL, Redis, Django Web, Celery Worker, and Nginx with automatic TLS generation), run:
```bash
docker-compose up --build -d
```

### 3. Generate Database Migrations & Apply Them
Once the web and database containers are up, execute migration commands inside the container:
```bash
# Generate initial migration files
docker-compose exec web python manage.py makemigrations

# Apply migrations
docker-compose exec web python manage.py migrate

# Create a superuser to access the Django admin panel
docker-compose exec web python manage.py createsuperuser
```

### 4. Verify Endpoints via Nginx (HTTPS)
You can verify the authentication endpoints by hitting the secure proxy on `https://localhost`:
- **Register**: `POST https://localhost/api/v1/auth/register`
- **Login**: `POST https://localhost/api/v1/auth/login` (Returns access token in JSON body, sets HTTP-only `refresh_token` cookie)
- **Refresh**: `POST https://localhost/api/v1/auth/refresh` (Reads HTTP-only cookie, returns new access token)
- **Logout**: `POST https://localhost/api/v1/auth/logout` (Blacklists refresh token, clears cookie)

---

## Running Tests

If you have a local virtual environment activated and dependencies installed (or if you are running pytest directly inside the docker container), run:

### Running Tests inside Docker Container (Recommended)
```bash
docker-compose exec web pytest
```

### Running Tests Locally (Outside Docker)
Since the `dev.py` settings fall back to SQLite when PostgreSQL environmental variables are missing, you can run tests locally without spinning up PostgreSQL:
```bash
pip install -r requirements.txt
pytest
```

To run with coverage breakdown:
```bash
pytest --cov=accounts --cov-report=term-missing
```
The test suite validates registration edge cases, weak password rejection, generic 401 login errors, refresh token cookie generation, and blacklisting behavior.
