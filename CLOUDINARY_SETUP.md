# Cloudinary Setup Guide for CampusConnect

## Why Cloudinary?

Since Firebase Storage requires a paid plan, we're using Cloudinary which offers a generous free tier (10GB storage, 25GB bandwidth/month).

## Setup Steps

### 1. Create a Cloudinary Account

1. Go to [https://cloudinary.com/](https://cloudinary.com/)
2. Sign up for a free account
3. After signup, you'll be taken to the dashboard

### 2. Get Your Credentials

On your Cloudinary dashboard, you'll see:

- **Cloud Name**: (e.g., `dxxxxxxxx`)
- **API Key**: (e.g., `123456789012345`)
- **API Secret**: (e.g., `abcdefghijklmnopqrstuvwxyz`)

### 3. Configure Backend Environment Variables

Add these to your `backend/.env` file:

```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Install Required Packages

In the backend directory:

```bash
cd backend
npm install cloudinary multer
```

### 5. Install Axios in Frontend (if not already installed)

In the frontend directory:

```bash
cd frontend
npm install axios
```

### 6. Test the Upload

1. Start the backend server:

   ```bash
   cd backend
   npm start
   ```

2. Start the frontend:

   ```bash
   cd frontend
   npm run dev
   ```

3. Login as a teacher
4. Navigate to Teacher Dashboard → Study Materials
5. Upload a PDF file
6. Check your Cloudinary dashboard to see the uploaded file

## How It Works

1. **Teacher uploads file** → Frontend sends file to backend API endpoint
2. **Backend receives file** → Authenticates user with Firebase token
3. **Backend uploads to Cloudinary** → Returns secure URL and file info
4. **Frontend saves to Firestore** → Stores file metadata with Cloudinary URL
5. **Students can download** → Direct download from Cloudinary CDN

## File Structure in Cloudinary

Files are stored in: `campus-connect/materials/`

Example: `campus-connect/materials/1730000000000-Data_Structures_Complete`

## Security

- Upload endpoint requires Firebase authentication
- Only authenticated users can upload files
- Optional: Enable teacher-only uploads (uncomment the teacher claim check in server.js)
- Files are publicly accessible for downloads (students don't need authentication to view)

## Cloudinary Features You Can Use

- **Automatic format optimization**: Cloudinary converts files for better performance
- **CDN delivery**: Fast downloads worldwide
- **Transformations**: Can generate thumbnails for images
- **Analytics**: Track download stats in Cloudinary dashboard

## Troubleshooting

### "No authorization token provided"

- Make sure you're logged in
- Check that the Authorization header is being sent

### "Failed to upload file"

- Verify Cloudinary credentials in .env
- Check file size (10MB limit currently set)
- Ensure allowed file types match your needs

### CORS errors

- Make sure FRONTEND_URL is set correctly in backend/.env
- Restart the backend server after .env changes

## Production Deployment

### Render (Backend)

Add environment variables in Render dashboard:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Vercel (Frontend)

No Cloudinary config needed on frontend - it uses the backend API!

## Free Tier Limits

- **Storage**: 10GB
- **Bandwidth**: 25GB/month
- **Transformations**: 25,000/month
- **API calls**: Unlimited

This should be enough for a campus-level application with moderate usage!
