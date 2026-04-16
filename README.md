# CampusConnect

Live Application: https://campus-connect-ten-theta.vercel.app/

CampusConnect is a role-based campus operations platform for Students, Teachers, and Admins.  
It combines attendance automation, academic operations, communication, timetable management, and issue reporting in one system.

## What Is Implemented Right Now

The current project is beyond MVP. It includes:

- Role-based authentication and route protection (Student, Teacher, Admin)
- Password reset with OTP verification flow
- Real-time chat with file/voice/video attachments and reply threads
- Announcements system with read tracking and notification surfaces
- Attendance system with:
  - Timetable-linked sessions
  - Fingerprint/WebAuthn verification
  - Face registration + face attendance with challenge validation
  - Teacher QR scan fallback
  - Live session room, joined-student snapshots, and map heat points
  - Session history, analytics, CSV/PDF export
- Timetable management with overlap validation
- Study material upload and filtering by branch/subject
- Events calendar and academic calendar
- Exam timetable pipeline with OCR + optional Gemini-assisted parsing
- Year-wise official exam timetable PDF management
- Bulk student onboarding and bulk academic updates
- FixIt board for campus issue reporting and resolution workflow
- Exam reminder announcement scheduler/trigger APIs

## Role-Wise Features

### Student

- Login via Student portal
- Dashboard tabs: overview, announcements, FixIt, study materials, calendars, attendance, exam schedule, full timetable
- Join active attendance sessions in real time
- Attendance marking methods:
  - Fingerprint/passkey (WebAuthn)
  - Face verification (after one-time face registration)
  - Teacher QR scan fallback (teacher-side)
- Student QR profile generation for fallback attendance scan
- Subject-wise attendance summary and percentages
- Timetable view (branch/year/semester aware)
- Exam schedule + official year-wise PDF links
- Discussions and direct chat with teachers

### Teacher

- Login using Teacher Login ID or email
- Teacher claim validation before dashboard access
- Dashboard with tabs for announcements, students, courses, attendance, timetable, study materials, chats, calendars, exams, FixIt
- Attendance operations:
  - Start session from timetable lecture and selected date
  - Attendance time-slot control (1, 2, 3, 4, 5, 10 minutes)
  - Optional per-session distance enforcement
  - Live records, live joined student list, and classroom map heat points
  - Teacher QR scanner with manual fallback input
  - End session with attendance rollups
  - Past session history with CSV/PDF export
  - Subject analytics (trend + at-risk students)
  - Delete ended sessions (with rollup correction)
- Timetable slot creation with overlap/conflict protection
- Study material upload for assigned branch/subject combinations
- Student roster views and export utilities
- FixIt issue resolution permissions

### Admin

- Secure admin login with claim checks
- Admin dashboard (users, teachers, announcements, exams, utilities)
- Student user management (create/edit/delete)
- Teacher management:
  - Job-profile based teacher IDs
  - Assignment of branch/year/subjects
  - Login credentials generation and mail delivery
- Subject Set Management:
  - Branch-Year-Semester subject matrix
  - Central source for onboarding, assignment, and timetable consistency
- Bulk Student Onboarding:
  - Upload CSV/PDF/Image
  - OCR parsing
  - Duplicate precheck
  - Create or update flow for existing entries
  - Summary and manual credential fallback output
- Bulk Academic Update:
  - Batch update branch/year/semester
  - Auto subject reassignment from subject sets
- Announcement Management:
  - Create/edit/delete
  - Active/inactive state
  - Read-count and read-user visibility
- Exam Timetable Management:
  - OCR parse upload (PDF/image)
  - Optional Gemini-assisted structuring
  - Manual row edit/save
  - Duplicate removal
  - Replace-existing year flow (deactivate previous rows)
  - Year-wise official PDF upload
- Academic Calendar Management:
  - Manual event CRUD
  - OCR parse for activity table + holiday table
  - Optional Gemini-assisted structuring
  - Official academic calendar PDF upload
- System Setting:
  - Default attendance distance enforcement toggle
- Notification Trigger:
  - Admin trigger endpoint for exam reminder announcements

### Common (All Authenticated Users)

- Profile and basic account routes
- Announcements banner + notifications modal
- Real-time chat (Socket.IO):
  - Message send/receive
  - Typing indicators
  - Attachments (image, docs, audio, video, voice)
  - Reply-to-message metadata
  - Theme preferences
- Study material browsing (with search/filter)
- Events calendar and academic calendar viewing
- Exam timetable viewing
- FixIt complaint posting and upvoting

## How Core Workflows Operate

### 1) Authentication and Role Access

1. User logs in via role-specific auth page.
2. Firebase ID token is issued.
3. Route guards validate claims:
   - Student: authenticated user route
   - Teacher: teacher claim required
   - Admin: admin claim required

### 2) Password Reset (OTP)

1. User enters login ID/email.
2. Backend resolves identity and sends OTP to registered personal email.
3. User verifies OTP.
4. Backend issues short-lived reset token.
5. User sets new password.
6. Confirmation email is sent.

### 3) Attendance Lifecycle

1. Teacher starts attendance from a timetable lecture.
2. Session becomes active and is broadcast in real time.
3. Eligible students join session room.
4. Student marks attendance via biometric or face verification.
5. Teacher can mark via QR scan fallback.
6. Teacher ends session.
7. Rollups update subject/student attendance statistics.
8. Analytics and history become available for export and review.

### 4) Exam Timetable Pipeline

1. Admin uploads exam timetable source (PDF/image).
2. Backend extracts text (OCR/pdf parsing).
3. Optional Gemini-assisted structure is attempted first.
4. Fallback parser handles failures.
5. Admin reviews parsed rows and saves year-wise records.
6. Official year PDF can be uploaded and activated.
7. Student/teacher pages show active rows and current active PDF.

### 5) Academic Calendar Pipeline

1. Admin uploads source file.
2. Backend parses main activities and holidays separately.
3. Optional Gemini structuring can assist extraction.
4. Admin reviews and publishes entries.
5. Official academic calendar PDF can be uploaded and activated.

### 6) FixIt Board

1. User posts issue with description, location, optional image/video.
2. Community upvotes prioritize issues.
3. Teacher/Admin marks issues resolved.
4. Open/resolved lists update in real time.

## Tech Stack

- Frontend: React (Vite), Tailwind CSS, Framer Motion, Recharts, Leaflet
- Backend: Node.js, Express, Socket.IO, Multer
- Data/Auth: Firebase Auth + Firestore + Firebase Admin SDK
- Media Storage: Cloudinary
- OCR/Parsing: pdf-parse, tesseract.js, optional Gemini API integration
- Face/Biometric Support:
  - face-api.js + TensorFlow.js (frontend)
  - WebAuthn (browser passkeys)

## Realtime and Storage Highlights

- Socket channels support:
  - Chat rooms
  - Attendance session room joins/leaves
  - Attendance record and session status broadcasts
- Firestore collections include (non-exhaustive):
  - users, students, teachers, admins
  - announcements, messages, chats
  - timetables
  - attendance_sessions, attendance_records, student_attendance, subject_attendance_stats
  - student_faces, student_devices, attendance_face_challenges
  - subjectSets
  - studyMaterials
  - examTimetable, exam_timetable_files
  - academicCalendar, academic_calendar_files
  - fixitComplaints

## API Surface (Major Groups)

- Auth and role support:
  - /verify-admin
  - /api/resolve-teacher-login/:loginId
  - /api/auth/password-otp/request
  - /api/auth/password-otp/verify
  - /api/auth/password-otp/reset
- User/teacher/admin management:
  - /api/createUser
  - /api/createTeacher
  - /api/teachers/:uid
  - /api/admin/subject-sets (GET/PUT)
  - /api/admin/precheck-student-onboarding
  - /api/admin/bulk-onboard-students
  - /api/admin/bulk-update-student-academics
- Attendance:
  - /attendance/start, /attendance/end
  - /attendance/sessions/active
  - /attendance/mark, /attendance/mark-face, /attendance/mark-by-teacher
  - /attendance/session/:sessionId/records
  - /attendance/teacher/sessions/history
  - /attendance/analytics/:subjectId
  - /attendance/settings (GET/PUT)
- Timetable:
  - /timetable/add-lecture
  - /timetable/teacher/:teacherId
  - /timetable/:branch/:year/:semester
- Upload/OCR:
  - /api/upload-profile
  - /api/upload-material
  - /api/upload-chat-attachment
  - /api/upload-fixit-media
  - /api/upload-exam-timetable
  - /api/upload-exam-timetable-pdf
  - /api/admin/parse-academic-calendar
  - /api/admin/upload-academic-calendar-pdf

## Project Structure

```text
CampusConnect/
   backend/
      server.js
      firebase-admin.js
      cloudinary-config.js
      setAdminClaim.js
      setTeacherClaim.js
      resetAdminPassword.js
      populateExamData.js
      .env.example
   frontend/
      src/
         App.jsx
         firebase.js
         context/SocketContext.jsx
         pages/
            student/
            teacher/
            admin/
            common/
         components/
            student/
            teacher/
            admin/
            common/
         services/attendanceService.js
         utils/
   package.json
   README.md
```

## Local Setup

### Prerequisites

- Node.js 18+
- npm
- Firebase project (Auth + Firestore)
- Cloudinary account
- Gmail app password (for credential/OTP emails)

### 1) Install Dependencies

```bash
# root
npm install

# backend
cd backend
npm install

# frontend
cd ../frontend
npm install
```

### 2) Configure Environment Variables

Create backend .env using backend/.env.example and set your real values.

Required backend variables:

- PORT
- NODE_ENV
- FRONTEND_URL
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- EMAIL_USERNAME
- EMAIL_PASSWORD

Firebase admin credentials (choose one strategy):

- FIREBASE_ADMIN_SDK_KEY (path to service account file)
- FIREBASE_SERVICE_ACCOUNT_JSON (recommended for cloud deploy)
- FIREBASE_SERVICE_ACCOUNT_BASE64

Optional backend variables:

- ATTENDANCE_DISTANCE_ENFORCEMENT
- PASSWORD_RESET_OTP_SECRET
- GEMINI_API_KEY
- GEMINI_MODEL
- GEMINI_EXAM_MODEL
- ENABLE_EXAM_REMINDER_NOTIFICATIONS
- EXAM_REMINDER_INTERVAL_MS

Frontend environment:

- VITE_API_URL (example: http://localhost:5000)
- VITE_GEMINI_API_KEY (optional, for admin parsing UI)

Important: frontend Firebase web config is currently set in frontend/src/firebase.js. Replace with your own project config when self-hosting.

### 3) Run the App

Option A (recommended): from project root

```bash
npm run start
```

Option B (two terminals)

```bash
# terminal 1
cd backend
npm run dev

# terminal 2
cd frontend
npm run dev
```

Default local URLs:

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Available Scripts

Root:

- npm run start (backend + frontend together)
- npm run server
- npm run client

Backend:

- npm start
- npm run dev

Frontend:

- npm run dev
- npm run build
- npm run lint
- npm run preview

## Utility Admin Scripts (Backend Folder)

These helper scripts exist for setup and recovery tasks:

- setAdminClaim.js
- setTeacherClaim.js
- resetAdminPassword.js
- populateExamData.js
- create-env-json.js / render-env-json.js / render-fix.js / minify-service-account.js

Note: some helper scripts contain hardcoded example emails/passwords. Review and edit before running in any real environment.

## Troubleshooting

### Teacher login fails or "not authorized as teacher"

- Ensure backend is running.
- Ensure teacher claim is set.
- Ensure teacher account exists in teachers collection.
- Teacher login supports Login ID via backend resolver endpoint.

### Password reset OTP not received

- Verify EMAIL_USERNAME and EMAIL_PASSWORD in backend .env.
- Check spam/junk folder.
- Ensure login ID maps to a user with a registered personal email.

### Attendance location/biometric issues

- Use HTTPS/secure context for strongest biometric and geolocation support.
- Verify browser permissions for location/camera.
- Ensure trusted device registration is completed.

### Upload errors

- Global upload limit is 10MB.
- Verify Cloudinary credentials.
- Check supported MIME types for each upload route.

### README old startup scripts

Legacy references to start-app.bat/start-app.sh were removed because those files are not in this repository. Use npm commands above.

## Deployment Notes

- Frontend can be deployed on Vercel (frontend/vercel.json is present).
- Backend can be deployed on Render or similar Node hosts.
- Set FRONTEND_URL on backend for proper CORS.
- Use FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_BASE64 for production-safe secrets handling.

## Current Limitations / Future Work

- No automated test suite is currently wired in root/backend/frontend scripts.
- Some legacy UI modules still include fallback/mock data paths for resilience.
- Certain utility scripts are development-oriented and should be hardened for production workflows.
