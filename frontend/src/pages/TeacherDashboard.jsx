// src/pages/TeacherDashboard.jsx
import React, { useState, useEffect } from "react";
import { auth, firestore, db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { FiSearch, FiLogOut } from "react-icons/fi";
import {
  FaChalkboardTeacher,
  FaBell,
  FaComments,
  FaBook,
} from "react-icons/fa";
import { IoHome } from "react-icons/io5";
import CalendarComponent from "../components/CalendarComponent";

export default function TeacherDashboard() {
  const [students, setStudents] = useState([]);
  const [teacherName, setTeacherName] = useState("John Doe");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, "students"));
        const studentList = [];
        querySnapshot.forEach((docSnap) => {
          studentList.push({ id: docSnap.id, ...docSnap.data() });
        });
        setStudents(studentList);
      } catch (err) {
        setError("Failed to fetch students: " + err.message);
      }
    };

    const fetchTeacherName = () => {
      const user = auth.currentUser;
      if (user) {
        setTeacherName(user.displayName || "Unknown Teacher");
      }
    };

    fetchStudents();
    fetchTeacherName();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#e0eafc] via-[#cfdef3] to-[#dcdfe2] text-gray-800 flex">
      {/* Sidebar */}
      <aside className="w-25 bg-gradient-to-b from-purple-600 via-blue-400 to-purple-600 text-white p-6 flex flex-col space-y-6 relative">
        <h2 className="text-2xl font-bold mb-4">Teacher Portal</h2>
        <nav className="space-y-4 mt-6">
          <SidebarItem
            icon={<IoHome />}
            label="Dashboard"
            path="/teacher-dashboard"
          />
          <SidebarItem
            icon={<FaBook />}
            label="Courses"
            path="/teacher-courses"
          />
          <SidebarItem
            icon={<FaChalkboardTeacher />}
            label="My Classes"
            path="/teacher-classes"
          />
          <SidebarItem icon={<FaComments />} label="Chat" />
          <SidebarItem icon={<FaBell />} label="Notifications" />
          <SidebarItem icon={<FiLogOut />} label="Logout" path="/login" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search here..."
                className="px-4 py-2 border rounded-lg pl-10"
              />
              <FiSearch className="absolute top-2.5 left-3 text-gray-400" />
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-300" />
            {teacherName}
          </div>
        </div>

        <div className="flex space-x-6">
          {/* Calendar */}
          <div className="w-1/3 bg-white p-4 rounded-xl shadow">
            <CalendarComponent />
          </div>

          {/* Lessons */}
          <div className="flex-1 bg-white p-4 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-4">Lessons for the Day</h3>
            <div className="space-y-4">
              <p>No lessons scheduled yet.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, path }) {
  return (
    <Link
      to={path || "#"}
      className="flex items-center space-x-3 hover:bg-white hover:text-green-600 px-4 py-2 rounded-lg transition"
    >
      <div className="text-lg">{icon}</div>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
