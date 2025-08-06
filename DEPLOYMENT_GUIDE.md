# CampusConnect Deployment Guide

## Environment Variables Setup

### Frontend (.env)

```env
# For Development
VITE_API_URL=http://localhost:5000
VITE_FRONTEND_URL=http://localhost:5173

# For Production (update these values)
VITE_API_URL=https://your-backend-app.onrender.com
VITE_FRONTEND_URL=https://your-frontend-app.vercel.app
```

### Backend (.env)

```env
# For Development
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
FIREBASE_ADMIN_SDK_KEY=./service-account-key.json
EMAIL_USERNAME=your-gmail@gmail.com
EMAIL_PASSWORD=your-app-password

# For Production
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-app.vercel.app
EMAIL_USERNAME=your-gmail@gmail.com
EMAIL_PASSWORD=your-app-password
# See Firebase section below for FIREBASE_SERVICE_ACCOUNT_JSON
```

## Firebase Service Account Key for Production (Render)

You have **2 options** for handling the Firebase service account key on Render:

### Option 1: Environment Variable (Recommended)

1. Copy the entire contents of your `service-account-key.json` file
2. In Render dashboard, add environment variable:

   - **Key**: `FIREBASE_SERVICE_ACCOUNT_JSON`
   - **Value**: Paste the entire JSON content (minified, single line)

   Example:

   ```json
   {
     "type": "service_account",
     "project_id": "campus-connect-9e92e",
     "private_key_id": "abc123",
     "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQ...",
     "client_email": "firebase-adminsdk-xyz@campus-connect-9e92e.iam.gserviceaccount.com",
     "client_id": "123456789",
     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     "token_uri": "https://oauth2.googleapis.com/token"
   }
   ```

### Option 2: Upload File (Alternative)

1. Upload `service-account-key.json` to your Render service
2. Set environment variable:
   - **Key**: `FIREBASE_ADMIN_SDK_KEY`
   - **Value**: `./service-account-key.json`

**⚠️ Security Note:** Never commit `service-account-key.json` to your Git repository. It's already in `.gitignore`.

## Deployment Steps

### 1. Frontend Deployment (Vercel)

1. Update `.env` file with production URLs
2. Deploy to Vercel:
   ```bash
   cd frontend
   vercel
   ```
3. Set environment variables in Vercel dashboard:
   - `VITE_API_URL=https://your-backend-app.onrender.com`
   - `VITE_FRONTEND_URL=https://your-frontend-app.vercel.app`

### 2. Backend Deployment (Render)

1. Create new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && npm start`
5. Add environment variables in Render dashboard:
   ```env
   PORT=5000
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-app.vercel.app
   FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
   EMAIL_USERNAME=your-gmail@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```

### 3. Firebase Configuration

1. Add your production domains to Firebase Console:
   - Authentication > Settings > Authorized domains
   - Add your Vercel domain: `your-frontend-app.vercel.app`
2. Update Firestore security rules for production
3. Update Firebase Storage CORS settings if using file uploads

## Updated Files Summary

### Frontend:

✅ `src/api.js` - Main API configuration
✅ `src/pages/UserManagement.jsx` - User creation and deletion APIs
✅ `src/pages/TeacherManagement.jsx` - Teacher creation API
✅ `src/pages/TeacherAuthPage.jsx` - Teacher role setting API
✅ `src/pages/ResetPassword.jsx` - Password reset redirect URL
✅ `src/context/SocketContext.jsx` - Socket.IO connection URL

### Backend:

✅ `server.js` - CORS configuration using FRONTEND_URL
✅ `firebase-admin.js` - Firebase service account configuration
✅ `.env` - Environment variables configuration

All URLs now use environment variables with localhost fallbacks for development.
