# CampusConnect 🚀

A platform to connect students, faculty, and campus communities.

## 🌟 Core Features (MVP)

- User Authentication (Firebase)
- Campus Feed (Posts, Comments)
- Events & Announcements
- Chat System (Real-time)
- Lost & Found Section

## 👤 User Roles

1. **Student**: Can post, comment, join events, and chat.
2. **Faculty**: Can make announcements, manage events, and chat.
3. **Admin**: Can manage users and moderate content.

## 🛠️ Tech Stack

- **Frontend**: React.js (Vite) + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: Firebase Firestore / PostgreSQL
- **Real-time**: Socket.io (for chat & notifications)

## 🚦 Running the Application

To avoid authentication issues, both the backend and frontend need to be running. Use the provided scripts:

### On Windows

Double-click the `start-app.bat` file to start both frontend and backend servers.

### On Linux/Mac/Git Bash

Use the bash script:

```bash
chmod +x start-app.sh
./start-app.sh
```

## ⚠️ Common Issues and Solutions

### Teacher Login Issues

If you see "auth/invalid-credential" errors when logging in as a teacher:

1. **Make sure backend is running**
   The backend server needs to be running to verify teacher roles. Check if it's running at http://localhost:5000.

2. **Role Assignment**
   Teacher accounts need special role claims. These are set by the backend server when:

   - A teacher account is created through TeacherAuthPage registration
   - An admin adds a teacher through the TeacherManagement page

3. **Manual Fix for Existing Accounts**
   If you created a teacher account but didn't have the backend running:
   - Start the backend server
   - Try logging in again - the application should attempt to assign the teacher role

### Error: "You are not authorized as a teacher"

This means your Firebase user exists but doesn't have the teacher role set in custom claims. The latest version of the app will try to set the role automatically during login if the backend is running.
