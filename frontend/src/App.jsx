import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect } from "react";
import { ToastContainer } from "react-toastify";

import Navbar from "./components/common/Navbar";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AdminRoute from "./components/admin/AdminRoute";
import TeacherRoute from "./components/teacher/TeacherRoute";
import SocketProvider from "./context/SocketContext";

import Home from "./pages/common/Home";
import About from "./pages/common/About";
import Profile from "./pages/common/Profile";
import EditProfile from "./pages/common/EditProfile";
import Announcements from "./pages/common/Announcements";
import ChangePassword from "./pages/common/ChangePassword";
import Discussions from "./pages/common/Discussions";
import Chat from "./pages/common/Chats";
import AuthPage from "./components/common/AuthPage";
import ResetPassword from "./pages/common/ResetPassword";
import ResetConfirm from "./pages/common/ResetConfirm";
import StudentDashboard from "./pages/student/StudentDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAuthPage from "./pages/admin/AdminAuthPage";
import StudentAuthPage from "./pages/student/StudentAuthPage";
import UserManagement from "./pages/admin/UserManagement";
import TeacherAuthPage from "./pages/teacher/TeacherAuthPage";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherManagement from "./pages/admin/TeacherManagement";
import TeacherCourses from "./pages/teacher/TeacherCourses";
import AnnouncementManagement from "./pages/admin/AnnouncementManagement";
import StudyMaterials from "./pages/common/StudyMaterials";
import EventsCalendar from "./pages/common/EventsCalendar";
import AttendanceTracker from "./pages/common/AttendanceTracker";
import AdminSettings from "./pages/admin/AdminSettings";
import TeacherStudyMaterial from "./pages/teacher/TeacherStudyMaterial";
import TeacherTimetable from "./pages/teacher/TeacherTimetable";
import StudentTimetable from "./pages/student/StudentTimetable";
import ExamTimetable from "./pages/common/ExamTimetable";
import ExamTimetableManagement from "./pages/admin/ExamTimetableManagement";
import Calendars from "./pages/common/Calendars";
import AcademicCalendar from "./pages/common/AcademicCalendar";

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
