# Smart Internship Monitoring System

Web-based platform for internship tracking, reporting, evaluation, and progress monitoring, developed for the **IIC 3341 ICT Project** Module, Department of Information and Communication Technology, Faculty of Technology, University of Sri Jayewardenepura.

## Team

**Group 16** - Department of Information and Communication Technology, Faculty of Technology, University of Sri Jayewardenepura

## Team Contributions

**Group 16** - Department of Information and Communication Technology, Faculty of Technology, University of Sri Jayewardenepura

The project was collaboratively developed by all five team members, with responsibilities distributed across development, design, testing, documentation, presentation, and project management.

| Team Member  | Areas of Contribution                                                      |
| ------------ | -------------------------------------------------------------------------- |
| **Member 1** | Firebase integration and database management; GitHub repository management |
| **Member 2** | Frontend integration; testing and documentation                            |
| **Member 3** | UI/UX design; backend/API development; project presentation                |
| **Member 4** | UI/UX design; backend/API development; project presentation                |
| **Member 5** | Frontend integration; testing and documentation                            |

> Contributions to the project included development, system integration, database and backend work, UI/UX design, testing, documentation, presentation preparation, and repository management. The team worked collaboratively throughout the development process.


## Features

* **Role-based access** - Student, University Supervisor, Company, Administrator
* **Daily diary management** - Digital internship diary with optional AI enhancement
* **Weekly report generation** - Auto-generated from diary entries with verification workflow
* **Skill evaluation** - Technical and soft skill ratings by company supervisors
* **Analytics dashboards** - Progress tracking, hours logged, skill charts
* **Notification system** - Automated alerts for submissions, verifications, and deadlines
* **Final report export** - Download compiled internship report

## Tech Stack

* React 19 + TypeScript + Vite
* Firebase Auth, Firestore, Storage, and Hosting
* Gemini API for AI assistance
* Recharts for analytics

## Quick Start

The app runs in demo mode without Firebase credentials. Demo data is stored in `localStorage`.

cd ICT-MINI-PROJECT
npm install
npm run dev

Open `http://localhost:5173` and use the **Quick demo login** buttons for any role.

## Workflow

1. **Student** submits daily diary entries, optionally AI-enhanced.
2. **Student** generates and submits weekly reports.
3. **Company** verifies reports and submits skill evaluations.
4. **Supervisor** reviews and approves verified reports.
5. **Admin** manages users, internships, and system notifications.


