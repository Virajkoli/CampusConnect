import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, firestore } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import StudentProfile from "../pages/StudentProfile";
import TeacherProfile from "../pages/TeacherProfile";
import AdminProfile from "../pages/AdminProfile";

function Profile() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        navigate("/login");
        return;
      }

      try {
        // Get user claims to determine role
        await currentUser.reload();
        const tokenResult = await currentUser.getIdTokenResult(true);
        const claims = tokenResult.claims;
        
        setUser(currentUser);
        
        // Determine user role and fetch appropriate data
        if (claims.admin) {
          setUserRole("admin");
          const adminDoc = await getDoc(doc(firestore, "admins", currentUser.uid));
          if (adminDoc.exists()) {
            setUserData({ ...adminDoc.data(), ...currentUser });
          } else {
            setUserData(currentUser);
          }
        } else if (claims.teacher) {
          setUserRole("teacher");
          const teacherDoc = await getDoc(doc(firestore, "teachers", currentUser.uid));
          if (teacherDoc.exists()) {
            setUserData({ ...teacherDoc.data(), ...currentUser });
          } else {
            setUserData(currentUser);
          }
        } else {
          setUserRole("student");
          const studentDoc = await getDoc(doc(firestore, "students", currentUser.uid));
          if (studentDoc.exists()) {
            setUserData({ ...studentDoc.data(), ...currentUser });
          } else {
            // Fallback to users collection if student-specific data isn't found
            const userDoc = await getDoc(doc(firestore, "users", currentUser.uid));
            if (userDoc.exists()) {
              setUserData({ ...userDoc.data(), ...currentUser });
            } else {
              setUserData(currentUser);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

   const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center py-10 px-4">
      {userRole === "student" && <StudentProfile userData={userData} />}
      {userRole === "teacher" && <TeacherProfile userData={userData} />}
      {userRole === "admin" && <AdminProfile userData={userData} />}
    </div>
  );
}

export default Profile;