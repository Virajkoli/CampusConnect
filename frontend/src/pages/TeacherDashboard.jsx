// src/pages/TeacherDashboard.jsx
import React, { useState, useEffect } from "react";
import { auth, firestore } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { FiSearch, FiLogOut, FiBook } from "react-icons/fi";
import {
  FaChalkboardTeacher,
  FaBell,
  FaComments,
  FaBook,
  FaClipboardList,
  FaGraduationCap,
  FaCalendarCheck,
} from "react-icons/fa";
import { IoHome } from "react-icons/io5";
import CalendarComponent from "../components/CalendarComponent";

export default function TeacherDashboard() {
  const [students, setStudents] = useState([]);
  const [teacherName, setTeacherName] = useState("John Doe");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [isTeacherVerified, setIsTeacherVerified] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [timetableClasses, setTimetableClasses] = useState([]);
  const [allTimetable, setAllTimetable] = useState([]);

  // Get current day name
  const getCurrentDay = () => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[new Date().getDay()];
  };

  // Fetch today's classes from timetable
  useEffect(() => {
    const fetchTodaysClasses = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const currentDay = getCurrentDay();
        const timetableRef = collection(firestore, "timetable");
        const q = query(
          timetableRef,
          where("teacherId", "==", user.uid),
          where("day", "==", currentDay)
        );

        const snapshot = await getDocs(q);
        const classes = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort classes by start time
        classes.sort((a, b) => a.startTime.localeCompare(b.startTime));
        setTimetableClasses(classes);
      } catch (error) {
        console.error("Error fetching today's classes:", error);
      }
    };

    if (isTeacherVerified) {
      fetchTodaysClasses();
    }
  }, [isTeacherVerified]);

  // Fetch all timetable data for calendar
  useEffect(() => {
    const fetchAllTimetable = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const timetableRef = collection(firestore, "timetable");
        const q = query(timetableRef, where("teacherId", "==", user.uid));

        const snapshot = await getDocs(q);
        const allClasses = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setAllTimetable(allClasses);
      } catch (error) {
        console.error("Error fetching timetable:", error);
      }
    };

    if (isTeacherVerified) {
      fetchAllTimetable();
    }
  }, [isTeacherVerified]);

  useEffect(() => {
    const verifyRole = async () => {
      setIsTeacherVerified(true);
    };

    verifyRole();

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
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => {
      clearInterval(timerId);
    };
  }, []);

  const handleCreateAssignment = async (assignmentData) => {
    if (!selectedCourse) {
      setError("Please select a course first");
      return;
    }

    const result = await createAssignment(selectedCourse.id, assignmentData);

    if (result.success) {
      alert(`Assignment created successfully! ID: ${result.assignmentId}`);
    } else {
      setError(result.error || "Failed to create assignment");
    }
  };

  const handleUploadMarks = async (assignmentId, gradesData) => {
    if (!selectedCourse) {
      setError("Please select a course first");
      return;
    }

    const result = await uploadStudentMarks(
      selectedCourse.id,
      assignmentId,
      gradesData
    );

    if (result.success) {
      alert("Student marks uploaded successfully!");
    } else {
      setError(result.error || "Failed to upload marks");
    }
  };

  const handleMarkAttendance = async (date, attendanceData) => {
    if (!selectedCourse) {
      setError("Please select a course first");
      return;
    }

    const result = await markAttendance(
      selectedCourse.id,
      date,
      attendanceData
    );

    if (result.success) {
      alert("Attendance marked successfully!");
    } else {
      setError(result.error || "Failed to mark attendance");
    }
  };

  if (error && error.startsWith("You don't have teacher privileges")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 text-xl">{error}</p>
      </div>
    );
  }

  if (!isTeacherVerified && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Verifying teacher status...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#e0eafc] via-[#cfdef3] to-[#dcdfe2] text-gray-800 flex">
      <aside className="w-25 bg-gradient-to-b from-purple-600 via-blue-400 to-purple-600 text-white p-6 flex flex-col space-y-6 relative">
        <h2 className="text-2xl font-bold mb-4">Teacher Portal</h2>
        <nav className="space-y-4 mt-6">
          <SidebarItem
            icon={<IoHome />}
            label="Dashboard"
            path="/teacher-dashboard"
          />
          <SidebarItem
            icon={<FaComments />}
            label="Student Chats"
            path="/chat"
          />
          <SidebarItem
            icon={<FaBook />}
            label="Courses"
            path="/teacher-courses"
          />
          <SidebarItem
            icon={<FiBook />}
            label="Study Materials"
            path="/teacher-studymaterial"
          />
          <SidebarItem
            icon={<FaChalkboardTeacher />}
            label="My Timetable"
            path="/teacher-timetable"
          />
          <SidebarItem
            icon={<FaCalendarCheck />}
            label="Exam Schedule"
            path="/exam-timetable"
          />
          <SidebarItem icon={<FiLogOut />} label="Logout" path="/login" />
        </nav>
      </aside>

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

        <div className="flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-6">
          <div className="flex-1 bg-white p-6 rounded-xl shadow-lg order-2 lg:order-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-purple-700">
                Today's Classes - {getCurrentDay()}
              </h3>
              <Link
                to="/teacher-timetable"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View Full Timetable →
              </Link>
            </div>

            {timetableClasses.length > 0 ? (
              <div className="space-y-3">
                {timetableClasses.map((classItem) => {
                  const currentTimeStr = new Date().toLocaleTimeString(
                    "en-US",
                    { hour12: false, hour: "2-digit", minute: "2-digit" }
                  );
                  const isPast = currentTimeStr > classItem.endTime;
                  const isOngoing =
                    currentTimeStr >= classItem.startTime &&
                    currentTimeStr <= classItem.endTime;

                  return (
                    <div
                      key={classItem.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        isPast
                          ? "bg-gray-50 border-gray-400 opacity-60"
                          : isOngoing
                          ? "bg-green-50 border-green-500"
                          : "bg-blue-50 border-blue-500"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-lg text-gray-800">
                              {classItem.subject}
                            </h4>
                            {isOngoing && (
                              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                                Ongoing
                              </span>
                            )}
                            {isPast && (
                              <span className="bg-gray-400 text-white text-xs px-2 py-1 rounded-full">
                                Completed
                              </span>
                            )}
                          </div>
                          <div className="mt-2 space-y-1 text-sm text-gray-600">
                            <p className="flex items-center gap-2">
                              <span className="font-medium">⏰ Time:</span>
                              {classItem.startTime} - {classItem.endTime}
                            </p>
                            {classItem.room && (
                              <p className="flex items-center gap-2">
                                <span className="font-medium">📍 Room:</span>
                                {classItem.room}
                              </p>
                            )}
                            {classItem.department && (
                              <p className="flex items-center gap-2">
                                <span className="font-medium">
                                  🎓 Department:
                                </span>
                                {classItem.department}
                              </p>
                            )}
                            {classItem.semester && (
                              <p className="flex items-center gap-2">
                                <span className="font-medium">
                                  📚 Semester:
                                </span>
                                {classItem.semester}
                                {classItem.division &&
                                  ` - Div ${classItem.division}`}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg">
                  No classes scheduled for today ({getCurrentDay()})
                </p>
                <Link
                  to="/teacher-timetable"
                  className="text-blue-600 hover:text-blue-800 mt-2 inline-block"
                >
                  Add classes to your timetable →
                </Link>
              </div>
            )}
          </div>

          <div className="w-full lg:w-1/3 bg-white p-4 rounded-xl shadow-lg order-1 lg:order-2">
            <CalendarComponent timetable={allTimetable} />
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
