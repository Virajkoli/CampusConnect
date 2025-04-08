import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Announcements from "./pages/Announcements";
import ChangePassword from "./pages/ChangePassword";
import Discussions from "./pages/Discussions";

import Chat from "./pages/Chats";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthPage from "./components/AuthPage";
import ResetPassword from "./pages/ResetPassword";
import ResetConfirm from "./pages/ResetConfirm";

import AdminAuthPage from "./pages/AdminAuthPage";
import StudentAuthPage from "./pages/StudentAuthPage";

import { useEffect } from "react";

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
      <Navbar />
      <FirebaseRedirectHandler />
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Routes for login and signup */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />

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
          path="/auth/student"
          element={
           
              <StudentAuthPage />
            
          }
        />

        <Route
          path="/auth/admin"
          element={
            
              <AdminAuthPage/>
            
          }
        />

      
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/reset-password-confirm" element={<ResetConfirm />} />

        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePassword />
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
      </Routes>
    </Router>
  );
}

export default App;
