import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firestore, auth } from "../../firebase";
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
  const [userRole, setUserRole] = useState("student");
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
        if (token.claims.admin) {
          setUserRole("admin");
          return;
        }
        if (token.claims.teacher) {
          setUserRole("teacher");
          // If user is a teacher, redirect to chat page directly
          navigate("/chat");
        } else {
          setUserRole("student");
        }
      }
    };

    checkUserRole();
  }, [user, navigate]);

  const dashboardPath =
    userRole === "teacher"
      ? "/teacher-dashboard"
      : userRole === "admin"
        ? "/admin-dashboard"
        : "/student-dashboard";

  const fetchTeachersByBranch = async (branch) => {
    setLoading(true);
    try {
      const teachersQuery = query(
        collection(firestore, "teachers"),
        where("dept", "==", branch),
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
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#eef2f6]">
      <div className="mx-auto max-w-6xl px-3 py-5 sm:px-5 sm:py-7 lg:px-8">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(dashboardPath)}
          className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:text-[#2f87d9] sm:px-4 sm:py-2 sm:text-sm"
        >
          <FiArrowLeft className="h-4 w-4" />
          <span className="font-medium">Back to Dashboard</span>
        </motion.button>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mb-6 text-center sm:mb-7"
        >
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-[#e9f2ff] sm:h-16 sm:w-16">
            <FaChalkboardTeacher className="text-2xl text-[#2f87d9] sm:text-3xl" />
          </div>

          <h1 className="mb-2 text-2xl font-semibold text-slate-800 sm:text-3xl">
            Connect with Teachers
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-slate-600 sm:text-base">
            Find and chat with faculty members from your department
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-auto max-w-5xl rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6"
        >
          <div className="mb-5">
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700 sm:text-base">
              <FiFilter className="text-[#2f87d9]" />
              Select Your Department
            </label>
            <div className="relative">
              <select
                value={selectedBranch}
                onChange={handleBranchChange}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-[#2f87d9] focus:border-[#2f87d9] focus:outline-none focus:ring-2 focus:ring-[#cfe5ff]"
              >
                <option value="">Choose your department...</option>
                {branches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                <svg
                  className="h-4 w-4 text-slate-400"
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

          <AnimatePresence>
            {teachers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search teachers by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 focus:border-[#2f87d9] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#cfe5ff]"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-14"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="mb-4 h-12 w-12 rounded-full border-4 border-[#2f87d9] border-t-transparent"
              />
              <p className="text-sm font-medium text-slate-600 sm:text-base">
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
                  className="space-y-3"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-base font-semibold text-slate-700">
                      <FiUsers className="text-[#2f87d9]" />
                      Available Teachers ({filteredTeachers.length})
                    </h2>
                  </div>

                  <div className="grid gap-3">
                    {filteredTeachers.map((teacher, index) => (
                      <motion.div
                        key={teacher.id}
                        variants={scaleIn}
                        whileHover={{ y: -3 }}
                        className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-[#bfdbfe] hover:bg-white sm:p-4"
                      >
                        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                          <motion.div
                            whileHover={{ scale: 1.04 }}
                            className="relative"
                          >
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2f87d9] text-lg font-semibold text-white shadow-sm sm:h-14 sm:w-14 sm:text-xl">
                              {teacher.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-400"></div>
                          </motion.div>

                          <div className="flex-1 min-w-0">
                            <h3 className="mb-1 text-base font-semibold text-slate-800 transition-colors group-hover:text-[#2f87d9]">
                              {teacher.name}
                            </h3>
                            <div className="mb-1 flex items-center gap-2 text-slate-600">
                              <FiMail className="text-xs" />
                              <p className="text-xs break-all sm:text-sm">
                                {teacher.email}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500">
                              <FiBookOpen className="text-xs" />
                              <p className="text-xs sm:text-sm">
                                {selectedBranch}
                              </p>
                            </div>
                          </div>

                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleChatInitiation(teacher)}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2f87d9] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#1f6fb7] sm:w-auto sm:text-sm"
                          >
                            <FiMessageCircle className="text-base" />
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
                    className="py-14 text-center"
                  >
                    <div className="mb-4 text-5xl">🔍</div>
                    <h3 className="mb-2 text-xl font-semibold text-slate-700">
                      No Results Found
                    </h3>
                    <p className="mb-5 text-sm text-slate-500">
                      No teachers match "{searchTerm}"
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSearchTerm("")}
                      className="rounded-xl bg-[#2f87d9] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1f6fb7]"
                    >
                      Clear Search
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-14 text-center"
                  >
                    <div className="mb-4 text-5xl">👨‍🏫</div>
                    <h3 className="mb-2 text-xl font-semibold text-slate-700">
                      No Teachers Available
                    </h3>
                    <p className="text-sm text-slate-500">
                      No teachers found in {selectedBranch}
                    </p>
                  </motion.div>
                )
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-14 text-center"
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="mb-4 text-6xl"
                  >
                    🎓
                  </motion.div>
                  <h3 className="mb-2 text-xl font-semibold text-slate-700">
                    Choose Your Department
                  </h3>
                  <p className="mb-6 text-sm text-slate-500">
                    Select a department above to discover amazing teachers
                  </p>

                  <div className="mx-auto mt-6 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-[#f4f8ff] p-3">
                      <FaComments className="mx-auto mb-2 text-2xl text-[#2f87d9]" />
                      <p className="text-xs font-semibold text-[#1f6fb7] sm:text-sm">
                        Direct Chat
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#f4f8ff] p-3">
                      <FaRocket className="mx-auto mb-2 text-2xl text-[#2f87d9]" />
                      <p className="text-xs font-semibold text-[#1f6fb7] sm:text-sm">
                        Instant Connect
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#f4f8ff] p-3">
                      <FaGraduationCap className="mx-auto mb-2 text-2xl text-[#2f87d9]" />
                      <p className="text-xs font-semibold text-[#1f6fb7] sm:text-sm">
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
