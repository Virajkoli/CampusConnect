import { Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { useEffect, useState } from "react";
import { auth } from "../firebase";

function AdminRoute({ children }) {
  const [user, loading] = useAuthState(auth); // Firebase user status
  const [isAdmin, setIsAdmin] = useState(false); // Kya user admin hai?
  const [checking, setChecking] = useState(true); // Admin check complete hua ya nahi?

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

  if (loading || checking) {
    return <div>Loading...</div>; // Jab tak check ho raha hai, loading dikhayega
  }

  if (!user || !isAdmin) {
    return <Navigate to="/auth/admin" replace />; // Non-admin users ko redirect karega
  }

  return children; // Sirf admin users ke liye content render karega
}

export default AdminRoute;
