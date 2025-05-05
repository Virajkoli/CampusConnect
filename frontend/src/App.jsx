import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect } from "react";

import Navbar from "./Components/Navbar";
import ProtectedRoute from "./Components/ProtectedRoute";
import AdminRoute from "./Components/AdminRoute";
import TeacherRoute from "./Components/TeacherRoute";
import TeacherCourses from "./pages/TeacherCourses";

import Home from "./pages/Home";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Announcements from "./pages/Announcements";
import ChangePassword from "./pages/ChangePassword";
import Discussions from "./pages/Discussions";
import Chat from "./pages/Chats";
import AuthPage from "./components/AuthPage";
import ResetPassword from "./pages/ResetPassword";
import ResetConfirm from "./pages/ResetConfirm";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAuthPage from "./pages/AdminAuthPage";
import StudentAuthPage from "./pages/StudentAuthPage";
import UserManagement from "./pages/UserManagement";
import TeacherAuthPage from "./pages/TeacherAuthPage";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherManagement from "./pages/TeacherManagement";

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
    <Router>
      {/* Conditionally render the Navbar */}
      {location.pathname !== "/teacher-dashboard" && <Navbar />}
      <FirebaseRedirectHandler />
      <Routes>
        <Route path="/" element={<Home />} />

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
          path="/admin-adduser"
          element={
            <AdminRoute>
              <UserManagement />
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
      </Routes>
    </Router>
  );
}

export default App;
