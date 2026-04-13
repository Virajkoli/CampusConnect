import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiMail,
  FiShield,
  FiUser,
  FiCheckCircle,
  FiUsers,
  FiUserCheck,
  FiBookOpen,
  FiBell,
  FiSettings,
  FiEdit,
  FiLock,
} from "react-icons/fi";
import { motion } from "framer-motion";

const AdminProfile = ({ userData }) => {
  const navigate = useNavigate();

  const permissions = [
    {
      icon: FiUsers,
      label: "User Management",
      description: "Manage students and accounts",
    },
    {
      icon: FiUserCheck,
      label: "Teacher Management",
      description: "Oversee faculty members",
    },
    {
      icon: FiBookOpen,
      label: "Course Management",
      description: "Handle curriculum & subjects",
    },
    {
      icon: FiBell,
      label: "Announcements",
      description: "Broadcast important updates",
    },
    {
      icon: FiSettings,
      label: "System Configuration",
      description: "Configure platform settings",
    },
  ];

  return (
    <div className="min-h-screen bg-[#eef2f6] px-3 py-5 sm:px-5 sm:py-7 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-6xl"
      >
        <motion.button
          whileHover={{ x: -5 }}
          onClick={() => navigate("/admin-dashboard")}
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
                <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full border-2 border-white bg-emerald-500 shadow" />
              </motion.div>

              <div className="flex-1 text-center md:text-left">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Admin Profile
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-slate-800 sm:text-3xl">
                  {userData?.displayName || userData?.name || "Administrator"}
                </h1>
                <div className="mt-1.5 flex items-center justify-center gap-2 text-xs text-slate-600 sm:text-sm md:justify-start">
                  <FiMail className="h-4 w-4" />
                  <span>{userData?.email}</span>
                </div>
                <div className="mt-3 inline-flex rounded-full bg-[#e9f2ff] px-3 py-1 text-xs font-semibold text-[#1f6fb7]">
                  <span>System Administrator</span>
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
                <FiShield className="h-5 w-5 text-[#2f87d9]" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 sm:text-xl">
                Admin Details
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 sm:p-4">
                <span className="text-sm font-medium text-slate-600">
                  Admin ID
                </span>
                <span className="font-semibold text-slate-800">
                  {userData?.adminId || "ADMIN-001"}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 sm:p-4">
                <span className="text-sm font-medium text-slate-600">Role</span>
                <span className="font-semibold text-slate-800">
                  System Administrator
                </span>
              </div>

              <div className="rounded-xl bg-[#f7fbf1] p-3 sm:p-4">
                <div className="mb-1.5 flex items-center gap-2 text-emerald-700">
                  <FiCheckCircle className="h-4 w-4" />
                  <span className="font-semibold">Full Access Granted</span>
                </div>
                <div className="text-sm text-slate-600">
                  All system permissions active
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
                <FiCheckCircle className="h-5 w-5 text-[#d97706]" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 sm:text-xl">
                Permissions
              </h2>
            </div>

            <div className="custom-scrollbar max-h-80 space-y-3 overflow-y-auto">
              {permissions.map((perm, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="group flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#2f87d9] text-white transition-transform group-hover:scale-110">
                    <perm.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-800">
                      {perm.label}
                    </div>
                    <div className="text-xs text-slate-500 sm:text-sm">
                      {perm.description}
                    </div>
                  </div>
                  <FiCheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                </motion.div>
              ))}
            </div>
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
              className="group rounded-xl border border-slate-200 bg-slate-50 p-4 text-center transition hover:bg-[#f4f8ff] sm:p-5"
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
              onClick={() => navigate("/admin-dashboard")}
              className="group rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-[#f4f8ff] sm:p-5"
            >
              <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-lg bg-[#2f87d9] transition-transform group-hover:scale-110 sm:mb-3 sm:h-11 sm:w-11">
                <FiArrowLeft className="h-5 w-5 text-white" />
              </div>
              <div className="text-sm font-semibold text-slate-800">
                Back to Dashboard
              </div>
              <div className="mt-1 text-xs text-slate-500 sm:text-sm">
                Continue managing system
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

export default AdminProfile;
