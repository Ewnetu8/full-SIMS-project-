# Online Examination Module: Backend Integration Specifications

This document outlines the API specifications, data structures, real-time protocols, and state synchronization contracts required to connect the Frontend Examination Module (`src/features/examination/`) to a Django REST Framework (DRF) backend service.

---

## 1. REST API Endpoints Overview

| Endpoint | Method | Description | Request Payload | Response |
| :--- | :--- | :--- | :--- | :--- |
| `/api/v1/exams/{id}/session/` | `POST` | Initialize/retrieve active exam session | `{}` | `ExaminationSession` |
| `/api/v1/exams/{id}/draft/` | `PUT` | Periodic auto-save heartbeat | `{ answers, secondsRemaining, lastQuestionIndex }` | `{ status: "saved", savedAt: string }` |
| `/api/v1/exams/{id}/submit/` | `POST` | Final submission of examination | `{ answers: Record<string, ExaminationAnswer> }` | `SubmissionReceipt` |
| `/api/v1/exams/{id}/receipt/` | `GET` | Retrieve past submission receipt | None | `SubmissionReceipt` |

---

## 2. Payload Schema Mapping

### A. Exam Session Payload (`GET /api/v1/exams/{id}/session/`)
```json
{
  "id": "exam-csc220-midterm",
  "courseCode": "CSC 220",
  "courseTitle": "Data Structures & Algorithms",
  "examTitle": "Midterm Examination",
  "durationMinutes": 60,
  "totalPoints": 100,
  "passingScore": 60,
  "instructions": [
    "Ensure a stable internet connection throughout the exam session.",
    "Calculators are not permitted for this examination."
  ],
  "questions": [
    {
      "id": "q1",
      "type": "MULTIPLE_CHOICE",
      "questionText": "What is the worst-case time complexity of QuickSort?",
      "points": 5,
      "order": 1,
      "options": [
        { "id": "opt-1", "text": "O(n log n)" },
        { "id": "opt-2", "text": "O(n^2)" },
        { "id": "opt-3", "text": "O(n)" },
        { "id": "opt-4", "text": "O(1)" }
      ]
    },
    {
      "id": "q4",
      "type": "ESSAY",
      "questionText": "Explain the difference between a mutex and a semaphore.",
      "points": 15,
      "order": 4,
      "minWords": 50,
      "maxWords": 300
    }
  ]
}
```

### B. Auto-Save Heartbeat (`PUT /api/v1/exams/{id}/draft/`)
```json
{
  "answers": {
    "q1": {
      "questionId": "q1",
      "selectedOptionId": "opt-2",
      "updatedAt": "2026-07-22T02:00:10.000Z"
    },
    "q4": {
      "questionId": "q4",
      "textValue": "A mutex (mutual exclusion) object allows only one thread to access a resource...",
      "updatedAt": "2026-07-22T02:00:15.000Z"
    }
  },
  "secondsRemaining": 3240,
  "lastQuestionIndex": 3
}
```

### C. Final Submission (`POST /api/v1/exams/{id}/submit/`)
```json
{
  "answers": {
    "q1": { "questionId": "q1", "selectedOptionId": "opt-2", "updatedAt": "2026-07-22T02:00:10.000Z" },
    "q2": { "questionId": "q2", "selectedOptionIds": ["opt-1", "opt-3"], "updatedAt": "2026-07-22T02:00:12.000Z" },
    "q3": { "questionId": "q3", "booleanValue": true, "updatedAt": "2026-07-22T02:00:14.000Z" },
    "q4": { "questionId": "q4", "textValue": "A mutex...", "updatedAt": "2026-07-22T02:00:15.000Z" }
  }
}
```

### D. Submission Receipt (`SubmissionReceipt`)
```json
{
  "receiptId": "RCP-892F7A1K",
  "examId": "exam-csc220-midterm",
  "examTitle": "Midterm Examination",
  "courseCode": "CSC 220",
  "submittedAt": "2026-07-22T02:15:00.000Z",
  "totalQuestions": 4,
  "answeredQuestions": 4,
  "status": "SUBMITTED",
  "message": "Your examination responses have been successfully recorded and submitted for grading."
}
```

---

## 3. Real-Time Synchronization & Server-Side Enforcement

1. **Server-Side Timer Enforcement**:
   - The server maintains the true start and expiration timestamps for the session.
   - If the client submits after `expiryTimestamp`, the server will auto-submit all previously saved drafts.
2. **WebSocket / SSE Option (Optional for High-Concurrence)**:
   - WebSocket endpoint `wss://api.domain.com/ws/exams/{id}/session/` can be used to stream timer syncs, connectivity alerts, and forced session termination commands.
3. **Anti-Tampering & Security**:
   - DRF permissions MUST enforce that the logged-in student owns the active session.
   - Responses submitted for completed or expired sessions must return `HTTP 403 Forbidden` or `HTTP 409 Conflict`.
   - Questions and options ordering should be randomized server-side per student session.

---

## 4. Frontend State Handshake (`useExaminationStore`)

- On initialization: Call `examinationService.getSession(id)` -> populate store state.
- On answer change: Update local Zustand store immediately; debounce draft sync (3-second timer) to submit to `/api/v1/exams/{id}/draft/`.
- On page unload / browser close: Dispatch `navigator.sendBeacon('/api/v1/exams/{id}/draft/', payload)` to ensure last-second answers are preserved.
- On explicit submit: POST to `/api/v1/exams/{id}/submit/` -> update store with `SubmissionReceipt` -> navigate to `/student/exams/{id}/submitted`.
