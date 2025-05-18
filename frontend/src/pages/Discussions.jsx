import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firestore, auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { FiArrowLeft } from "react-icons/fi";

function Discussions() {
  const [user] = useAuthState(auth);
  const [branches] = useState([
    "Computer Engineering",
    "Electronics And TeleCommunication Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Electrical Engineering",
    "Instrumentation Engineering",
  ]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check user role
    const checkUserRole = async () => {
      if (user) {
        const token = await user.getIdTokenResult();
        if (token.claims.teacher) {
          // If user is a teacher, redirect to chat page directly
          navigate("/chat");
        }
      }
    };

    checkUserRole();
  }, [user, navigate]);

  const fetchTeachersByBranch = async (branch) => {
    setLoading(true);
    try {
      const teachersQuery = query(
        collection(firestore, "teachers"),
        where("dept", "==", branch)
      );
      const snapshot = await getDocs(teachersQuery);
      const teacherList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTeachers(teacherList);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBranchChange = (e) => {
    const branch = e.target.value;
    setSelectedBranch(branch);
    if (branch) {
      fetchTeachersByBranch(branch);
    } else {
      setTeachers([]);
    }
  };

  const handleChatInitiation = (teacher) => {
    // Navigate to the chat page with the teacher ID
    navigate(`/chat/${teacher.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <button
          onClick={() => navigate("/student-dashboard")}
          className="flex items-center my-4 text-red-600 hover:text-green-800 transition-colors"
        >
          <FiArrowLeft className="mr-2" />
          Go Back
        </button>
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Find Teachers for Discussion
        </h1>

        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Select Department:
          </label>
          <select
            value={selectedBranch}
            onChange={handleBranchChange}
            className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select Department --</option>
            {branches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div>
            {teachers.length > 0 ? (
              <ul className="space-y-4">
                {teachers.map((teacher) => (
                  <li
                    key={teacher.id}
                    className="p-4 border rounded-lg flex justify-between items-center hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div>
                      <p className="font-medium text-gray-800">
                        {teacher.name}
                      </p>
                      <p className="text-sm text-gray-600">{teacher.email}</p>
                    </div>
                    <button
                      onClick={() => handleChatInitiation(teacher)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
                    >
                      Start Chat
                    </button>
                  </li>
                ))}
              </ul>
            ) : selectedBranch ? (
              <p className="text-center text-gray-600">
                No teachers found for the selected department.
              </p>
            ) : (
              <p className="text-center text-gray-600">
                Please select a department to see available teachers.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Discussions;
