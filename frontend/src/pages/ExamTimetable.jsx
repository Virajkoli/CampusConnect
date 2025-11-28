import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiBook,
  FiInfo,
  FiFilter,
  FiList,
  FiGrid,
  FiArrowLeft,
} from "react-icons/fi";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db, auth } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const branches = [
  "Computer Engineering",
  "Electronics And TeleCommunication Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Instrumentation Engineering",
  "Information Technology",
];

// Course code prefix to branch mapping
const courseCodeToBranch = {
  CO: "Computer Engineering",
  CS: "Computer Engineering",
  IT: "Information Technology",
  ET: "Electronics And TeleCommunication Engineering",
  EC: "Electronics And TeleCommunication Engineering",
  EE: "Electrical Engineering",
  ME: "Mechanical Engineering",
  CE: "Civil Engineering",
  IN: "Instrumentation Engineering",
};

// Branch name mappings for flexible matching
const branchMappings = {
  "Computer Engineering": ["computer", "comp", "cse", "cs", "co"],
  "Electronics And TeleCommunication Engineering": [
    "electronics",
    "e&tc",
    "entc",
    "ece",
    "etc",
    "et",
  ],
  "Mechanical Engineering": ["mechanical", "mech", "me"],
  "Civil Engineering": ["civil", "ce"],
  "Electrical Engineering": ["electrical", "ee", "eee"],
  "Instrumentation Engineering": ["instrumentation", "inst", "in"],
  "Information Technology": ["information", "it"],
};

const years = ["1st", "2nd", "3rd", "4th"];

const ExamTimetable = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState("Computer Engineering");
  const [selectedYear, setSelectedYear] = useState("4th");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("calendar"); // calendar or list
  const [hoveredExam, setHoveredExam] = useState(null);
  const [clickedExam, setClickedExam] = useState(null); // For click-based popup
  const [showFilters, setShowFilters] = useState(false);
  const [userBranch, setUserBranch] = useState("");
  const [userYear, setUserYear] = useState("");
  const [userDataLoaded, setUserDataLoaded] = useState(false);
  const navigate = useNavigate();

  // Close clicked popup when view mode changes
  useEffect(() => {
    setClickedExam(null);
  }, [viewMode, selectedBranch, selectedYear, currentDate]);

  // Helper function to get branch from course code prefix
  const getBranchFromCourseCode = (courseCode) => {
    if (!courseCode) return null;
    // Extract prefix (first 2 letters)
    const prefix = courseCode.substring(0, 2).toUpperCase();
    return courseCodeToBranch[prefix] || null;
  };

  // Helper function to check if exam branch matches selected branch
  const branchMatches = (exam, targetBranch) => {
    if (!exam || !targetBranch) return false;

    // First check by course code prefix
    const courseCodeBranch = getBranchFromCourseCode(exam.courseCode);
    if (courseCodeBranch) {
      return courseCodeBranch === targetBranch;
    }

    // Fallback to exam.branch field matching
    const examBranch = exam.branch;
    if (!examBranch) return false;

    // Exact match
    if (examBranch.toLowerCase() === targetBranch.toLowerCase()) return true;

    // Check if exam branch contains the target branch name
    if (
      examBranch
        .toLowerCase()
        .includes(targetBranch.toLowerCase().split(" ")[0].toLowerCase())
    )
      return true;

    // Check mappings
    const mappings = branchMappings[targetBranch] || [];
    const examBranchLower = examBranch.toLowerCase();

    for (const alias of mappings) {
      if (examBranchLower.includes(alias)) return true;
    }

    // Check if target branch contains exam branch
    if (targetBranch.toLowerCase().includes(examBranchLower)) return true;

    return false;
  };

  // Fetch user's branch and year
  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const userDept = data.dept || "Computer Engineering";
          const userYr = data.year || "4th";
          setUserBranch(userDept);
          setUserYear(userYr);
          setSelectedBranch(userDept);
          setSelectedYear(userYr);
          setUserDataLoaded(true);
        } else {
          setUserDataLoaded(true);
        }
      } else {
        setUserDataLoaded(true);
      }
    };
    fetchUserData();
  }, []);

  // Fetch exams - fetch all and filter client-side for flexible matching
  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true);
      try {
        const allExamsSnapshot = await getDocs(collection(db, "examTimetable"));
        const allExams = allExamsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Filter with flexible branch matching (by course code prefix)
        const filteredExams = allExams.filter((exam) => {
          const yearMatch = exam.year === selectedYear;
          const branchMatch = branchMatches(exam, selectedBranch);
          return yearMatch && branchMatch;
        });

        // Sort by date
        filteredExams.sort((a, b) => {
          const dateA = parseExamDate(a.date);
          const dateB = parseExamDate(b.date);
          if (!dateA || !dateB) return 0;
          return dateA - dateB;
        });

        setExams(filteredExams);
      } catch (error) {
        console.error("Error fetching exams:", error);
      }
      setLoading(false);
    };
    fetchExams();
  }, [selectedBranch, selectedYear]);

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    // Add empty slots for days before the 1st
    for (let i = 0; i < startingDay; i++) {
      days.push({ day: null, date: null });
    }
    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        date: new Date(year, month, i),
      });
    }
    return days;
  };

  const getExamsForDate = (date) => {
    if (!date) return [];
    return exams.filter((exam) => {
      const examDate = parseExamDate(exam.date);
      return (
        examDate &&
        examDate.getDate() === date.getDate() &&
        examDate.getMonth() === date.getMonth() &&
        examDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const parseExamDate = (dateStr) => {
    if (!dateStr) return null;

    // Handle various date formats
    // Format: DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1]);
      const month = parseInt(dmyMatch[2]) - 1;
      const year = parseInt(dmyMatch[3]);
      return new Date(year < 100 ? 2000 + year : year, month, day);
    }

    // Format: YYYY-MM-DD (ISO)
    const isoMatch = dateStr.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (isoMatch) {
      return new Date(
        parseInt(isoMatch[1]),
        parseInt(isoMatch[2]) - 1,
        parseInt(isoMatch[3])
      );
    }

    // Try native parsing
    const parsed = new Date(dateStr);
    return isNaN(parsed) ? null : parsed;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const goToPrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isPastDate = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Group exams by date for list view
  const groupedExams = exams.reduce((acc, exam) => {
    const date = exam.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(exam);
    return acc;
  }, {});

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const days = getDaysInMonth(currentDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium mb-6 group"
          >
            <FiArrowLeft className="group-hover:animate-pulse" />
            Back to Dashboard
          </button>

          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <FiCalendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Exam Timetable
                </h1>
                <p className="text-gray-600 mt-1">
                  View exam schedules for different branches and years
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Branch & Year Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <FiFilter />
                Filters
              </button>

              {/* Quick Info */}
              <div className="text-sm text-gray-600">
                Showing:{" "}
                <span className="text-blue-600 font-medium">
                  {selectedYear} Year
                </span>{" "}
                -{" "}
                <span className="text-blue-600 font-medium">
                  {selectedBranch}
                </span>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode("calendar")}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  viewMode === "calendar"
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <FiGrid size={18} />
                Calendar
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  viewMode === "list"
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <FiList size={18} />
                List
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 mt-4 border-t border-gray-200">
                  <div>
                    <label className="block text-gray-700 mb-2 text-sm font-semibold">
                      Year
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {years.map((year) => (
                        <button
                          key={year}
                          onClick={() => setSelectedYear(year)}
                          className={`px-4 py-2 rounded-xl font-medium transition-all ${
                            selectedYear === year
                              ? "bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-lg"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2 text-sm font-semibold">
                      Branch
                    </label>
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {branches.map((branch) => (
                        <option key={branch} value={branch}>
                          {branch}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Calendar View */}
            {viewMode === "calendar" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl shadow-xl"
              >
                {/* Calendar Header */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
                  <button
                    onClick={goToPrevMonth}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                  >
                    <FiChevronLeft size={24} />
                  </button>

                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold text-white">
                      {formatDate(currentDate)}
                    </h2>
                    <button
                      onClick={goToToday}
                      className="px-3 py-1 bg-white/20 text-white rounded-lg text-sm hover:bg-white/30 transition-colors"
                    >
                      Today
                    </button>
                  </div>

                  <button
                    onClick={goToNextMonth}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                  >
                    <FiChevronRight size={24} />
                  </button>
                </div>

                {/* Week Days Header */}
                <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                  {weekDays.map((day) => (
                    <div
                      key={day}
                      className="p-3 text-center text-sm font-semibold text-gray-600"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7">
                  {days.map((dayInfo, index) => {
                    const dayExams = getExamsForDate(dayInfo.date);
                    const hasExams = dayExams.length > 0;
                    const today = isToday(dayInfo.date);
                    const past = isPastDate(dayInfo.date);

                    return (
                      <div
                        key={index}
                        className={`min-h-[100px] border-b border-r border-gray-100 p-2 relative ${
                          !dayInfo.day
                            ? "bg-gray-50"
                            : hasExams
                            ? "bg-white hover:bg-blue-50/50 cursor-pointer"
                            : "bg-white"
                        } ${past ? "opacity-50" : ""} transition-colors`}
                        onMouseEnter={() =>
                          hasExams &&
                          setHoveredExam({
                            date: dayInfo.date,
                            exams: dayExams,
                          })
                        }
                        onMouseLeave={() => setHoveredExam(null)}
                        onClick={() => {
                          if (hasExams) {
                            setClickedExam(
                              clickedExam?.date?.getTime() ===
                                dayInfo.date?.getTime()
                                ? null
                                : { date: dayInfo.date, exams: dayExams }
                            );
                          }
                        }}
                      >
                        {dayInfo.day && (
                          <>
                            <div
                              className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium ${
                                today
                                  ? "bg-blue-500 text-white"
                                  : hasExams
                                  ? "text-gray-800 font-bold"
                                  : "text-gray-500"
                              }`}
                            >
                              {dayInfo.day}
                            </div>

                            {hasExams && (
                              <div className="mt-1 space-y-1">
                                {dayExams.slice(0, 2).map((exam, i) => (
                                  <div
                                    key={i}
                                    className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-2 py-1 rounded truncate cursor-pointer hover:shadow-md transition-shadow"
                                    title={`${exam.courseCode} - ${exam.courseName}`}
                                  >
                                    {exam.courseCode}
                                  </div>
                                ))}
                                {dayExams.length > 2 && (
                                  <div className="text-xs text-gray-500 font-medium">
                                    +{dayExams.length - 2} more
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center gap-6 text-sm rounded-b-2xl">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <span className="text-gray-600">Today</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded" />
                    <span className="text-gray-600">Exam Day</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Modal Popup - Outside calendar grid for proper positioning */}
            <AnimatePresence>
              {(clickedExam || hoveredExam) && (
                <>
                  {/* Backdrop - only show for clicked exam */}
                  {clickedExam && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998]"
                      onClick={() => setClickedExam(null)}
                    />
                  )}

                  {/* Popup Modal */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="fixed z-[9999] bg-white rounded-2xl shadow-2xl overflow-hidden"
                    style={{
                      width: "380px",
                      maxWidth: "90vw",
                      maxHeight: "80vh",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Popup Header */}
                    <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-5 py-4">
                      <p className="text-white font-bold text-lg">
                        {(clickedExam || hoveredExam)?.date?.toLocaleDateString(
                          "en-US",
                          {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </p>
                      <p className="text-white/80 text-sm mt-1">
                        {(clickedExam || hoveredExam)?.exams?.length || 0} Exam
                        {((clickedExam || hoveredExam)?.exams?.length || 0) > 1
                          ? "s"
                          : ""}{" "}
                        Scheduled
                      </p>
                    </div>

                    {/* Exam Details */}
                    <div className="p-4 max-h-[50vh] overflow-y-auto">
                      <div className="space-y-4">
                        {(clickedExam || hoveredExam)?.exams?.map((exam, i) => (
                          <div
                            key={i}
                            className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-100"
                          >
                            {/* Course Code Badge */}
                            <div className="flex items-center justify-between mb-2">
                              <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                                {exam.courseCode}
                              </span>
                              {exam.year && (
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                  {exam.year} Year
                                </span>
                              )}
                            </div>

                            {/* Course Name */}
                            <h4 className="text-gray-800 font-semibold text-base mb-3">
                              {exam.courseName}
                            </h4>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {exam.time && (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <FiClock className="text-blue-500" />
                                  <span>{exam.time}</span>
                                </div>
                              )}
                              {exam.duration && (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <FiBook className="text-purple-500" />
                                  <span>{exam.duration}</span>
                                </div>
                              )}
                              {exam.branch && (
                                <div className="col-span-2 flex items-center gap-2 text-gray-600 mt-1">
                                  <FiInfo className="text-green-500" />
                                  <span className="truncate">
                                    {exam.branch}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Popup Footer */}
                    <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 flex justify-between items-center">
                      <p className="text-xs text-gray-500">
                        {clickedExam
                          ? "Click backdrop or button to close"
                          : "Click date to pin popup"}
                      </p>
                      <button
                        onClick={() => {
                          setClickedExam(null);
                          setHoveredExam(null);
                        }}
                        className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-4 py-2 rounded-full text-white font-medium transition-all shadow-md"
                      >
                        Close
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* List View */}
            {viewMode === "list" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {exams.length === 0 ? (
                  <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiCalendar className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      No Exams Scheduled
                    </h3>
                    <p className="text-gray-600">
                      No exams scheduled for {selectedYear} Year -{" "}
                      {selectedBranch}
                    </p>
                  </div>
                ) : (
                  Object.entries(groupedExams).map(
                    ([date, dateExams], index) => (
                      <motion.div
                        key={date}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-3xl shadow-xl overflow-hidden"
                      >
                        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-6 py-4">
                          <h3 className="text-white font-bold text-lg flex items-center gap-2">
                            <FiCalendar />
                            {date}
                          </h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                          {dateExams.map((exam) => (
                            <div
                              key={exam.id}
                              className="p-6 hover:bg-blue-50 transition-colors"
                            >
                              <div className="flex items-start gap-4">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                  <span className="text-white font-bold text-sm text-center px-2">
                                    {exam.courseCode}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <p className="text-gray-800 font-bold text-lg">
                                    {exam.courseName}
                                  </p>
                                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                    {exam.time && (
                                      <span className="flex items-center gap-1">
                                        <FiClock className="text-blue-500" />{" "}
                                        {exam.time}
                                      </span>
                                    )}
                                    {exam.duration && (
                                      <span className="flex items-center gap-1">
                                        <FiBook className="text-purple-500" />{" "}
                                        {exam.duration}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )
                  )
                )}
              </motion.div>
            )}

            {/* Summary Stats */}
            {exams.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <p className="text-gray-500 text-sm">Total Exams</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {exams.length}
                  </p>
                </div>
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <p className="text-gray-500 text-sm">Exam Days</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                    {Object.keys(groupedExams).length}
                  </p>
                </div>
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <p className="text-gray-500 text-sm">Branch</p>
                  <p className="text-xl font-bold text-gray-800 truncate">
                    {selectedBranch.split(" ")[0]}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 bg-gradient-to-r from-blue-100 to-purple-100 rounded-3xl p-6"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-3">
                📝 Important Instructions
              </h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>
                  • Report to the examination hall 15 minutes before the
                  scheduled time
                </li>
                <li>• Carry your college ID card and admit card</li>
                <li>
                  • Mobile phones and electronic devices are strictly prohibited
                </li>
                <li>
                  • Follow all examination guidelines provided by the college
                </li>
              </ul>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExamTimetable;
