import { useState } from "react";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowLeft,
  FiCheck,
  FiAlertCircle,
} from "react-icons/fi";

function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      setError("User not authenticated.");
      return;
    }

    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword,
      );
      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, newPassword);

      setSuccess("Password updated successfully! Redirecting to login...");

      // ✅ Optional: Logout after password update
      setTimeout(async () => {
        await auth.signOut();
        navigate("/login");
      }, 2000);
    } catch (err) {
      setLoading(false);
      if (err.code === "auth/wrong-password") {
        setError("Current password is incorrect.");
      } else if (err.code === "auth/weak-password") {
        setError("New password is too weak.");
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#eef2f6] px-3 py-6 sm:px-5 sm:py-8 lg:px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6"
      >
        <div className="mb-6 text-center sm:mb-7">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-[#e9f2ff] sm:h-16 sm:w-16">
            <FiLock className="h-7 w-7 text-[#2f87d9] sm:h-8 sm:w-8" />
          </div>
          <h2 className="mb-1 text-2xl font-semibold text-slate-800 sm:text-3xl">
            Change Password
          </h2>
          <p className="text-sm text-slate-600">Keep your account secure</p>
        </div>

        <form
          onSubmit={handleChangePassword}
          className="space-y-4 sm:space-y-5"
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FiLock className="h-4 w-4 text-[#2f87d9]" />
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                placeholder="Enter current password"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 pr-10 text-sm text-slate-800 focus:border-[#2f87d9] focus:outline-none focus:ring-2 focus:ring-[#cfe5ff]"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrent ? (
                  <FiEyeOff className="h-4 w-4" />
                ) : (
                  <FiEye className="h-4 w-4" />
                )}
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FiLock className="h-4 w-4 text-[#2f87d9]" />
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                placeholder="Enter new password"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 pr-10 text-sm text-slate-800 focus:border-[#2f87d9] focus:outline-none focus:ring-2 focus:ring-[#cfe5ff]"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNew ? (
                  <FiEyeOff className="h-4 w-4" />
                ) : (
                  <FiEye className="h-4 w-4" />
                )}
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FiCheck className="h-4 w-4 text-emerald-600" />
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm new password"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 pr-10 text-sm text-slate-800 focus:border-[#2f87d9] focus:outline-none focus:ring-2 focus:ring-[#cfe5ff]"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirm ? (
                  <FiEyeOff className="h-4 w-4" />
                ) : (
                  <FiEye className="h-4 w-4" />
                )}
              </button>
            </div>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-red-600"
              >
                <FiAlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-green-600"
              >
                <FiCheck className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              onClick={() => navigate("/profile")}
            >
              <FiArrowLeft className="h-4 w-4" />
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              type="submit"
              disabled={loading}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#2f87d9] text-white hover:bg-[#1f6fb7]"
              }`}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Updating...
                </>
              ) : (
                <>
                  <FiLock className="h-4 w-4" />
                  Update Password
                </>
              )}
            </motion.button>
          </div>
        </form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-5 rounded-xl bg-[#f4f8ff] p-3"
        >
          <p className="mb-2 text-sm font-semibold text-[#1f6fb7]">
            🔐 Security Tips:
          </p>
          <ul className="ml-4 list-disc space-y-1 text-xs text-[#1f6fb7]">
            <li>Use at least 6 characters</li>
            <li>Include numbers and special characters</li>
            <li>Don't reuse old passwords</li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default ChangePassword;
