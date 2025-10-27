import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firestore, auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft,
  FiSearch,
  FiMail,
  FiMessageCircle,
  FiBookOpen,
  FiUsers,
  FiFilter,
} from "react-icons/fi";
import {
  FaGraduationCap,
  FaChalkboardTeacher,
  FaComments,
  FaRocket,
} from "react-icons/fa";

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
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const scaleIn = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.4 },
    },
  };

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

  // Filter teachers by search term
  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-purple-300 rounded-full filter blur-3xl opacity-20 animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-300 rounded-full filter blur-3xl opacity-10 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/student-dashboard")}
          className="flex items-center gap-2 mb-6 px-6 py-3 bg-white text-gray-700 rounded-full shadow-lg hover:shadow-xl transition-all backdrop-blur-sm border border-gray-100 group"
        >
          <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Dashboard</span>
        </motion.button>

        {/* Header Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="inline-block mb-4"
          >
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
              <FaChalkboardTeacher className="text-white text-4xl" />
            </div>
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Connect with Teachers
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find and chat with faculty members from your department
          </p>
        </motion.div>

        {/* Main Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-gray-100 max-w-5xl mx-auto"
        >
          {/* Department Selection */}
          <div className="mb-8">
            <label className="flex items-center gap-2 text-gray-700 font-semibold mb-3 text-lg">
              <FiFilter className="text-purple-600" />
              Select Your Department
            </label>
            <div className="relative">
              <select
                value={selectedBranch}
                onChange={handleBranchChange}
                className="w-full appearance-none border-2 border-gray-200 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm text-gray-700 font-medium cursor-pointer transition-all hover:border-purple-300"
              >
                <option value="">🎓 Choose your department...</option>
                {branches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Search Bar (shown when teachers are loaded) */}
          <AnimatePresence>
            {teachers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <div className="relative">
                  <FiSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                  <input
                    type="text"
                    placeholder="Search teachers by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 rounded-2xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none transition-colors bg-gray-50 focus:bg-white shadow-sm"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mb-6"
              />
              <p className="text-gray-600 text-lg font-medium">
                Finding amazing teachers...
              </p>
            </motion.div>
          ) : (
            <div>
              {filteredTeachers.length > 0 ? (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainer}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                      <FiUsers className="text-purple-600" />
                      Available Teachers ({filteredTeachers.length})
                    </h2>
                  </div>

                  <div className="grid gap-4">
                    {filteredTeachers.map((teacher, index) => (
                      <motion.div
                        key={teacher.id}
                        variants={scaleIn}
                        whileHover={{ scale: 1.02, y: -5 }}
                        className="group relative bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl border-2 border-gray-100 hover:border-purple-300 transition-all shadow-md hover:shadow-xl overflow-hidden"
                      >
                        {/* Gradient Overlay on Hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <div className="relative z-10 flex items-center gap-6">
                          {/* Avatar */}
                          <motion.div
                            whileHover={{ rotate: 360, scale: 1.1 }}
                            transition={{ duration: 0.5 }}
                            className="relative"
                          >
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                              {teacher.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 border-2 border-white rounded-full"></div>
                          </motion.div>

                          {/* Teacher Info */}
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-purple-600 transition-colors">
                              {teacher.name}
                            </h3>
                            <div className="flex items-center gap-2 text-gray-600 mb-2">
                              <FiMail className="text-sm" />
                              <p className="text-sm">{teacher.email}</p>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500">
                              <FiBookOpen className="text-sm" />
                              <p className="text-sm">{selectedBranch}</p>
                            </div>
                          </div>

                          {/* Action Button */}
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleChatInitiation(teacher)}
                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-3 group-hover:from-purple-600 group-hover:to-pink-600"
                          >
                            <FiMessageCircle className="text-xl" />
                            <span>Start Chat</span>
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : selectedBranch ? (
                searchTerm ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-20"
                  >
                    <div className="text-7xl mb-6">🔍</div>
                    <h3 className="text-2xl font-bold text-gray-700 mb-2">
                      No Results Found
                    </h3>
                    <p className="text-gray-500 mb-6">
                      No teachers match "{searchTerm}"
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSearchTerm("")}
                      className="px-6 py-3 bg-purple-600 text-white rounded-full font-semibold shadow-lg hover:bg-purple-700 transition-colors"
                    >
                      Clear Search
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-20"
                  >
                    <div className="text-7xl mb-6">👨‍🏫</div>
                    <h3 className="text-2xl font-bold text-gray-700 mb-2">
                      No Teachers Available
                    </h3>
                    <p className="text-gray-500">
                      No teachers found in {selectedBranch}
                    </p>
                  </motion.div>
                )
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20"
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-8xl mb-6"
                  >
                    🎓
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-700 mb-2">
                    Choose Your Department
                  </h3>
                  <p className="text-gray-500 mb-8">
                    Select a department above to discover amazing teachers
                  </p>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mt-8">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-2xl">
                      <FaComments className="text-3xl text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-blue-800">
                        Direct Chat
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-2xl">
                      <FaRocket className="text-3xl text-purple-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-purple-800">
                        Instant Connect
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-2xl">
                      <FaGraduationCap className="text-3xl text-pink-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-pink-800">
                        Expert Guidance
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default Discussions;
