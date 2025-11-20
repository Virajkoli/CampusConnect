# Exam Timetable Feature

## Overview

The Exam Timetable feature provides a centralized, beautiful interface for viewing and managing examination schedules across all branches (Civil, Computer, Electrical, E&TC, Instrumentation, Mechanical).

## Features

### For Students & Teachers

- **View Exam Schedule**: Beautiful, organized display of all exams grouped by date
- **Filter by Branch**: Quick filter to view exams for specific branches
- **Exam Details**: Each exam shows:
  - Course Code
  - Course Name
  - Branch
  - Date and Time (11:00 AM - 2:00 PM)
  - Duration (3 hours)
- **Important Instructions**: Built-in exam guidelines and instructions
- **Responsive Design**: Works perfectly on all devices

### For Admins

- **Full CRUD Operations**: Create, Read, Update, and Delete exam entries
- **Quick Statistics**: View exam count per branch at a glance
- **Batch Management**: Edit multiple exams efficiently
- **User-Friendly Interface**: Intuitive modal dialogs for adding/editing
- **Real-time Updates**: Changes reflect immediately across all users

## File Structure

```
frontend/src/pages/
├── ExamTimetable.jsx          # Student/Teacher view
├── AdminExamTimetable.jsx     # Admin management view

backend/
├── populateExamData.js        # Script to populate initial data
```

## Routes

- `/exam-timetable` - Student and Teacher view (Protected)
- `/admin/exam-timetable` - Admin management view (Admin only)

## Navigation Links Added

### Student Dashboard

- Added "📝 Exam Schedule" button in Quick Actions with highlighted orange styling

### Teacher Dashboard

- Added "Exam Schedule" link in sidebar navigation

### Admin Dashboard

- Added "Exam Timetable" link in sidebar under Settings section

## Data Structure

### Firestore Collection: `examTimetable`

```javascript
{
  date: "Friday, 05-12-2025",      // Full date with day name
  branch: "Computer",              // Branch name
  courseCode: "CO405UX",           // Course code
  courseName: "Software Metrics"   // Full course name
}
```

## Setup Instructions

### 1. Populate Initial Data

You have two options to populate the exam data:

#### Option A: Browser Console (Recommended for quick setup)

1. Open your CampusConnect app in browser
2. Make sure you're logged in as admin
3. Open browser console (F12)
4. Copy and paste the content from `backend/populateExamData.js`
5. Run: `populateExamTimetable()`

#### Option B: Node.js Script (For production)

1. Navigate to backend folder:

   ```bash
   cd backend
   ```

2. Install Firebase Admin SDK if not already installed:

   ```bash
   npm install firebase-admin
   ```

3. Update the script with your service account path

4. Run the script:
   ```bash
   node populateExamData.js
   ```

### 2. Firestore Security Rules

Add these rules to your `firestore.rules`:

```javascript
match /examTimetable/{examId} {
  // Everyone can read
  allow read: if request.auth != null;

  // Only admins can write
  allow write: if request.auth != null &&
    request.auth.token.admin == true;
}
```

### 3. Test the Feature

1. **As Student**:

   - Login → Dashboard → Click "Exam Schedule"
   - Test branch filtering
   - Verify all exam details display correctly

2. **As Teacher**:

   - Login → Dashboard → Click "Exam Schedule" from sidebar
   - Verify you can view all exams

3. **As Admin**:
   - Login → Admin Dashboard → Click "Exam Timetable"
   - Test adding a new exam
   - Test editing an exam
   - Test deleting an exam
   - Verify statistics update correctly

## Exam Data Included

The provided data includes **45 exam entries** across:

- 6 examination dates
- 6 branches
- December 2025 schedule

### Dates:

- Friday, 05-12-2025
- Monday, 08-12-2025
- Wednesday, 10-12-2025
- Friday, 12-12-2025
- Tuesday, 16-12-2025
- Thursday, 18-12-2025

## Customization

### Adding New Branches

1. Update the `branches` array in both components:

```javascript
const branches = [
  "Civil",
  "Computer",
  "Electrical",
  "E&TC",
  "Instrumentation",
  "Mechanical",
  "YourNewBranch",
];
```

### Changing Exam Time

Update the time display in both components:

```javascript
<p className="text-sm text-white/80">11:00am - 2:00pm</p>
```

### Custom Styling

All components use Tailwind CSS with:

- Gradient backgrounds (blue → purple → pink)
- Framer Motion animations
- Responsive design
- Beautiful cards and hover effects

## Troubleshooting

### Exams Not Showing

1. Check Firestore collection exists: `examTimetable`
2. Verify data is populated correctly
3. Check browser console for errors
4. Verify user is authenticated

### Filter Not Working

1. Ensure `branch` field in Firestore matches exactly (case-sensitive)
2. Check browser console for JavaScript errors

### Admin Can't Add/Edit

1. Verify admin custom claim is set
2. Check Firestore security rules
3. Verify Firebase Admin SDK is properly configured

## Future Enhancements

- [ ] Export to PDF
- [ ] Export to iCal/Google Calendar
- [ ] Email notifications before exams
- [ ] Push notifications
- [ ] Student-specific timetable (by enrolled courses)
- [ ] Exam hall seating arrangement
- [ ] Admit card generation
- [ ] Results integration

## Support

For issues or questions:

1. Check browser console for errors
2. Verify Firestore connection
3. Check Firebase Admin SDK configuration
4. Review security rules

## License

Part of the CampusConnect project.
