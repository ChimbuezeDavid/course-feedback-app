
# Course Feedback App

This repository implements a lightweight course feedback system used to collect, aggregate and review student evaluations of courses and lecturers.

Features at a glance:
- Student dashboard to submit ratings, per-lecturer ratings, and comments.
- Teacher dashboard to view aggregated feedback for courses.
- Admin dashboard to manage courses and lecturers and assign lecturers to courses.
- MongoDB-backed persistence and a single-file Node.js HTTP server (`server.js`).

## Quick Start

Prerequisites:
- Node.js (14+ recommended)
- A MongoDB instance (local or Atlas)

1. Install dependencies:

```bash
npm install
```

2. Configure environment (create a `.env` or export env vars):

```bash
# Example (PowerShell)
$env:MONGODB_URI='mongodb://localhost:27017'
$env:ADMIN_KEY='admin123'
$env:PORT=3006
node server.js
```

3. Start the server (example):

```bash
node server.js
```

By default the server will connect to the `course_feedback_app` database and serve static files from the `public/` folder. The server prints the listening port and confirms MongoDB connection on startup.

## Environment Variables

- `MONGODB_URI` — MongoDB connection string (required for DB-backed mode).
- `ADMIN_KEY` — Shared admin authorization key (default: `admin123` if not set).
- `PORT` — HTTP port (default: `3000` if not set).

## API Reference

Public endpoints:
- `GET /api/health` — Simple health check.
- `GET /api/courses` — List courses. Supports `?level=` filter.
- `POST /api/feedback` — Submit student feedback. Payload example:

```json
{
   "courseCode": "CSC101",
   "level": 100,
   "rating": 4,
   "lecturerRatings": [{ "lecturerId": "<id>", "rating": 5 }],
   "comments": "Great course",
   "wantsResponse": false
}
```
- `GET /api/feedback` — Aggregated feedback (supports `?level=`).

Admin endpoints (require header `Authorization: Bearer <ADMIN_KEY>`):
- `GET /api/admin/courses`
- `POST /api/admin/courses` — Create course (body: `{ code, name, level, lecturerId? }`).
- `PUT /api/admin/courses/:code` — Update course.
- `DELETE /api/admin/courses/:code` — Remove course.
- `GET /api/admin/lecturers`
- `POST /api/admin/lecturers` — Create lecturer (body: `{ name, role: "lecturer" }`).
- `PUT /api/admin/lecturers/:id`
- `DELETE /api/admin/lecturers/:id`

Security note: the server validates that `lecturerId` assignments reference a user with role `lecturer`.

## Data Model

- `courses` collection: `{ code, name, level, lecturerId?, lecturerName? }`
- `lecturers` collection: `{ _id, name, role }` (role expected to be `lecturer`)
- `feedback` collection: stores per-course aggregated records and raw entries used to compute averages

## Developer Notes

- The server is implemented in `server.js` (vanilla Node.js HTTP server). It connects to MongoDB and seeds default course and lecturer data on first run.
- Frontend is under `public/`:
   - `public/admin-dashboard.html` + `public/js/admin.js` — Admin UI and logic.
   - `public/student-dashboard.html` + `public/js/student.js` — Student UI.
   - `public/teacher-dashboard.html` — Teacher UI (reads aggregated feedback).

## Running Smoke Tests

An automated smoke test for admin flows is available at `scripts/admin-smoke-test.js`.

```bash
# Example (PowerShell)
$env:BASE_URL='http://localhost:3006'
node scripts/admin-smoke-test.js
```

## Next Steps / TODO

- Replace single-key admin auth with proper accounts (JWTs/passwords).
- Add rate-limiting, input sanitization for displayed HTML, and production hardening.
- Optionally add per-lecturer login and a view filtered to assigned courses.

## License

MIT — see LICENSE file if provided.

