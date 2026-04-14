import { useState } from "react";
import { motion } from "framer-motion";
import {
  signUpWithEmailPassword,
  loginWithEmailPassword,
} from "../../firebase";
import { useNavigate } from "react-router-dom";

export default function StudentAuthPage() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const safeEmail = String(email || "").trim();
    const safePassword = String(password || "").trim();

    if (!safeEmail || !safePassword) {
      setError("Email and password are required.");
      return;
    }

    try {
      if (isLogin) {
        await loginWithEmailPassword(safeEmail, safePassword);
      } else {
        const safeName = String(name || "").trim();
        if (!safeName) {
          setError("Name is required for signup.");
          return;
        }

        await signUpWithEmailPassword(safeEmail, safePassword, safeName);
      }
      navigate("/student-dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eef2f6] px-4 pb-8 pt-24 sm:px-6">
      <div className="pointer-events-none absolute -left-16 top-10 h-52 w-52 rounded-full bg-[#c6e2ff] blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-60 w-60 rounded-full bg-[#d8f0ff] blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl lg:grid-cols-2"
      >
        <div className="hidden bg-gradient-to-br from-[#2f87d9] to-[#59a2e8] p-8 text-white lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
            Student Access
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight">
            Continue Your Attendance Journey
          </h1>
          <p className="mt-4 text-sm text-blue-50/90">
            Sign in to mark attendance, check your subjects, and track progress
            from your dashboard.
          </p>

          <div className="mt-8 space-y-3 text-sm">
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
              Attendance sessions with biometric verification
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
              Subject-wise analytics and records
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
              Seamless profile and course integration
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2f87d9]">
            Student Portal
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            {isLogin ? "Welcome back" : "Create student account"}
          </h2>

          <div className="mt-5 inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 text-sm">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`rounded-lg px-4 py-2 font-medium transition ${
                isLogin
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`rounded-lg px-4 py-2 font-medium transition ${
                !isLogin
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sign Up
            </button>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {!isLogin ? (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#2f87d9] focus:ring-2 focus:ring-[#cbe4fb]"
                />
              </div>
            ) : null}

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#2f87d9] focus:ring-2 focus:ring-[#cbe4fb]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#2f87d9] focus:ring-2 focus:ring-[#cbe4fb]"
              />
            </div>

            {isLogin ? (
              <div className="text-right text-sm">
                <button
                  type="button"
                  onClick={() => navigate("/reset-password")}
                  className="font-medium text-[#2f87d9] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            ) : null}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              className="w-full rounded-xl bg-[#2f87d9] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1f6fb7]"
            >
              {isLogin ? "Login as Student" : "Create Student Account"}
            </motion.button>
          </form>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
            <button
              onClick={() => navigate("/login")}
              type="button"
              className="font-semibold text-slate-600 hover:text-slate-900"
            >
              ← Back to Role Selection
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
