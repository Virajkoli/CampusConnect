import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect } from "react";
import { ToastContainer } from "react-toastify";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import TeacherRoute from "./components/TeacherRoute";
import SocketProvider from "./context/SocketContext";

import Home from "./pages/Home";
import About from "./pages/About";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Announcements from "./pages/Announcements";
import ChangePassword from "./pages/ChangePassword";
import Discussions from "./pages/Discussions";
import Chat from "./pages/Chats";
import AuthPage from "./components/AuthPage";
import ResetPassword from "./pages/ResetPassword";
import ResetConfirm from "./pages/ResetConfirm";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAuthPage from "./pages/AdminAuthPage";
import StudentAuthPage from "./pages/StudentAuthPage";
import UserManagement from "./pages/UserManagement";
import TeacherAuthPage from "./pages/TeacherAuthPage";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherManagement from "./pages/TeacherManagement";
import TeacherCourses from "./pages/TeacherCourses";
import AnnouncementManagement from "./pages/AnnouncementManagement";
import StudyMaterials from "./pages/StudyMaterials";
import EventsCalendar from "./pages/EventsCalendar";
import AttendanceTracker from "./pages/AttendanceTracker";
import AdminSettings from "./pages/AdminSettings";
import TeacherStudyMaterial from "./pages/TeacherStudyMaterial";
import TeacherTimetable from "./pages/TeacherTimetable";
import StudentTimetable from "./pages/StudentTimetable";
import ExamTimetable from "./pages/ExamTimetable";
import ExamTimetableManagement from "./pages/ExamTimetableManagement";
import Calendars from "./pages/Calendars";
import AcademicCalendar from "./pages/AcademicCalendar";

// Component to control when to show navbar
function AppContent() {
  return (
    <>
      <Navbar />
      <div className="pt-16 px-4" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />

        {/* Authentication */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />
        <Route path="/auth/student" element={<StudentAuthPage />} />
        <Route path="/auth/admin" element={<AdminAuthPage />} />
        <Route path="/auth/teacher" element={<TeacherAuthPage />} />

        {/* Password Reset */}
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset-password-confirm" element={<ResetConfirm />} />

        {/* Protected Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-profile"
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />
        <Route
          path="/announcements"
          element={
            <ProtectedRoute>
              <Announcements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/discussions"
          element={
            <ProtectedRoute>
              <Discussions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:teacherId"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/study-materials"
          element={
            <ProtectedRoute>
              <StudyMaterials />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendars"
          element={
            <ProtectedRoute>
              <Calendars />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events-calendar"
          element={
            <ProtectedRoute>
              <EventsCalendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/academic-calendar"
          element={
            <ProtectedRoute>
              <AcademicCalendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance-tracker"
          element={
            <ProtectedRoute>
              <AttendanceTracker />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin-dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/usermanagement"
          element={
            <AdminRoute>
              <UserManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/teachermanagement"
          element={
            <AdminRoute>
              <TeacherManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/announcements"
          element={
            <AdminRoute>
              <AnnouncementManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminRoute>
              <AdminSettings />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/exam-timetable"
          element={
            <AdminRoute>
              <ExamTimetableManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/admin-addteacher"
          element={
            <AdminRoute>
              <TeacherManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminRoute>
              <AdminSettings />
            </AdminRoute>
          }
        />

        {/* Teacher Routes */}
        <Route
          path="/teacher-dashboard"
          element={
            <TeacherRoute>
              <TeacherDashboard />
            </TeacherRoute>
          }
        />
        <Route
          path="/teacher-courses"
          element={
            <TeacherRoute>
              <TeacherCourses />
            </TeacherRoute>
          }
        />
        <Route
          path="/teacher-studymaterial"
          element={
            <TeacherRoute>
              <TeacherStudyMaterial />
            </TeacherRoute>
          }
        />
        <Route
          path="/exam-timetable"
          element={
            <ProtectedRoute>
              <ExamTimetable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher-timetable"
          element={
            <TeacherRoute>
              <TeacherTimetable />
            </TeacherRoute>
          }
        />
        <Route
          path="/student-timetable"
          element={
            <ProtectedRoute>
              <StudentTimetable />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

function FirebaseRedirectHandler() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");
    const oobCode = params.get("oobCode");

    if (mode === "resetPassword" && oobCode) {
      navigate(`/reset-password-confirm?oobCode=${oobCode}`);
    }
  }, [location, navigate]);

  return null;
}

function App() {
  return (
    <Router future={{ v7_startTransition: true }}>
      <SocketProvider>
        <AppContent />
        <FirebaseRedirectHandler />
        {/* Toast notifications from react-toastify */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </SocketProvider>
    </Router>
  );
}

export default App;
