# Smart Internship Monitoring System

Web-based platform for internship tracking, reporting, evaluation, and progress monitoring, developed for **IIC 3341 ICT Project**, University of Sri Jayewardenepura.

## Features

- **Role-based access** - Student, University Supervisor, Company, Administrator
- **Daily diary management** - Digital internship diary with optional AI enhancement
- **Weekly report generation** - Auto-generated from diary entries with verification workflow
- **Skill evaluation** - Technical and soft skill ratings by company supervisors
- **Analytics dashboards** - Progress tracking, hours logged, skill charts
- **Notification system** - Automated alerts for submissions, verifications, and deadlines
- **Final report export** - Download compiled internship report

## Tech Stack

- React 19 + TypeScript + Vite
- Firebase Auth, Firestore, Storage, and Hosting
- Gemini API for AI assistance
- Recharts for analytics

## Quick Start

The app runs in demo mode without Firebase credentials. Demo data is stored in `localStorage`.

```bash
cd internship-monitor
npm install
npm run dev
```

Open `http://localhost:5173` and use the **Quick demo login** buttons for any role.

## Production Setup

1. Copy `.env.example` to `.env` and fill in Firebase and Gemini credentials.
2. Create a Firebase project at `https://console.firebase.google.com`.
3. Enable Authentication with Email/Password and create a Firestore database.
4. Deploy Firestore rules:

```bash
firebase deploy --only firestore:rules
```

5. Build and deploy the app:

```bash
npm run build
firebase deploy --only hosting
```

## REST API Backend

The project includes a Firebase Cloud Functions REST API in `functions/`. It uses Firebase Admin SDK with Firestore as the database and Firebase Auth ID tokens for request authentication.

Install and build the API:

```bash
cd functions
npm install
npm run build
```

Run locally with Firebase emulators:

```bash
npm run serve
```

Deploy the API:

```bash
firebase deploy --only functions
```

All protected endpoints require this header:

```http
Authorization: Bearer <firebase-id-token>
```

Available endpoints:

- `GET /api/health`
- `GET /api/me`
- `GET /api/users`
- `POST /api/users`
- `GET /api/users/:uid`
- `PATCH /api/users/:uid`
- `DELETE /api/users/:uid`
- `GET /api/diaries?studentId=:uid`
- `POST /api/diaries`
- `PATCH /api/diaries/:id`
- `DELETE /api/diaries/:id`
- `GET /api/reports?studentId=:uid&status=:status`
- `POST /api/reports`
- `PATCH /api/reports/:id`
- `GET /api/internships?studentId=:uid&supervisorId=:uid`
- `POST /api/internships`
- `PATCH /api/internships/:id`
- `GET /api/evaluations?studentId=:uid`
- `POST /api/evaluations`
- `GET /api/notifications?userId=:uid`
- `POST /api/notifications`
- `PATCH /api/notifications/:id/read`

## Presentation Documentation

Use [docs/PROJECT_PRESENTATION_DOCUMENT.md](docs/PROJECT_PRESENTATION_DOCUMENT.md) for the full project explanation, architecture, database design, API overview, demo plan, slide outline, and viva questions.

## Workflow

1. **Student** submits daily diary entries, optionally AI-enhanced.
2. **Student** generates and submits weekly reports.
3. **Company** verifies reports and submits skill evaluations.
4. **Supervisor** reviews and approves verified reports.
5. **Admin** manages users, internships, and system notifications.

## Team

Group 16 - Faculty of Technology, USJ
