# Smart Internship Monitoring System

Web-based platform for internship tracking, reporting, evaluation, and progress monitoring, developed for **IIC 3341 ICT Project**, University of Sri Jayewardenepura.

## Project Setup Guide
Please follow these steps to set up the project on your local machine.

1. Prerequisites
Ensure you have Git installed on your computer.

Ensure you have the necessary runtime environment installed (Node.js).

2. Clone the Repository
Open your terminal and run the following commands:

Bash
# Clone the repository to your local machine
git clone https://github.com/shakiwijeratne/ICT-MINI-PROJECT.git

# Enter the project folder
cd ICT-MINI-PROJECT
3. Set Up Your Dedicated Branch
Do not work directly on main or dev/shakila. Create your own branch to keep your changes isolated:

### Create and switch to your own branch
git checkout -b dev/<your-name>
current branches: 
dev/hashini
dev/vishmi
dev/chameesha
dev/rangana

4. Environment Configuration
For security reasons, the .env file is not tracked by Git.

Locate the .env.example file in the root folder.
Create a copy of it and name it .env.
Open .env and fill in the required API keys or database credentials (shared via WhatsApp group).

5. Install Dependencies & Run
If Node.js: Run npm install followed by npm start.

6. Collaborative Workflow
To keep our code synchronized, follow this cycle:
Pull updates: Before starting, run git pull origin main to get the latest stable code.
Commit changes: git add . then git commit -m "Your descriptive message"
Push to your branch: git push -u origin dev/<your-name>

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
