# Continuous Assessment Marks — Teacher Guide (Backend)

How lecturers submit **Test / Assignment / Other** marks for their courses and how those marks build up each student's **total mark**, plus how to try everything in Swagger.

---

## 1. How it works

### The chain of relationships

```
Lecturer ──TeachingAssignment──▶ CourseOffering ◀──Enrollment── Student
                                     │
                                     ▼
                                Assessment  (Test / Assignment / Other)
                                     │
                                     ▼
                                  Mark  (one score per enrolled student)
```

| Model | App | What it stores |
|---|---|---|
| `TeachingAssignment` | academics | Which lecturer teaches which course offering ("my courses"). Only assigned lecturers can enter marks. |
| `Assessment` | results | One gradable item: title, type (`TEST`, `ASSIGNMENT`, `OTHER`), `max_marks` (e.g. 30), `weight` (% of course total, e.g. 30%), publish flag. Title must be unique per offering; all weights in one offering cannot exceed 100%. |
| `Mark` | results | The score one enrolled student earned on one assessment (+ remarks). Re-submitting updates instead of duplicating. |

### The marking workflow

1. **Admin assigns** the lecturer to a course offering (`POST /api/v1/teaching-assignments`).
2. **Lecturer creates assessments** for that offering — e.g. *Test 1* (max 30, weight 30%) and *Assignment 1* (type ASSIGNMENT, max 20, weight 20%).
3. **Lecturer submits marks in bulk** — one request with many students at once. Rules enforced:
   - every student must be enrolled (non-dropped) in that exact offering;
   - a score can never be negative or above `max_marks`;
   - the whole batch is atomic — one bad row rejects everything;
   - sending the same student twice simply updates their mark.
4. **Running totals**: total = Σ(score ÷ max_marks × weight), normalized over the assessments already graded, so mid-semester percentages stay meaningful even before everything is marked.
5. **Publishing**:
   - Publishing an assessment (`PATCH is_published=true`) notifies enrolled students.
   - `POST /publish-results` converts each student's total over **published** assessments into a letter grade and writes it onto the enrollment:

     | % | Grade | | % | Grade |
     |---|---|---|---|---|
     | ≥85 | A | | ≥50 | C |
     | ≥80 | A− | | ≥45 | C− |
     | ≥75 | B+ | | ≥40 | D |
     | ≥70 | B | | <40 | F |
     | ≥65 | B− | | | |
     | ≥60 | C+ | | | |

     Pass threshold is **50%** → enrollment status becomes `PASSED` or `FAILED`. Every student is notified individually.

### Who can do what

| Action | Lecturer | Admin | Student |
|---|---|---|---|
| Assign teachers | ✗ | ✓ | ✗ |
| See "my courses" | ✓ (own only) | – | ✗ |
| Create/edit/delete assessments | ✓ (assigned offerings only) | ✓ (all) | ✗ |
| Submit/edit marks | ✓ (assigned offerings only) | ✓ | ✗ |
| View mark sheet / gradebook | ✓ (assigned only) | ✓ | ✗ |
| View own marks & running total | ✗ | ✗ | ✓ (`/my-marks`, published assessments only) |

Every submission, update, deletion and publication is written to the append-only audit log.

---

## 2. Endpoints at a glance

| Method & path | Purpose |
|---|---|
| `POST /api/v1/auth/login` | Get your access token |
| `GET /api/v1/my-courses` | Courses I teach |
| `GET /api/v1/teaching-assignments` · `POST` · `PATCH/{id}` · `DELETE/{id}` | Admin manages assignments |
| `GET /api/v1/course-offerings/{offering_pk}/assessments` · `POST` | List / create assessments (`?type=TEST\|ASSIGNMENT\|OTHER`) |
| `GET /api/v1/assessments/{id}` · `PATCH` · `DELETE` | Assessment detail / publish / delete |
| `GET /api/v1/assessments/{id}/marks` | Mark sheet (all students, graded or not) |
| `POST /api/v1/assessments/{id}/marks` | **Bulk submit marks** |
| `PATCH /api/v1/marks/{id}` | Edit one mark |
| `GET /api/v1/course-offerings/{offering_pk}/gradebook` | Full gradebook matrix with totals |
| `POST /api/v1/course-offerings/{offering_pk}/publish-results` | Finalize letter grades |
| `GET /api/v1/my-marks?course_offering={id}` | My marks as a student |

---

## 3. How to show it in Swagger

### Step 0 — run the server

```bash
cd SIMS-backend
python manage.py migrate
python manage.py runserver
```

Open **http://127.0.0.1:8000/api/docs/** (Swagger UI). ReDoc version: `/api/redoc/`.

### Step 1 — authenticate

In Swagger UI click the **Authorize 🔓** button (top right).

You need a token first. Scroll to **auth** section → `POST /api/v1/auth/login` → *"Try it out"* with:

```json
{ "email": "lecturer@university.edu", "password": "yourpassword" }
```

Copy the `access` value from the response. Then in the **Authorize** dialog enter:

```
Bearer <paste-access-token-here>
```

and click Authorize. Now every request you fire from Swagger carries your identity.

> Tip: log in once as an **admin** to assign teaching-assignments, then again as a **lecturer** to do mark entry, and finally as a **student** to check `/my-marks`.

### Step 2 — admin: assign the lecturer (once)

`POST /api/v1/teaching-assignments`

```json
{
  "lecturer": "<lecturer-profile-uuid>",
  "course_offering": "<course-offering-uuid>"
}
```

### Step 3 — lecturer: create an assessment

`POST /api/v1/course-offerings/{offering_pk}/assessments`

```json
{
  "title": "Test 1",
  "assessment_type": "TEST",
  "max_marks": "30.00",
  "weight": "30.00",
  "description": "Chapters 1–3"
}
```

Repeat for an assignment:

```json
{
  "title": "Assignment 1",
  "assessment_type": "ASSIGNMENT",
  "max_marks": "20.00",
  "weight": "20.00"
}
```

Try `weight` values that sum past 100% — Swagger will show you the 400 validation error live.

### Step 4 — lecturer: submit marks in bulk

`GET /api/v1/assessments/{id}/marks` first to copy enrollment UUIDs from the mark sheet, then:

`POST /api/v1/assessments/{id}/marks`

```json
{
  "marks": [
    { "enrollment": "<enrollment-uuid-1>", "score": "27.50", "remarks": "excellent" },
    { "enrollment": "<enrollment-uuid-2>", "score": "15.00", "remarks": "late submission" },
    { "enrollment": "<enrollment-uuid-3>", "score": "22.00" }
  ]
}
```

The response is the updated full mark sheet. Send it again with changed scores — nothing duplicates, marks are updated.

### Step 5 — lecturer: watch the gradebook

`GET /api/v1/course-offerings/{offering_pk}/gradebook`

Returns assessment columns plus one row per student with all marks and the running weighted total and provisional letter.

### Step 6 — publish

Publish an assessment (notifies students):

```json
PATCH /api/v1/assessments/{id}
{ "is_published": true }
```

Finalize the course:

```
POST /api/v1/course-offerings/{offering_pk}/publish-results
```

Response shows every student's percent, letter grade, and PASSED/FAILED status.

### Step 7 — student view

Log in via `/auth/login` as a student, authorize, then:

```
GET /api/v1/my-marks
```

Shows published assessments only, own scores, remarks, and the running total per course.

---

## 4. Where the code lives

```
SIMS-backend/
├── academics/models.py              # TeachingAssignment
├── results/models.py                # Assessment, Mark (+ existing Result, Transcript)
├── results/services.py              # totals, letter grades, publish logic
├── results/serializers.py           # API schemas & validation
├── results/views.py                 # all endpoints (APIView style)
├── results/urls.py                  # routing
├── results/admin.py                 # Django admin support
└── results/tests/                   # 25 tests (CRUD, permissions, totals, publishing)
```
