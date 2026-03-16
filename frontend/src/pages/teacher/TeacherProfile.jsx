import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import {
  FiArrowLeft,
  FiMail,
  FiBook,
  FiUser,
  FiLogOut,
  FiEdit,
  FiLock,
  FiBriefcase,
} from "react-icons/fi";
import { motion } from "framer-motion";

const TeacherProfile = ({ userData }) => {
  const navigate = useNavigate();
  const assignments =
    Array.isArray(userData?.assignments) && userData.assignments.length > 0
      ? userData.assignments
      : Array.isArray(userData?.assignedCourses)
        ? userData.assignedCourses.map((course) => ({
            branch: userData?.department || userData?.dept || "",
            year: course.year,
            subjects: Array.isArray(course.subjects) ? course.subjects : [],
          }))
        : [];

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#eef2f6] px-3 py-5 sm:px-5 sm:py-7 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-6xl"
      >
        <motion.button
          whileHover={{ x: -5 }}
          onClick={() => navigate("/teacher-dashboard")}
          className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:text-[#2f87d9] sm:px-4 sm:py-2 sm:text-sm"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </motion.button>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm sm:rounded-3xl"
        >
          <div className="h-20 bg-white sm:h-24" />

          <div className="relative -mt-10 px-3 pb-4 sm:-mt-12 sm:px-5 sm:pb-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative self-center md:self-auto"
              >
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#2f87d9] shadow-lg sm:h-24 sm:w-24">
                  {userData?.photoURL ? (
                    <img
                      src={userData.photoURL}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FiUser className="h-10 w-10 text-white" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full border-2 border-white bg-emerald-500 shadow"></div>
              </motion.div>

              <div className="flex-1 text-center md:text-left">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Teacher Profile
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-slate-800 sm:text-3xl">
                  {userData?.displayName || userData?.name || "Teacher"}
                </h1>
                <div className="mt-1.5 flex items-center justify-center gap-2 text-xs text-slate-600 sm:text-sm md:justify-start">
                  <FiMail className="h-4 w-4" />
                  <span>{userData?.email}</span>
                </div>
                <div className="mt-3 inline-flex rounded-full bg-[#e9f2ff] px-3 py-1 text-xs font-semibold text-[#1f6fb7]">
                  <span>Teacher Account</span>
                </div>
              </div>

              <div className="flex w-full md:w-auto">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/edit-profile")}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2f87d9] px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-[#1f6fb7] sm:px-5 sm:py-2.5 sm:text-sm md:w-auto"
                >
                  <FiEdit className="h-4 w-4" />
                  Edit Profile
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mb-5 grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5"
          >
            <div className="mb-4 flex items-center gap-2.5 sm:mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e9f2ff] sm:h-10 sm:w-10">
                <FiBriefcase className="h-5 w-5 text-[#2f87d9]" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 sm:text-xl">
                Professional Details
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 sm:p-4">
                <span className="text-sm font-medium text-slate-600">
                  Teacher ID
                </span>
                <span className="font-semibold text-slate-800">
                  {userData?.teacherId ||
                    userData?.employeeId ||
                    "Not assigned"}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 sm:p-4">
                <span className="text-sm font-medium text-slate-600">
                  Department
                </span>
                <span className="font-semibold text-slate-800">
                  {userData?.department || userData?.dept || "Not assigned"}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 sm:p-4">
                <span className="text-sm font-medium text-slate-600">
                  Job Profile
                </span>
                <span className="font-semibold text-slate-800">
                  {userData?.jobProfile || "Not assigned"}
                </span>
              </div>

              <div className="rounded-xl bg-[#f4f8ff] p-3 text-center sm:p-4">
                <div className="mb-1 text-xs text-slate-600 sm:text-sm">
                  Total Courses
                </div>
                <div className="text-xl font-semibold text-slate-800 sm:text-2xl">
                  {assignments.length}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5"
          >
            <div className="mb-4 flex items-center gap-2.5 sm:mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff8ef] sm:h-10 sm:w-10">
                <FiBook className="h-5 w-5 text-[#d97706]" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 sm:text-xl">
                Assigned Courses
              </h2>
            </div>

            {assignments.length > 0 ? (
              <div className="custom-scrollbar max-h-80 space-y-3 overflow-y-auto">
                {assignments.map((course, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + idx * 0.05 }}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="mb-2 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2f87d9] text-sm font-semibold text-white">
                        {course.year}
                      </div>
                      <h3 className="font-semibold text-slate-800">
                        {course.branch || "Branch"} - Year {course.year}
                      </h3>
                    </div>
                    <div className="space-y-1.5 pl-12">
                      {course.subjects.map((subject, sidx) => (
                        <div
                          key={sidx}
                          className="flex items-center gap-2 text-sm text-slate-700"
                        >
                          <div className="h-2 w-2 rounded-full bg-[#2f87d9]"></div>
                          <span>{subject}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                  <FiBook className="h-10 w-10 text-slate-400" />
                </div>
                <p className="text-slate-500">No courses assigned yet</p>
              </div>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5"
        >
          <h2 className="mb-4 text-lg font-semibold text-slate-800 sm:mb-5 sm:text-xl">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/edit-profile")}
              className="group rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-[#f4f8ff] sm:p-5"
            >
              <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-lg bg-[#2f87d9] transition-transform group-hover:scale-110 sm:mb-3 sm:h-11 sm:w-11">
                <FiEdit className="h-5 w-5 text-white" />
              </div>
              <div className="text-sm font-semibold text-slate-800">
                Edit Profile
              </div>
              <div className="mt-1 text-xs text-slate-500 sm:text-sm">
                Update your details
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/change-password")}
              className="group rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-[#f4f8ff] sm:p-5"
            >
              <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-lg bg-[#2f87d9] transition-transform group-hover:scale-110 sm:mb-3 sm:h-11 sm:w-11">
                <FiLock className="h-5 w-5 text-white" />
              </div>
              <div className="text-sm font-semibold text-slate-800">
                Change Password
              </div>
              <div className="mt-1 text-xs text-slate-500 sm:text-sm">
                Secure your account
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="group rounded-xl border border-red-100 bg-red-50 p-4 transition hover:bg-red-100 sm:p-5"
            >
              <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-lg bg-red-500 transition-transform group-hover:scale-110 sm:mb-3 sm:h-11 sm:w-11">
                <FiLogOut className="h-5 w-5 text-white" />
              </div>
              <div className="text-sm font-semibold text-slate-800">Logout</div>
              <div className="mt-1 text-xs text-slate-500 sm:text-sm">
                Sign out safely
              </div>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #60a5fa, #3b82f6);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default TeacherProfile;
