# Mock Interview — Frontend Integration

This document describes how to use and test the Mock Interview page in the frontend (`src/pages/MockInterview.jsx`). It also explains the new "Generate Questions" feature which calls the backend `/mock-interview/generate-questions` endpoint.

## Prerequisites

- Backend running and signed in as a user with at least one uploaded PDF resume stored under `uploads/resumes` and referenced in `user_details.resumes`.
- A `user_interview_schedule` entry for the target user (the `schedule_id` is required by the backend route).
- If you want the generated questions saved to DB, you must be the schedule owner or a `super_admin` user and set the "Persist" checkbox.

## Using the Mock Interview Page

1. Start the frontend app (e.g., `npm run dev` in `frontend`).
2. Log in as the user who has resumes.
3. Navigate to `Mock Interview` from the app menu.
4. The left panel lists available resumes; select a PDF resume and click `Extract`.
5. After extraction, you will see: filename, pages, extracted text, and parsed metadata (emails, phones, skills).
6. To generate questions:
   - Select the **Schedule** from the dropdown (populated from your `user_interview_schedule` entries).
   - Optionally set `Question Count` (default: 10).
   - Optionally check `Persist (save to DB)` to save generated questions (requires permission).
   - Click `Generate Questions`.
7. Generated questions will render below the controls with their difficulty, focus area and example answer.

## Implementation notes

- The `MockInterview.jsx` component uses these API endpoints:
  - `GET /mock-interview/resumes/:userId` — list available resumes
  - `GET /mock-interview/resume-extract/:userId?index=N` — extract text & metadata from a selected resume
  - `POST /mock-interview/generate-questions` — generate interview questions; request body: `{ schedule_id, index | filename, question_count, persist }`

- The component expects the backend to return `questions` as an array of objects with keys: `question`, `difficulty`, `focus_area`, `example_answer`.

## Troubleshooting

- If generation fails with `schedule_id is required`, ensure you provide a valid schedule id (check `user_interview_schedule` in DB).
- If no resumes appear, verify that `user_details.resumes` points to resume URLs and that the actual files exist in `uploads/resumes`.

---

If you'd like, I can add a small helper to fetch schedules for the logged-in user and show them in a dropdown instead of entering Schedule ID manually.