// src/routes/TeacherRoute.jsx
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "../firebase";

const TeacherRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const tokenResult = await user.getIdTokenResult();
        if (tokenResult.claims.teacher) {
          setIsTeacher(true);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <p>Loading...</p>;

  return isTeacher ? children : <Navigate to="/auth/teacher" />;
};

export default TeacherRoute;
