import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  getDocs,
} from "firebase/firestore";
import { db, auth, firestore } from "../firebase";
import { motion } from "framer-motion";
import {
  FiCalendar,
  FiClock,
  FiBook,
  FiMapPin,
  FiArrowLeft,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";

const ExamTimetable = () => {
  const [examSchedule, setExamSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");
  const [userYear, setUserYear] = useState(null);
  const navigate = useNavigate();
  const [user] = useAuthState(auth);

  const branches = [
    "All",
    "Civil",
    "Computer",
    "Electrical",
    "E&TC",
    "Instrumentation",
    "Mechanical",
  ];

  const years = ["All", "1st", "2nd", "3rd", "4th"];

  useEffect(() => {
    // Fetch user's year from their profile
    const fetchUserYear = async () => {
      if (user) {
        try {
          const q = query(
            collection(firestore, "users"),
            where("uid", "==", user.uid)
          );
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            const year = userData.year || null;
            setUserYear(year);
            // Auto-filter by user's year if available
            if (year) {
              setSelectedYear(year);
            }
          }
        } catch (error) {
          console.error("Error fetching user year:", error);
        }
      }
    };

    fetchUserYear();
  }, [user]);

  useEffect(() => {
    const q = query(collection(db, "examTimetable"), orderBy("date", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const exams = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setExamSchedule(exams);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredExams = examSchedule.filter((exam) => {
    const branchMatch =
      selectedBranch === "All" || exam.branch === selectedBranch;
    const yearMatch = selectedYear === "All" || exam.year === selectedYear;
    return branchMatch && yearMatch;
  });

  // Group exams by date
  const groupedExams = filteredExams.reduce((acc, exam) => {
    const date = exam.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(exam);
    return acc;
  }, {});

  const formatDate = (dateString) => {
    const [day, date] = dateString.split(",");
    return { day: day.trim(), date: date.trim() };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading exam schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium mb-6 group"
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
                  December 2025 Examination Schedule
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="mt-6 space-y-4">
              {/* Year Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Filter by Year{" "}
                  {userYear && (
                    <span className="text-blue-600">
                      (Your Year: {userYear})
                    </span>
                  )}
                </label>
                <div className="flex flex-wrap gap-2">
                  {years.map((year) => (
                    <motion.button
                      key={year}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedYear(year)}
                      className={`px-4 py-2 rounded-xl font-medium transition-all ${
                        selectedYear === year
                          ? "bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {year}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Branch Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Filter by Branch
                </label>
                <div className="flex flex-wrap gap-2">
                  {branches.map((branch) => (
                    <motion.button
                      key={branch}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedBranch(branch)}
                      className={`px-4 py-2 rounded-xl font-medium transition-all ${
                        selectedBranch === branch
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {branch}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Exam Schedule */}
        {Object.keys(groupedExams).length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-lg p-12 text-center"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCalendar className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              No Exams Scheduled
            </h3>
            <p className="text-gray-600">
              {selectedBranch === "All"
                ? "No exam schedule available yet."
                : `No exams scheduled for ${selectedBranch} branch.`}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedExams).map(([date, exams], index) => {
              const { day, date: dateStr } = formatDate(date);

              return (
                <motion.div
                  key={date}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-3xl shadow-xl overflow-hidden"
                >
                  {/* Date Header */}
                  <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                        <FiCalendar className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-white">
                        <h2 className="text-3xl font-bold">{day}</h2>
                        <p className="text-lg text-white/90">{dateStr}</p>
                        <p className="text-sm text-white/80">
                          11:00am - 2:00pm
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Exams List */}
                  <div className="p-6">
                    <div className="grid gap-4">
                      {exams.map((exam, examIndex) => (
                        <motion.div
                          key={exam.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 + examIndex * 0.05 }}
                          className="flex items-start gap-4 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl hover:shadow-lg transition-all group"
                        >
                          {/* Branch Badge */}
                          <div className="flex-shrink-0">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <span className="text-white font-bold text-sm text-center px-2">
                                {exam.branch}
                              </span>
                            </div>
                          </div>

                          {/* Exam Details */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-xl font-bold text-gray-800">
                                    {exam.courseCode}
                                  </h3>
                                  {exam.year && (
                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                      {exam.year} Year
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-600 font-medium">
                                  {exam.courseName}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <FiClock className="w-4 h-4 text-blue-500" />
                                <span>11:00am - 2:00pm</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FiBook className="w-4 h-4 text-purple-500" />
                                <span>Duration: 3 hours</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
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
              • Report to the examination hall 15 minutes before the scheduled
              time
            </li>
            <li>• Carry your college ID card and admit card</li>
            <li>
              • Mobile phones and electronic devices are strictly prohibited
            </li>
            <li>• Follow all examination guidelines provided by the college</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default ExamTimetable;
