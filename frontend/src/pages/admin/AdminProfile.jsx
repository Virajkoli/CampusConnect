import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiMail,
  FiShield,
  FiUser,
  FiCheckCircle,
} from "react-icons/fi";
import { motion } from "framer-motion";

const AdminProfile = ({ userData }) => {
  const navigate = useNavigate();

  const permissions = [
    {
      icon: "👥",
      label: "User Management",
      description: "Manage students and accounts",
    },
    {
      icon: "👨‍🏫",
      label: "Teacher Management",
      description: "Oversee faculty members",
    },
    {
      icon: "📚",
      label: "Course Management",
      description: "Handle curriculum & subjects",
    },
    {
      icon: "📢",
      label: "Announcements",
      description: "Broadcast important updates",
    },
    {
      icon: "⚙️",
      label: "System Configuration",
      description: "Configure platform settings",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        {/* Back Button */}
        <motion.button
          whileHover={{ x: -5 }}
          onClick={() => navigate("/admin-dashboard")}
          className="flex items-center mb-6 text-gray-700 hover:text-purple-600 transition-colors font-medium group"
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
          <div className="h-32 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 relative">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <FiShield className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="px-8 pb-8 -mt-16 relative">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
              {/* Avatar with Ring */}
              <motion.div whileHover={{ scale: 1.05 }} className="relative">
                <div className="w-32 h-32 rounded-full ring-4 ring-white shadow-xl overflow-hidden bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
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
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg">
                  👑
                </div>
              </motion.div>

              {/* Name and Email */}
              <div className="flex-1 text-center md:text-left mb-4 md:mb-0">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                  {userData?.displayName || userData?.name || "Administrator"}
                </h1>
                <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600 mb-3">
                  <FiMail className="w-4 h-4" />
                  <span>{userData?.email}</span>
                </div>
                <div className="inline-block px-4 py-1 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
                  <span className="text-purple-700 font-semibold text-sm">
                    System Administrator
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Admin Details Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <FiShield className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Admin Details</h2>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                <span className="text-gray-600 font-medium">Admin ID</span>
                <span className="text-gray-800 font-semibold">
                  {userData?.adminId || "ADMIN-001"}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-pink-50 to-blue-50 rounded-xl">
                <span className="text-gray-600 font-medium">Role</span>
                <span className="text-gray-800 font-semibold">
                  System Administrator
                </span>
              </div>

              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <FiCheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Full Access Granted</span>
                </div>
                <div className="text-gray-600 text-sm">
                  All system permissions active
                </div>
              </div>
            </div>
          </motion.div>

          {/* Permissions Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <FiCheckCircle className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Permissions</h2>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
              {permissions.map((perm, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform flex-shrink-0">
                    {perm.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-gray-800 font-semibold">
                      {perm.label}
                    </div>
                    <div className="text-gray-500 text-sm">
                      {perm.description}
                    </div>
                  </div>
                  <FiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            Platform Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl text-center"
            >
              <div className="text-3xl mb-2">👥</div>
              <div className="text-2xl font-bold text-blue-600">1,250</div>
              <div className="text-gray-600 text-sm">Total Students</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl text-center"
            >
              <div className="text-3xl mb-2">👨‍🏫</div>
              <div className="text-2xl font-bold text-green-600">85</div>
              <div className="text-gray-600 text-sm">Teachers</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl text-center"
            >
              <div className="text-3xl mb-2">📚</div>
              <div className="text-2xl font-bold text-purple-600">42</div>
              <div className="text-gray-600 text-sm">Active Courses</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="p-6 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl text-center"
            >
              <div className="text-3xl mb-2">📢</div>
              <div className="text-2xl font-bold text-pink-600">156</div>
              <div className="text-gray-600 text-sm">Announcements</div>
            </motion.div>
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
          background: linear-gradient(to bottom, #a855f7, #ec4899);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default AdminProfile;
