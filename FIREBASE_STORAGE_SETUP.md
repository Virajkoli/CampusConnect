## Firebase Storage Security Rules for CampusConnect

### Current Issue

The upload is failing due to Firebase Storage security rules. You need to configure the storage rules in your Firebase Console.

### How to Fix:

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: campus-connect-9e92e
3. **Navigate to Storage** in the left sidebar
4. **Click on "Rules" tab**
5. **Replace the existing rules** with the following:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload to materials folder
    match /materials/{fileName} {
      allow read: if true; // Anyone can read/download materials
      allow write: if request.auth != null &&
                   request.auth.token.teacher == true; // Only teachers can upload
    }

    // Fallback rule for other paths
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Alternative Simple Rules (for testing)

If you want to allow all authenticated users to upload (for testing purposes):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### After updating rules:

1. Click "Publish" to save the rules
2. Wait a few minutes for the rules to propagate
3. Try uploading a file again

### Common Issues:

- **Authentication required**: User must be logged in with Firebase Auth
- **Custom claims**: If using teacher-only uploads, ensure teachers have the `teacher` custom claim
- **File size limits**: Firebase Storage has size limits (default 32MB for web)
- **CORS**: The rules above should resolve CORS issues

### Testing the Upload:

1. Make sure you're logged in as a teacher
2. Navigate to Teacher Dashboard > Study Materials
3. Fill out the form and select a PDF file
4. Click "Upload Material"
5. You should see upload progress and success message
