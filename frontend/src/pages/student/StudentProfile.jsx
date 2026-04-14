import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import {
  FiArrowLeft,
  FiMail,
  FiBook,
  FiAward,
  FiCalendar,
  FiUser,
  FiLogOut,
  FiEdit,
  FiLock,
  FiCheckCircle,
  FiClock,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import StudentQRDisplay from "../../components/student/StudentQRDisplay";
import FingerprintVerification from "../../components/student/FingerprintVerification";
import FaceRegistration from "../../components/student/FaceRegistration";
import { getFaceProfileStatus } from "../../services/attendanceService";
import {
  clearOneTimePasskey,
  createOneTimePasskey,
  getOneTimePasskey,
} from "../../utils/biometricPasskey";

const StudentProfile = ({ userData }) => {
  const navigate = useNavigate();
  const [oneTimePasskey, setOneTimePasskey] = useState(null);
  const [faceRegistered, setFaceRegistered] = useState(false);
  const [faceStatusLoading, setFaceStatusLoading] = useState(true);

  const refreshFaceStatus = useCallback(async () => {
    try {
      setFaceStatusLoading(true);
      const result = await getFaceProfileStatus();
      setFaceRegistered(Boolean(result?.registered));
    } catch {
      setFaceRegistered(false);
    } finally {
      setFaceStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    setOneTimePasskey(getOneTimePasskey(auth.currentUser?.uid || ""));
    refreshFaceStatus();
  }, [refreshFaceStatus]);

  const passkeyCreatedLabel = useMemo(() => {
    const createdAt = Number(oneTimePasskey?.createdAt || 0);
    if (!createdAt) {
      return "";
    }

    const parsed = new Date(createdAt);
    if (Number.isNaN(parsed.getTime())) {
      return "";
    }

    return parsed.toLocaleString();
  }, [oneTimePasskey]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  //Initial transitions need to be added rather than typical one.
  return (
    <div className="min-h-screen bg-[#eef2f6] px-3 py-5 sm:px-5 sm:py-7 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-6xl"
      >
        <motion.button
          whileHover={{ x: -5 }}
          onClick={() => navigate("/student-dashboard")}
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
          <div className="h-20 bg-white sm:h-20" />

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
                <p className="text-xs uppercase tracking-[0.2em] text-slate-900">
                  Heyy,
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-slate-800 sm:text-3xl">
                  {userData?.displayName || "Student"}
                </h1>
                <div className="mt-1.5 flex items-center justify-center gap-2 text-xs text-slate-600 sm:text-sm md:justify-start">
                  <FiMail className="h-4 w-4" />
                  <span>{userData?.email}</span>
                </div>
                <div className="mt-3 inline-flex rounded-full bg-[#e9f2ff] px-3 py-1 text-xs font-semibold text-[#1f6fb7]">
                  <span>Student Account</span>
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
                <FiBook className="h-5 w-5 text-[#2f87d9]" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 sm:text-xl">
                Academic Details
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 sm:p-4">
                <span className="text-sm font-medium text-slate-600">
                  Roll Number
                </span>
                <span className="font-semibold text-slate-800">
                  {userData?.rollNumber || "Not assigned"}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 sm:p-4">
                <span className="text-sm font-medium text-slate-600">
                  Department
                </span>
                <span className="font-semibold text-slate-800">
                  {userData?.dept || "Not assigned"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-[#f4f8ff] p-3 text-center sm:p-4">
                  <div className="mb-1 text-xs text-slate-600 sm:text-sm">
                    Year
                  </div>
                  <div className="text-xl font-semibold text-slate-800 sm:text-2xl">
                    {userData?.year || "-"}
                  </div>
                </div>
                <div className="rounded-xl bg-[#f7fbf1] p-3 text-center sm:p-4">
                  <div className="mb-1 text-xs text-slate-600 sm:text-sm">
                    Semester
                  </div>
                  <div className="text-xl font-semibold text-slate-800 sm:text-2xl">
                    {userData?.semester || "-"}
                  </div>
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
                <FiAward className="h-5 w-5 text-[#d97706]" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 sm:text-xl">
                Enrolled Subjects
              </h2>
            </div>

            {userData?.subjects && userData.subjects.length > 0 ? (
              <div className="custom-scrollbar max-h-64 space-y-3 overflow-y-auto">
                {userData.subjects.map((subject, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="group flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 transition"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2f87d9] text-sm font-semibold text-white transition-transform group-hover:scale-110">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      {subject}
                    </span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                  <FiBook className="h-10 w-10 text-slate-400" />
                </div>
                <p className="text-slate-500">No subjects assigned yet</p>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5"
          >
            <div className="mb-4 flex items-center gap-2.5 sm:mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f4f8ff] sm:h-10 sm:w-10">
                <FiCalendar className="h-5 w-5 text-[#2f87d9]" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 sm:text-xl">
                Attendance Backup QR
              </h2>
            </div>

            <StudentQRDisplay
              studentInfo={{
                ...userData,
                uid: userData?.uid || auth.currentUser?.uid || "",
              }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5"
          >
            <div className="mb-3 flex items-center gap-2.5 sm:mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f7fbf1] sm:h-10 sm:w-10">
                <FiCheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 sm:text-xl">
                Attendance Passkey
              </h2>
            </div>

            <FingerprintVerification
              actionLabel="Create Attendance Passkey"
              onVerified={(data) => {
                if (!data?.biometricVerified || !data?.assertionId) {
                  setOneTimePasskey(null);
                  return;
                }

                const generated = createOneTimePasskey(
                  data.assertionId,
                  auth.currentUser?.uid || userData?.uid || "",
                );
                setOneTimePasskey(generated);
              }}
            />

            {oneTimePasskey ? (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                <p className="font-semibold">Passkey saved on this device.</p>
                <p className="mt-1 break-all">
                  Assertion ID: {oneTimePasskey.assertionId}
                </p>
                {passkeyCreatedLabel ? (
                  <p className="mt-1 flex items-center gap-1">
                    <FiClock className="h-3.5 w-3.5" />
                    Created: {passkeyCreatedLabel}
                  </p>
                ) : null}
                <p className="mt-1">
                  This one-time passkey is consumed after one successful
                  attendance mark.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    clearOneTimePasskey();
                    setOneTimePasskey(null);
                  }}
                  className="mt-2 rounded-md border border-emerald-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700"
                >
                  Clear Saved Passkey
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => navigate("/student-attendance")}
              className="mt-4 w-full rounded-lg bg-[#2f87d9] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#1f6fb7] sm:text-sm"
            >
              Continue to Attendance
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5"
          >
            <div className="mb-3 flex items-center gap-2.5 sm:mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef8ff] sm:h-10 sm:w-10">
                <FiCheckCircle className="h-5 w-5 text-[#2f87d9]" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 sm:text-xl">
                Face Registration
              </h2>
            </div>

            <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              Status:{" "}
              {faceStatusLoading
                ? "Checking..."
                : faceRegistered
                  ? "Registered"
                  : "Not Registered"}
            </div>

            {!faceRegistered ? (
              <FaceRegistration
                studentId={auth.currentUser?.uid || userData?.uid || ""}
                onRegistered={refreshFaceStatus}
              />
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                Face profile is already registered. You can directly use face
                verification during attendance sessions.
              </div>
            )}

            <button
              type="button"
              onClick={refreshFaceStatus}
              disabled={faceStatusLoading}
              className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 disabled:opacity-60 sm:text-sm"
            >
              {faceStatusLoading ? "Refreshing..." : "Refresh Face Status"}
            </button>
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              onClick={() => navigate("/student-attendance")}
              className="group rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-[#f4f8ff] sm:p-5"
            >
              <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-lg bg-[#2f87d9] transition-transform group-hover:scale-110 sm:mb-3 sm:h-11 sm:w-11">
                <FiCalendar className="h-5 w-5 text-white" />
              </div>
              <div className="text-sm font-semibold text-slate-800">
                Attendance
              </div>
              <div className="mt-1 text-xs text-slate-500 sm:text-sm">
                Mark and view attendance
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

export default StudentProfile;
