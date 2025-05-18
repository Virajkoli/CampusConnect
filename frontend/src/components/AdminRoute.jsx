import { Navigate, useLocation } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { useEffect, useState } from "react";
import { auth } from "../firebase";

function AdminRoute({ children }) {
  const [user, loading] = useAuthState(auth); // Firebase user status
  const [isAdmin, setIsAdmin] = useState(false); // Kya user admin hai?
  const [checking, setChecking] = useState(true); // Admin check complete hua ya nahi?
  const location = useLocation();

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        try {
          const token = await user.getIdTokenResult(true); // Token leke admin claim check karo
          setIsAdmin(!!token.claims.admin); // Admin claim hai toh true, nahi hai toh false
        } catch (error) {
          console.error("Admin check error:", error);
          setIsAdmin(false);
        }
      }
      setChecking(false); // Admin check khatam
    };

    checkAdmin();
  }, [user]);

  // Check if we're on a management page that should not redirect
  const isManagementPage =
    location.pathname.includes("/admin/usermanagement") ||
    location.pathname.includes("/admin/teachermanagement") ||
    location.pathname.includes("/admin/announcements");

  // Show loading state only if we're not on a management page
  if ((loading || checking) && !isManagementPage) {
    return <div>Loading...</div>; // Jab tak check ho raha hai, loading dikhayega
  }

  // Only redirect if not on a management page
  if ((!user || !isAdmin) && !isManagementPage) {
    return <Navigate to="/auth/admin" replace />; // Non-admin users ko redirect karega
  }

  return children; // Sirf admin users ke liye content render karega
}

export default AdminRoute;
