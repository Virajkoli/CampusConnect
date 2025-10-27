import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import {
  FiArrowLeft,
  FiMail,
  FiBook,
  FiUsers,
  FiUser,
  FiLogOut,
  FiEdit,
  FiLock,
  FiBriefcase,
} from "react-icons/fi";
import { motion } from "framer-motion";

const TeacherProfile = ({ userData }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        {/* Back Button */}
        <motion.button
          whileHover={{ x: -5 }}
          onClick={() => navigate("/teacher-dashboard")}
          className="flex items-center mb-6 text-gray-700 hover:text-green-600 transition-colors font-medium group"
        >
          <FiArrowLeft className="mr-2 group-hover:animate-pulse" />
          Back to Dashboard
        </motion.button>

        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6"
        >
          {/* Cover with Gradient */}
          <div className="h-32 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 relative">
            <div className="absolute inset-0 bg-black opacity-10"></div>
          </div>

          {/* Profile Info */}
          <div className="px-8 pb-8 -mt-16 relative">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
              {/* Avatar with Ring */}
              <motion.div whileHover={{ scale: 1.05 }} className="relative">
                <div className="w-32 h-32 rounded-full ring-4 ring-white shadow-xl overflow-hidden bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                  {userData?.photoURL ? (
                    <img
                      src={userData.photoURL}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FiUser className="w-16 h-16 text-white" />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg">
                  👨‍🏫
                </div>
              </motion.div>

              {/* Name and Email */}
              <div className="flex-1 text-center md:text-left mb-4 md:mb-0">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                  {userData?.displayName || userData?.name || "Teacher"}
                </h1>
                <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600">
                  <FiMail className="w-4 h-4" />
                  <span>{userData?.email}</span>
                </div>
                <div className="mt-3 inline-block px-4 py-1 bg-gradient-to-r from-green-100 to-blue-100 rounded-full">
                  <span className="text-green-700 font-semibold text-sm">
                    Teacher Account
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/edit-profile")}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <FiEdit className="w-4 h-4" />
                  Edit Profile
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Professional Info Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                <FiBriefcase className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                Professional Details
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl">
                <span className="text-gray-600 font-medium">Employee ID</span>
                <span className="text-gray-800 font-semibold">
                  {userData?.employeeId || "Not assigned"}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                <span className="text-gray-600 font-medium">Department</span>
                <span className="text-gray-800 font-semibold">
                  {userData?.dept || "Not assigned"}
                </span>
              </div>

              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                <div className="text-gray-600 text-sm mb-2">Total Courses</div>
                <div className="text-3xl font-bold text-green-600">
                  {userData?.assignedCourses?.length || 0}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Assigned Courses Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <FiBook className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                Assigned Courses
              </h2>
            </div>

            {userData?.assignedCourses &&
            userData.assignedCourses.length > 0 ? (
              <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar">
                {userData.assignedCourses.map((course, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + idx * 0.05 }}
                    className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                        {course.year}
                      </div>
                      <h3 className="font-bold text-gray-800">
                        Year {course.year}
                      </h3>
                    </div>
                    <div className="space-y-2 pl-13">
                      {course.subjects.map((subject, sidx) => (
                        <div key={sidx} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                          <span className="text-gray-700">{subject}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiBook className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-500">No courses assigned yet</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/edit-profile")}
              className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <FiEdit className="w-6 h-6 text-white" />
              </div>
              <div className="text-gray-800 font-semibold">Edit Profile</div>
              <div className="text-gray-500 text-sm mt-1">
                Update your details
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/change-password")}
              className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <FiLock className="w-6 h-6 text-white" />
              </div>
              <div className="text-gray-800 font-semibold">Change Password</div>
              <div className="text-gray-500 text-sm mt-1">
                Secure your account
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-xl hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <FiLogOut className="w-6 h-6 text-white" />
              </div>
              <div className="text-gray-800 font-semibold">Logout</div>
              <div className="text-gray-500 text-sm mt-1">Sign out safely</div>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default TeacherProfile;
