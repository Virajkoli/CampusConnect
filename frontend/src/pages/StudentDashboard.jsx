import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { firestore, auth } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  FiCalendar,
  FiBook,
  FiBell,
  FiClock,
  FiCheck,
  FiBarChart2,
  FiActivity,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import AnnouncementsBanner from "../components/AnnouncementsBanner";

function StudentDashboard() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [studentName, setStudentName] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [courses, setCourses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState([
    {
      id: 1,
      title: "Mid-Semester Exam",
      date: "May 20, 2025",
      time: "10:00 AM",
      type: "exam",
    },
    {
      id: 2,
      title: "Project Submission Deadline",
      date: "May 25, 2025",
      time: "11:59 PM",
      type: "deadline",
    },
    {
      id: 3,
      title: "Tech Workshop",
      date: "May 28, 2025",
      time: "2:00 PM",
      type: "event",
    },
  ]);

  // Mock timetable data
  const [todaysClasses, setTodaysClasses] = useState([
    {
      id: 1,
      subject: "Data Structures",
      time: "9:00 AM - 10:30 AM",
      professor: "Dr. Smith",
      room: "Room 105",
    },
    {
      id: 2,
      subject: "Computer Networks",
      time: "11:00 AM - 12:30 PM",
      professor: "Dr. Johnson",
      room: "Lab 203",
    },
    {
      id: 3,
      subject: "Database Systems",
      time: "2:00 PM - 3:30 PM",
      professor: "Dr. Williams",
      room: "Room 108",
    },
  ]);

  // Mock attendance data
  const [attendance, setAttendance] = useState([
    { subject: "Data Structures", percentage: 85 },
    { subject: "Computer Networks", percentage: 92 },
    { subject: "Database Systems", percentage: 78 },
    { subject: "Programming Languages", percentage: 88 },
  ]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Fetch student data
    const fetchStudentData = async () => {
      try {
        const q = query(
          collection(firestore, "users"),
          where("uid", "==", user.uid)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const studentData = querySnapshot.docs[0].data();
          setStudentName(
            studentData.name || studentData.displayName || "Student"
          );
          setDepartment(studentData.dept || "Not assigned");
          setYear(studentData.year || "1st Year");

          // Mock course data based on department
          const mockCourses = [
            {
              id: 1,
              code: "CS101",
              name: "Introduction to Programming",
              professor: "Dr. Smith",
            },
            {
              id: 2,
              code: "CS201",
              name: "Data Structures and Algorithms",
              professor: "Dr. Williams",
            },
            {
              id: 3,
              code: "CS301",
              name: "Database Management Systems",
              professor: "Dr. Johnson",
            },
            {
              id: 4,
              code: "CS401",
              name: "Computer Networks",
              professor: "Dr. Brown",
            },
          ];

          setCourses(mockCourses);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching student data:", error);
        setLoading(false);
      }
    };

    // Fetch announcements
    const fetchAnnouncements = () => {
      const q = query(
        collection(firestore, "announcements"),
        where("active", "==", true)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const announcementsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          isRead: doc.data().readBy?.includes(user.uid) || false,
        }));

        setAnnouncements(announcementsList);
      });

      return unsubscribe;
    };

    fetchStudentData();
    const unsubscribeAnnouncements = fetchAnnouncements();

    return () => {
      unsubscribeAnnouncements();
    };
  }, [user, navigate]);

  const getEventIcon = (type) => {
    switch (type) {
      case "exam":
        return <FiBook className="text-red-500" />;
      case "deadline":
        return <FiClock className="text-amber-500" />;
      case "event":
        return <FiCalendar className="text-blue-500" />;
      default:
        return <FiCalendar className="text-gray-500" />;
    }
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 90) return "bg-green-500";
    if (percentage >= 75) return "bg-blue-500";
    if (percentage >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pt-10 pb-10">
      {/* Top Banner for Announcements */}
      <AnnouncementsBanner />

      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl shadow-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center text-white">
            <div>
              <h1 className="text-3xl font-bold">
                Welcome back, {studentName}!
              </h1>
              <p className="mt-2 text-blue-100">
                {department} • {year}
              </p>
            </div>
            <div className="mt-4 md:mt-0 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <p className="text-sm">
                Today is{" "}
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Today's Classes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl shadow-md overflow-hidden"
            >
              <div className="p-6 bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <FiBook className="text-lg text-purple-600" />
                    <h2 className="text-xl font-semibold text-gray-800">
                      Today's Classes
                    </h2>
                  </div>
                  <Link
                    to="/timetable"
                    className="text-sm text-purple-600 hover:text-purple-800"
                  >
                    View Full Schedule →
                  </Link>
                </div>
              </div>

              <div className="p-6">
                {todaysClasses.length > 0 ? (
                  <div className="space-y-4">
                    {todaysClasses.map((classItem) => (
                      <div
                        key={classItem.id}
                        className="border-l-4 border-purple-400 bg-purple-50 p-4 rounded-r-lg hover:bg-purple-100 transition-colors"
                      >
                        <div className="flex justify-between">
                          <h3 className="font-medium text-gray-800">
                            {classItem.subject}
                          </h3>
                          <span className="text-sm text-gray-600">
                            {classItem.time}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {classItem.professor} • {classItem.room}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    No classes scheduled for today.
                  </p>
                )}
              </div>
            </motion.div>

            {/* Enrolled Courses */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-xl shadow-md overflow-hidden"
            >
              <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <FiBook className="text-lg text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-800">
                      Enrolled Courses
                    </h2>
                  </div>
                  <Link
                    to="/courses"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View All Courses →
                  </Link>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-600">
                          {course.code}
                        </span>
                        <span className="text-xs text-gray-500">5 CR</span>
                      </div>
                      <h3 className="font-medium mt-1 text-gray-800">
                        {course.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Prof. {course.professor}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            {/* Upcoming Events */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-xl shadow-md overflow-hidden"
            >
              {" "}
              <div className="p-6 bg-gradient-to-r from-amber-50 to-amber-100 border-b border-amber-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <FiCalendar className="text-lg text-amber-600" />
                    <h2 className="text-xl font-semibold text-gray-800">
                      Upcoming Events
                    </h2>
                  </div>
                  <Link
                    to="/events-calendar"
                    className="text-sm text-amber-600 hover:text-amber-800"
                  >
                    View Calendar →
                  </Link>
                </div>
              </div>
              <div className="p-4">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-3 mb-3 border-l-4 border-amber-400 bg-amber-50 rounded-r-lg hover:bg-amber-100 transition-colors"
                  >
                    <div className="flex items-start">
                      <div className="mr-3 mt-1">
                        {getEventIcon(event.type)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">
                          {event.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {event.date} • {event.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Attendance Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-xl shadow-md overflow-hidden"
            >
              {" "}
              <div className="p-6 bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <FiCheck className="text-lg text-green-600" />
                    <h2 className="text-xl font-semibold text-gray-800">
                      Attendance Overview
                    </h2>
                  </div>
                  <Link
                    to="/attendance-tracker"
                    className="text-sm text-green-600 hover:text-green-800"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {attendance.map((item) => (
                  <div key={item.subject} className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {item.subject}
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          item.percentage >= 75
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {item.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getAttendanceColor(
                          item.percentage
                        )}`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white rounded-xl shadow-md overflow-hidden"
            >
              <div className="p-6 bg-gradient-to-r from-indigo-50 to-indigo-100 border-b border-indigo-200">
                <div className="flex items-center space-x-2">
                  <FiActivity className="text-lg text-indigo-600" />
                  <h2 className="text-xl font-semibold text-gray-800">
                    Quick Links
                  </h2>
                </div>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/assignments"
                    className="bg-indigo-50 hover:bg-indigo-100 p-4 rounded-lg text-center transition-colors"
                  >
                    <h3 className="font-medium text-indigo-700">Assignments</h3>
                  </Link>
                  <Link
                    to="/grades"
                    className="bg-indigo-50 hover:bg-indigo-100 p-4 rounded-lg text-center transition-colors"
                  >
                    <h3 className="font-medium text-indigo-700">Grades</h3>
                  </Link>{" "}
                  <Link
                    to="/study-materials"
                    className="bg-indigo-50 hover:bg-indigo-100 p-4 rounded-lg text-center transition-colors"
                  >
                    <h3 className="font-medium text-indigo-700">
                      Study Materials
                    </h3>
                  </Link>
                  <Link
                    to="/events-calendar"
                    className="bg-indigo-50 hover:bg-indigo-100 p-4 rounded-lg text-center transition-colors"
                  >
                    <h3 className="font-medium text-indigo-700">
                      Events Calendar
                    </h3>
                  </Link>
                  <Link
                    to="/attendance-tracker"
                    className="bg-indigo-50 hover:bg-indigo-100 p-4 rounded-lg text-center transition-colors"
                  >
                    <h3 className="font-medium text-indigo-700">Attendance</h3>
                  </Link>
                  <Link
                    to="/profile"
                    className="bg-indigo-50 hover:bg-indigo-100 p-4 rounded-lg text-center transition-colors"
                  >
                    <h3 className="font-medium text-indigo-700">Profile</h3>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
