import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { firestore, auth } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  doc,
  getDoc,
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
  FiMapPin,
  FiUser,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import AnnouncementsBanner from "../components/AnnouncementsBanner";

function StudentDashboard() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [studentName, setStudentName] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [division, setDivision] = useState("");
  const [courses, setCourses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timetable, setTimetable] = useState([]);
  const [todaysClasses, setTodaysClasses] = useState([]);

  // Days of week for timetable
  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const today = daysOfWeek[new Date().getDay()];

  // Color palette for subjects
  const subjectColors = [
    { bg: "bg-blue-100", border: "border-blue-400", text: "text-blue-700" },
    {
      bg: "bg-purple-100",
      border: "border-purple-400",
      text: "text-purple-700",
    },
    { bg: "bg-green-100", border: "border-green-400", text: "text-green-700" },
    {
      bg: "bg-orange-100",
      border: "border-orange-400",
      text: "text-orange-700",
    },
    { bg: "bg-pink-100", border: "border-pink-400", text: "text-pink-700" },
    { bg: "bg-teal-100", border: "border-teal-400", text: "text-teal-700" },
    {
      bg: "bg-indigo-100",
      border: "border-indigo-400",
      text: "text-indigo-700",
    },
    { bg: "bg-red-100", border: "border-red-400", text: "text-red-700" },
  ];

  const getSubjectColor = (index) => {
    return subjectColors[index % subjectColors.length];
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Fetch student data
    const fetchStudentData = async () => {
      try {
        // First try to get user doc by UID
        const userDocRef = doc(firestore, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        let studentData = null;
        if (userDocSnap.exists()) {
          studentData = userDocSnap.data();
        } else {
          // Fallback to query
          const q = query(
            collection(firestore, "users"),
            where("uid", "==", user.uid)
          );
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            studentData = querySnapshot.docs[0].data();
          }
        }

        if (studentData) {
          setStudentName(
            studentData.name || studentData.displayName || "Student"
          );
          setDepartment(studentData.dept || "Not assigned");
          setYear(studentData.year || "");
          setSemester(studentData.semester || "");
          setDivision(studentData.division || "A");

          // Fetch timetable based on student's department, semester and division
          if (studentData.dept && studentData.semester) {
            fetchTimetable(
              studentData.dept,
              studentData.semester,
              studentData.division || "A"
            );
          }

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

    // Fetch timetable from Firestore
    const fetchTimetable = async (dept, sem, div) => {
      try {
        const timetableRef = collection(firestore, "timetable");
        const q = query(
          timetableRef,
          where("dept", "==", dept),
          where("semester", "==", sem)
        );

        const querySnapshot = await getDocs(q);
        const allClasses = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Filter by division if specified
          if (
            !data.division ||
            data.division === div ||
            data.division === "All"
          ) {
            allClasses.push({
              id: doc.id,
              ...data,
            });
          }
        });

        // Sort by start time
        allClasses.sort((a, b) => {
          const timeA = a.startTime || "00:00";
          const timeB = b.startTime || "00:00";
          return timeA.localeCompare(timeB);
        });

        setTimetable(allClasses);

        // Filter today's classes
        const todayClasses = allClasses.filter(
          (cls) => cls.dayOfWeek === today
        );
        setTodaysClasses(todayClasses);
      } catch (error) {
        console.error("Error fetching timetable:", error);
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
  }, [user, navigate, today]);

  // Format time for display
  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
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
                {department} • {year} Year{" "}
                {semester && `• Semester ${semester}`}
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
          {/* Left Column - Today's Schedule */}
          <div className="lg:col-span-2 space-y-8">
            {/* Today's Classes - Professional Timetable View */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl shadow-md overflow-hidden"
            >
              <div className="p-6 bg-gradient-to-r from-purple-500 to-indigo-600 border-b">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <FiCalendar className="text-2xl text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Today's Schedule
                      </h2>
                      <p className="text-purple-100 text-sm">{today}</p>
                    </div>
                  </div>
                  <Link
                    to="/student-timetable"
                    className="text-sm text-white bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
                  >
                    View Full Timetable →
                  </Link>
                </div>
              </div>

              <div className="p-6">
                {todaysClasses.length > 0 ? (
                  <div className="space-y-4">
                    {todaysClasses.map((classItem, index) => {
                      const colors = getSubjectColor(index);
                      return (
                        <motion.div
                          key={classItem.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`border-l-4 ${colors.border} ${colors.bg} p-4 rounded-r-xl hover:shadow-md transition-all`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="flex-1">
                              <h3
                                className={`font-semibold text-lg ${colors.text}`}
                              >
                                {classItem.subject}
                              </h3>
                              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <FiClock className="w-4 h-4" />
                                  {formatTime(classItem.startTime)} -{" "}
                                  {formatTime(classItem.endTime)}
                                </span>
                                {classItem.room && (
                                  <span className="flex items-center gap-1">
                                    <FiMapPin className="w-4 h-4" />
                                    {classItem.room}
                                  </span>
                                )}
                                {classItem.teacherName && (
                                  <span className="flex items-center gap-1">
                                    <FiUser className="w-4 h-4" />
                                    {classItem.teacherName}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div
                              className={`px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}
                            >
                              {classItem.type || "Lecture"}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiCalendar className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                      No Classes Today
                    </h3>
                    <p className="text-gray-500">
                      {today === "Sunday" || today === "Saturday"
                        ? "Enjoy your weekend! 🎉"
                        : "Your schedule is clear for today."}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Weekly Timetable Preview */}
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
                      Weekly Overview
                    </h2>
                  </div>
                  <Link
                    to="/student-timetable"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Full Schedule →
                  </Link>
                </div>
              </div>

              <div className="p-6 overflow-x-auto">
                <div className="flex gap-4 min-w-max">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(
                    (day) => {
                      const dayClasses = timetable.filter(
                        (cls) => cls.dayOfWeek === day
                      );
                      const isToday = day === today;
                      return (
                        <div
                          key={day}
                          className={`flex-1 min-w-[140px] p-3 rounded-xl ${
                            isToday
                              ? "bg-gradient-to-b from-indigo-50 to-purple-50 ring-2 ring-indigo-300"
                              : "bg-gray-50"
                          }`}
                        >
                          <h4
                            className={`font-semibold text-center mb-3 ${
                              isToday ? "text-indigo-700" : "text-gray-700"
                            }`}
                          >
                            {day.slice(0, 3)}
                            {isToday && (
                              <span className="ml-1 text-xs">(Today)</span>
                            )}
                          </h4>
                          <div className="space-y-2">
                            {dayClasses.length > 0 ? (
                              dayClasses.slice(0, 3).map((cls, idx) => (
                                <div
                                  key={cls.id}
                                  className={`p-2 rounded-lg text-xs ${
                                    getSubjectColor(idx).bg
                                  } ${getSubjectColor(idx).text}`}
                                >
                                  <div className="font-medium truncate">
                                    {cls.subject}
                                  </div>
                                  <div className="opacity-75">
                                    {formatTime(cls.startTime)}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center text-gray-400 text-xs py-4">
                                No classes
                              </div>
                            )}
                            {dayClasses.length > 3 && (
                              <div className="text-center text-xs text-gray-500">
                                +{dayClasses.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-xl shadow-md overflow-hidden"
            >
              <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-100 border-b border-green-200">
                <div className="flex items-center space-x-2">
                  <FiBarChart2 className="text-lg text-green-600" />
                  <h2 className="text-xl font-semibold text-gray-800">
                    Today's Summary
                  </h2>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {todaysClasses.length}
                    </div>
                    <div className="text-sm text-gray-600">Classes Today</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {timetable.length}
                    </div>
                    <div className="text-sm text-gray-600">Weekly Classes</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
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
                    to="/student-timetable"
                    className="bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 p-4 rounded-lg text-center transition-colors border border-purple-200"
                  >
                    <FiCalendar className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                    <h3 className="font-medium text-purple-700">
                      My Timetable
                    </h3>
                  </Link>
                  <Link
                    to="/study-materials"
                    className="bg-indigo-50 hover:bg-indigo-100 p-4 rounded-lg text-center transition-colors"
                  >
                    <FiBook className="w-6 h-6 mx-auto mb-2 text-indigo-600" />
                    <h3 className="font-medium text-indigo-700">
                      Study Materials
                    </h3>
                  </Link>
                  <Link
                    to="/exam-timetable"
                    className="bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 p-4 rounded-lg text-center transition-colors border border-orange-200"
                  >
                    <h3 className="font-medium text-orange-700">
                      📝 Exam Schedule
                    </h3>
                  </Link>
                  <Link
                    to="/calendars"
                    className="bg-indigo-50 hover:bg-indigo-100 p-4 rounded-lg text-center transition-colors"
                  >
                    <FiCalendar className="w-6 h-6 mx-auto mb-2 text-indigo-600" />
                    <h3 className="font-medium text-indigo-700">Calendars</h3>
                  </Link>
                  <Link
                    to="/announcements"
                    className="bg-indigo-50 hover:bg-indigo-100 p-4 rounded-lg text-center transition-colors"
                  >
                    <FiBell className="w-6 h-6 mx-auto mb-2 text-indigo-600" />
                    <h3 className="font-medium text-indigo-700">
                      Announcements
                    </h3>
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
