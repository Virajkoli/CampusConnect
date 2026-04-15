import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE = String(import.meta.env.VITE_API_URL || "http://localhost:5000")
  .trim()
  .replace(/\/+$/, "");

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loginId, setLoginId] = useState("");
  const [otp, setOtp] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [step, setStep] = useState("request");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const prefilledLoginId = String(location.state?.loginId || "").trim();
    if (prefilledLoginId && !loginId) {
      setLoginId(prefilledLoginId);
    }
  }, [location.state, loginId]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const safeLoginId = String(loginId || "").trim();
    if (!safeLoginId) {
      setError("Please enter your login email or login ID.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/auth/password-otp/request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ loginId: safeLoginId }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to send OTP.");
      }

      setMaskedEmail(String(data.maskedEmail || ""));
      setStep("verify");
      setMessage(
        data.message || "OTP sent to your registered personal email address.",
      );
    } catch (requestError) {
      setError(requestError.message || "Unable to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const safeOtp = String(otp || "")
      .trim()
      .replace(/\s+/g, "");

    if (!/^\d{6}$/.test(safeOtp)) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/password-otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId: loginId.trim(), otp: safeOtp }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "OTP verification failed.");
      }

      navigate("/reset-password-confirm", {
        state: {
          loginId: String(data.loginId || loginId).trim(),
          maskedEmail: String(data.maskedEmail || maskedEmail),
          resetToken: String(data.resetToken || ""),
        },
      });
    } catch (verifyError) {
      setError(verifyError.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eef2f6] px-4 pb-8 pt-24 sm:px-6">
      <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#beddff] blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-6 h-72 w-72 rounded-full bg-[#d6f6e8] blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl lg:grid-cols-2"
      >
        <div className="hidden bg-gradient-to-br from-[#0f4c81] to-[#1f7abf] p-8 text-white lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
            Account Recovery
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight">
            Verify with OTP, Then Reset Securely
          </h1>
          <p className="mt-4 text-sm text-blue-50/95">
            Enter your login ID or login email. We send OTP only to your
            registered personal email address.
          </p>

          <div className="mt-8 space-y-3 text-sm">
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
              OTP validity: 10 minutes
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
              Password can be changed only after OTP verification
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
              Supports Student, Teacher, and Admin login IDs
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm font-semibold text-[#0f4c81] hover:underline"
          >
            ← Back to Login
          </button>

          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#0f4c81]">
            Password Reset
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            {step === "request" ? "Get OTP" : "Verify OTP"}
          </h2>

          <div className="mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
            <span
              className={`rounded-full px-3 py-1 ${
                step === "request"
                  ? "bg-[#d9ecff] text-[#0f4c81]"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              1. Request OTP
            </span>
            <span
              className={`rounded-full px-3 py-1 ${
                step === "verify"
                  ? "bg-[#d9ecff] text-[#0f4c81]"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              2. Verify OTP
            </span>
          </div>

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

          {step === "request" ? (
            <form onSubmit={handleRequestOtp} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Login Email or Login ID
                </label>
                <input
                  type="text"
                  placeholder="Example: student@college.edu or pm01"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#0f4c81] focus:ring-2 focus:ring-[#d7e8f7]"
                  required
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#0f4c81] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b3a63] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </motion.button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Enter 6-digit OTP
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-center text-lg tracking-[0.25em] text-slate-800 outline-none transition focus:border-[#0f4c81] focus:ring-2 focus:ring-[#d7e8f7]"
                  required
                />
              </div>

              <p className="text-xs text-slate-500">
                OTP sent to {maskedEmail || "your registered personal email"}
              </p>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#0f4c81] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b3a63] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Verifying OTP..." : "Verify OTP"}
              </motion.button>

              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={loading}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Resend OTP
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
