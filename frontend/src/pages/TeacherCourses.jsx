// src/pages/TeacherCourses.jsx
import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function TeacherCourses() {
  const [dept, setDept] = useState("");
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeacherData = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }
      try {
        const docRef = doc(db, "teachers", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setDept(data.dept || "");

          // Check if assignedCourses exists and is properly formatted
          if (data.assignedCourses && Array.isArray(data.assignedCourses)) {
            setAssignedCourses(data.assignedCourses);
          } else if (data.subjects) {
            // For backward compatibility with the old format
            const year = data.year || "";
            const subjects = Array.isArray(data.subjects)
              ? data.subjects
              : typeof data.subjects === "string"
              ? [data.subjects]
              : [];

            if (year && subjects.length > 0) {
              setAssignedCourses([{ year, subjects }]);
            }
          } else {
            setAssignedCourses([]);
          }
        } else {
          setError("Teacher data not found");
        }
      } catch (err) {
        setError("Error fetching data: " + err.message);
      }
    };
    fetchTeacherData();
  }, [navigate]);

  const getYearColor = (year) => {
    const colors = {
      "1st": "from-blue-500 to-blue-400",
      "2nd": "from-purple-500 to-purple-400",
      "3rd": "from-green-500 to-green-400",
      "4th": "from-yellow-500 to-yellow-400",
    };
    return colors[year] || "from-gray-500 to-gray-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-center text-blue-800 mb-2">
            Your Teaching Dashboard
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Department: {dept || "Not assigned"}
          </p>

          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {assignedCourses.length === 0 ? (
            <div className="text-center p-10 bg-gray-50 rounded-lg">
              <p className="text-xl text-gray-500">No courses assigned yet.</p>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Your Assigned Courses
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {assignedCourses.map((course, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`rounded-lg shadow-md overflow-hidden bg-gradient-to-r ${getYearColor(
                      course.year
                    )}`}
                  >
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-3">
                        {course.year} Year
                      </h3>
                      <div className="bg-white bg-opacity-90 rounded-lg p-4">
                        <h4 className="font-medium text-gray-800 mb-2">
                          Subjects:
                        </h4>
                        <ul className="space-y-1">
                          {course.subjects.map((subject, subIndex) => (
                            <li
                              key={subIndex}
                              className="flex items-center text-gray-700"
                            >
                              <span className="h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                              {subject}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Teaching Tips Section */}
        <div className="bg-blue-50 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">
            Teaching Resources
          </h3>
          <p className="text-gray-700 mb-4">
            You have{" "}
            {assignedCourses.reduce(
              (total, course) => total + course.subjects.length,
              0
            )}{" "}
            subject(s) across {assignedCourses.length} year(s).
          </p>
          <div className="bg-white rounded-lg p-4">
            <ul className="space-y-2 text-gray-700">
              <li>• Access learning materials in the Resources section</li>
              <li>• Schedule office hours using the Calendar</li>
              <li>• Communicate with students through the Chat feature</li>
              <li>• Post announcements to keep your students updated</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
