# Smart Internship Monitoring System

## Project Presentation Document

**Project Title:** Web-Based Smart Internship Monitoring System  
**Module:** IIC 3341 ICT Project  
**Institution:** Faculty of Technology, University of Sri Jayewardenepura  
**Team:** Group 16  
**Application Type:** Web application with Firebase backend and REST API  

---

## 1. Introduction

The Smart Internship Monitoring System is a web-based platform designed to manage and monitor university internship activities. It supports students, university supervisors, company supervisors, and administrators through a centralized digital system.

Traditional internship monitoring often depends on manual reports, paper diaries, scattered communication, and delayed feedback. This system solves those issues by providing digital diary entries, weekly report generation, progress tracking, report verification, skill evaluation, notifications, and role-based dashboards.

The system also includes a Firebase-based REST API backend using Cloud Functions, allowing backend operations to be exposed through standard HTTP endpoints.

---

## 2. Problem Statement

Internship programs require continuous monitoring between students, companies, and university supervisors. In many cases, the process is manual and inefficient.

Common problems include:

- Students maintain internship diaries manually.
- Weekly reports are difficult to prepare and verify.
- Supervisors do not have real-time visibility into student progress.
- Company feedback is not centrally stored.
- Internship evaluations are delayed or inconsistent.
- Administrators lack a single system to manage users, internships, and notifications.

This project provides a digital solution to improve communication, transparency, and monitoring throughout the internship period.

---

## 3. Project Objectives

The main objective is to develop a smart web-based internship monitoring platform for students, university supervisors, company supervisors, and administrators.

Specific objectives:

- Provide secure role-based access.
- Allow students to create daily internship diary entries.
- Generate weekly internship reports from diary entries.
- Support AI-assisted diary improvement and report writing.
- Allow company supervisors to verify weekly reports.
- Allow university supervisors to review and approve reports.
- Provide skill evaluation for technical and soft skills.
- Track internship progress and working hours.
- Provide notifications for important actions.
- Provide a Firebase REST API backend for structured backend access.

---

## 4. Scope of the System

### Included Features

- User authentication and registration
- Student dashboard
- Daily diary management
- Weekly report generation
- Company report verification
- University supervisor report approval
- Skill evaluation
- Progress analytics
- Notification management
- Admin user management
- Internship assignment management
- Firebase REST API backend
- Demo mode using localStorage

### Not Included in Current Version

- Online payment features
- Video conferencing
- Mobile native application
- Advanced machine learning prediction
- Real-time chat

---

## 5. User Roles

### 5.1 Student

The student can:

- Login or register
- View internship dashboard
- Add daily diary entries
- Use AI assistance to improve diary content
- Generate weekly reports
- Submit reports for verification
- View progress and evaluations
- Receive notifications

### 5.2 Company Supervisor

The company supervisor can:

- View company dashboard
- Review submitted weekly reports
- Verify reports
- Add company feedback
- Submit student skill evaluations

### 5.3 University Supervisor

The university supervisor can:

- View assigned students
- Monitor internship progress
- Review company-verified reports
- Approve or reject reports
- View analytics
- Add supervisor feedback

### 5.4 Administrator

The administrator can:

- Manage users
- Manage internship assignments
- Create system notifications
- View system status
- Configure system-related settings

---

## 6. System Architecture

The system uses a modern web architecture with a React frontend and Firebase backend services.

```text
User Browser
    |
    v
React + TypeScript Frontend
    |
    |-- Firebase Client SDK
    |      |-- Firebase Authentication
    |      |-- Cloud Firestore
    |      |-- Firebase Storage
    |
    |-- REST API Calls
           |
           v
Firebase Cloud Functions + Express API
           |
           v
Firebase Admin SDK
           |
           v
Cloud Firestore / Firebase Auth
```

### Architecture Explanation

- The frontend is built with React, TypeScript, and Vite.
- Firebase Authentication handles secure login and registration.
- Firestore stores users, diary entries, reports, internships, evaluations, and notifications.
- Firebase Storage is available for file storage.
- Firebase Cloud Functions expose REST API endpoints.
- Firebase Hosting can deploy the frontend and route `/api/**` requests to Cloud Functions.

---

## 7. Technology Stack

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Recharts
- Lucide React icons
- CSS

### Backend

- Firebase Cloud Functions
- Express.js
- Firebase Admin SDK
- Firebase Authentication
- Cloud Firestore
- Firebase Storage

### AI Integration

- Gemini API for diary enhancement and weekly report generation

### Development Tools

- npm
- ESLint
- TypeScript compiler
- Firebase CLI

---

## 8. Main System Modules

### 8.1 Authentication Module

This module manages:

- Login
- Registration
- Logout
- Demo login
- Role-based access control

The system supports four roles: student, supervisor, company, and admin.

### 8.2 Student Diary Module

Students can create diary entries with:

- Date
- Title
- Description
- Tasks completed
- Hours worked
- Skills used
- AI-enhanced version

### 8.3 Weekly Report Module

Students can generate weekly reports from diary entries. Reports include:

- Week start date
- Week end date
- Summary
- Linked diary entries
- Report status
- Company feedback
- Supervisor feedback

Report statuses:

- `draft`
- `submitted`
- `company_verified`
- `supervisor_approved`
- `rejected`

### 8.4 Company Verification Module

Company supervisors can:

- View submitted reports
- Verify reports
- Add company feedback
- Notify university supervisors

### 8.5 Supervisor Review Module

University supervisors can:

- View company-verified reports
- Approve reports
- Reject reports
- Add supervisor feedback

### 8.6 Skill Evaluation Module

Company supervisors and university supervisors can evaluate students based on:

Technical skills:

- Programming
- Problem Solving
- Database Management
- Web Development
- Testing and QA
- Documentation

Soft skills:

- Communication
- Teamwork
- Time Management
- Adaptability
- Professionalism
- Initiative

### 8.7 Internship Management Module

Administrators can create and manage internship assignments with:

- Student
- Company
- Company supervisor
- University supervisor
- Start date
- End date
- Progress
- Status

### 8.8 Notification Module

The system creates notifications for:

- Report submissions
- Company verifications
- Supervisor approvals
- Skill evaluations
- Admin announcements

### 8.9 REST API Module

The REST API exposes backend operations through Firebase Cloud Functions. It uses Firebase ID tokens for authentication and role-based authorization.

---

## 9. Database Design

The system uses Cloud Firestore collections.

### 9.1 `users`

Stores user profile information.

Important fields:

- `uid`
- `email`
- `displayName`
- `role`
- `companyId`
- `companyName`
- `supervisorId`
- `department`
- `indexNumber`
- `phone`
- `createdAt`

### 9.2 `diaries`

Stores student daily diary entries.

Important fields:

- `id`
- `studentId`
- `date`
- `title`
- `content`
- `tasksCompleted`
- `hoursWorked`
- `skillsUsed`
- `aiEnhanced`
- `createdAt`

### 9.3 `reports`

Stores weekly reports.

Important fields:

- `id`
- `studentId`
- `studentName`
- `weekStart`
- `weekEnd`
- `summary`
- `diaryIds`
- `status`
- `companyFeedback`
- `supervisorFeedback`
- `generatedAt`
- `submittedAt`

### 9.4 `internships`

Stores internship assignment details.

Important fields:

- `id`
- `studentId`
- `studentName`
- `companyName`
- `companySupervisor`
- `universitySupervisorId`
- `startDate`
- `endDate`
- `status`
- `progress`

### 9.5 `evaluations`

Stores skill evaluation records.

Important fields:

- `id`
- `studentId`
- `weekReportId`
- `evaluatorId`
- `evaluatorRole`
- `technicalSkills`
- `softSkills`
- `comments`
- `createdAt`

### 9.6 `notifications`

Stores user notifications.

Important fields:

- `id`
- `userId`
- `title`
- `message`
- `type`
- `read`
- `createdAt`
- `link`

---

## 10. REST API Documentation

### Authentication

All protected endpoints require a Firebase ID token.

```http
Authorization: Bearer <firebase-id-token>
```

### Base URL

Local emulator example:

```text
http://127.0.0.1:5001/<project-id>/asia-south1/api
```

Firebase Hosting example:

```text
https://<project-id>.web.app/api
```

### Health Endpoint

```http
GET /api/health
```

Purpose: Check whether the API is running.

### Current User

```http
GET /api/me
```

Purpose: Return the authenticated user's profile.

### Users

```http
GET /api/users
POST /api/users
GET /api/users/:uid
PATCH /api/users/:uid
DELETE /api/users/:uid
```

Purpose: Manage user accounts and profiles.

### Diaries

```http
GET /api/diaries
GET /api/diaries?studentId=<uid>
POST /api/diaries
PATCH /api/diaries/:id
DELETE /api/diaries/:id
```

Purpose: Manage daily diary entries.

### Reports

```http
GET /api/reports
GET /api/reports?studentId=<uid>&status=<status>
POST /api/reports
PATCH /api/reports/:id
```

Purpose: Manage weekly internship reports and approval statuses.

### Internships

```http
GET /api/internships
GET /api/internships?studentId=<uid>
GET /api/internships?supervisorId=<uid>
POST /api/internships
PATCH /api/internships/:id
```

Purpose: Manage internship assignments.

### Evaluations

```http
GET /api/evaluations
GET /api/evaluations?studentId=<uid>
POST /api/evaluations
```

Purpose: Manage technical and soft skill evaluations.

### Notifications

```http
GET /api/notifications
GET /api/notifications?userId=<uid>
POST /api/notifications
PATCH /api/notifications/:id/read
```

Purpose: Manage user notifications.

---

## 11. Security Design

Security is handled at multiple layers.

### 11.1 Firebase Authentication

Firebase Auth is used for:

- User login
- User registration
- Firebase ID token generation
- Authenticated API access

### 11.2 Role-Based Access Control

The system uses roles to restrict access:

- Student can manage own diary and reports.
- Company supervisor can verify reports and create evaluations.
- University supervisor can review reports and monitor students.
- Admin can manage users, internships, and notifications.

### 11.3 Firestore Security Rules

Firestore rules protect direct database access from the frontend.

### 11.4 REST API Token Verification

The REST API verifies Firebase ID tokens using Firebase Admin SDK before allowing protected operations.

---

## 12. Main Workflow

### Internship Monitoring Workflow

1. Student logs in.
2. Student creates daily diary entries.
3. Student generates a weekly report.
4. Student submits the report.
5. Company supervisor verifies the report.
6. University supervisor reviews the verified report.
7. Supervisor approves or rejects the report.
8. Evaluations and notifications are stored in the system.
9. Admin monitors users and internship assignments.

### Report Status Workflow

```text
draft
  |
  v
submitted
  |
  v
company_verified
  |
  v
supervisor_approved
```

If the report is not accepted, it can be marked as:

```text
rejected
```

---

## 13. AI Features

The system includes optional Gemini API integration.

AI-supported features:

- Improve diary entry grammar and clarity.
- Convert diary content into professional writing.
- Generate weekly report summaries from diary entries.

If the Gemini API key is not configured, the system still works in demo mode and returns preview content.

---

## 14. Demo Mode

The application can run without Firebase credentials.

Demo mode uses:

- `localStorage`
- Demo student account
- Demo supervisor account
- Demo company account
- Demo admin account

This is useful for presentations because the system can be demonstrated without deploying Firebase first.

Demo login buttons are available on the login page when Firebase is not configured.

---

## 15. Setup Instructions

### 15.1 Frontend Setup

```bash
cd internship-monitor
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

### 15.2 Firebase Environment Setup

Copy `.env.example` to `.env`.

```bash
cp .env.example .env
```

Add Firebase and Gemini values:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_GEMINI_API_KEY=your-gemini-api-key
```

### 15.3 REST API Setup

```bash
cd functions
npm install
npm run build
```

### 15.4 Firebase Deployment

Deploy Firestore rules:

```bash
firebase deploy --only firestore:rules
```

Deploy backend API:

```bash
firebase deploy --only functions
```

Build and deploy frontend:

```bash
npm run build
firebase deploy --only hosting
```

---

## 16. Testing and Verification

The project was verified using:

```bash
npm run lint
npm run build
cd functions
npm run build
```

Verified results:

- Frontend TypeScript compilation passes.
- Frontend production build passes.
- ESLint passes.
- Firebase Functions backend TypeScript build passes.
- REST API source compiles successfully.

---

## 17. Presentation Demonstration Plan

### Step 1: Introduce Problem

Explain the manual internship monitoring problems:

- Paper diaries
- Delayed report verification
- Weak supervisor visibility
- No centralized feedback

### Step 2: Show Login Page

Demonstrate role-based access using quick demo login.

### Step 3: Student Demo

Show:

- Student dashboard
- Diary entry creation
- AI enhancement
- Weekly report generation
- Report submission

### Step 4: Company Supervisor Demo

Show:

- Company dashboard
- Report verification
- Company feedback
- Skill evaluation

### Step 5: University Supervisor Demo

Show:

- Assigned students
- Report review
- Approval/rejection
- Analytics

### Step 6: Admin Demo

Show:

- User management
- Internship management
- Notification creation
- System settings

### Step 7: Backend Explanation

Explain:

- Firebase Auth
- Firestore collections
- Firebase Cloud Functions REST API
- Role-based authorization

### Step 8: Conclusion

Summarize how the system improves internship monitoring.

---

## 18. Suggested Presentation Slides

### Slide 1: Title

Smart Internship Monitoring System  
Group 16 - Faculty of Technology, USJ

### Slide 2: Problem Background

Manual internship monitoring is slow, disconnected, and difficult to track.

### Slide 3: Objectives

Show the main project objectives.

### Slide 4: Users and Roles

Student, Company Supervisor, University Supervisor, Administrator.

### Slide 5: System Architecture

React frontend, Firebase backend, REST API, Firestore database.

### Slide 6: Main Features

Diary, weekly reports, verification, evaluations, analytics, notifications.

### Slide 7: Student Workflow

Diary entry to weekly report submission.

### Slide 8: Verification Workflow

Company verification and university supervisor approval.

### Slide 9: Database Design

Firestore collections and their purpose.

### Slide 10: REST API Backend

Explain Firebase Cloud Functions and API endpoints.

### Slide 11: Security

Firebase Auth, Firestore rules, role-based access control.

### Slide 12: Demonstration

Live demo screenshots or actual system demo.

### Slide 13: Testing

Build, lint, and backend compilation results.

### Slide 14: Future Enhancements

Mobile app, real-time chat, file uploads, advanced analytics.

### Slide 15: Conclusion

The system digitalizes and improves internship monitoring.

---

## 19. Viva Questions and Answers

### Q1: What is the main purpose of this system?

The main purpose is to digitalize internship monitoring by allowing students, companies, supervisors, and administrators to manage internship diaries, reports, evaluations, and progress in one platform.

### Q2: What technologies are used?

The frontend uses React, TypeScript, Vite, React Router, and Recharts. The backend uses Firebase Authentication, Firestore, Storage, Cloud Functions, Express, and Firebase Admin SDK.

### Q3: Why did you use Firebase?

Firebase provides authentication, database, storage, hosting, and serverless functions. It reduces backend development complexity and supports scalable cloud deployment.

### Q4: Is Firebase a microservice?

Firebase itself is a Backend-as-a-Service platform. In this project, Firebase Cloud Functions are used to create a REST API backend. The API behaves like a serverless backend service.

### Q5: How is security handled?

Security is handled through Firebase Authentication, Firestore security rules, Firebase ID token verification, and role-based access control in the REST API.

### Q6: What is the role of Gemini API?

Gemini API is used for AI-assisted diary enhancement and weekly report generation. It helps students write clearer and more professional internship records.

### Q7: Can the system work without Firebase?

Yes. The frontend has a demo mode using localStorage. This allows easy demonstration without Firebase credentials.

### Q8: What are the main database collections?

The main collections are users, diaries, reports, internships, evaluations, and notifications.

### Q9: What is the report approval workflow?

The report starts as a draft, then the student submits it. The company verifies it, and finally the university supervisor approves or rejects it.

### Q10: What future improvements can be added?

Future improvements include mobile app support, real-time chat, file upload for evidence, email notifications, advanced analytics, and calendar integration.

---

## 20. Future Enhancements

- Mobile application for Android and iOS
- Real-time chat between students and supervisors
- PDF export for final internship reports
- File upload for evidence and documents
- Email and SMS notifications
- Calendar-based internship schedule
- Advanced analytics dashboard
- Automated reminder system
- More advanced AI report analysis

---

## 21. Conclusion

The Smart Internship Monitoring System provides a complete digital solution for managing university internships. It improves communication between students, company supervisors, university supervisors, and administrators.

The system reduces manual work, improves transparency, centralizes records, and provides better progress monitoring. With Firebase backend services and a REST API layer, the project is scalable, secure, and suitable for real deployment.

