import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE = String(import.meta.env.VITE_API_URL || "http://localhost:5000")
  .trim()
  .replace(/\/+$/, "");

export default function ResetConfirm() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  const loginId = String(location.state?.loginId || "").trim();
  const resetToken = String(location.state?.resetToken || "").trim();
  const maskedEmail = String(location.state?.maskedEmail || "").trim();

  const handleReset = async (e) => {
    e.preventDefault();

    if (!loginId || !resetToken) {
      setError("Your reset session has expired. Please request OTP again.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/password-otp/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginId,
          resetToken,
          newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to reset password.");
      }

      setMessage(data.message || "Password has been reset successfully.");
      setTimeout(() => navigate("/login"), 1400);
    } catch (resetError) {
      setError(resetError.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eef2f6] px-4 pb-8 pt-24 sm:px-6">
      <div className="pointer-events-none absolute -left-20 top-24 h-64 w-64 rounded-full bg-[#d5e9ff] blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-8 h-64 w-64 rounded-full bg-[#ffe3c8] blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl lg:grid-cols-2"
      >
        <div className="hidden bg-gradient-to-br from-[#165f90] to-[#2f87d9] p-8 text-white lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
            Final Step
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight">
            Set a New Secure Password
          </h1>
          <p className="mt-4 text-sm text-blue-50/95">
            Your OTP was verified successfully. Create a new password for your
            login account.
          </p>

          <div className="mt-8 space-y-3 text-sm">
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
              Minimum 8 characters
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
              Login continues with your same login ID/email
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
              Password change confirmation is emailed
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-8">
          <button
            type="button"
            onClick={() => navigate("/reset-password")}
            className="text-sm font-semibold text-[#165f90] hover:underline"
          >
            ← Back to OTP Verification
          </button>

          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#165f90]">
            New Password
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Create Password
          </h2>

          {maskedEmail ? (
            <p className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700 sm:text-sm">
              Verified for {maskedEmail}
            </p>
          ) : null}

          {message ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleReset} className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                New Password
              </label>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#165f90] focus:ring-2 focus:ring-[#d6e8f5]"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#165f90] focus:ring-2 focus:ring-[#d6e8f5]"
                required
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#165f90] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#114b71] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Resetting Password..." : "Save New Password"}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
