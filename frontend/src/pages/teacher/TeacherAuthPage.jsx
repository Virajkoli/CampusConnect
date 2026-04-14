import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { createTeacherAccount } from "../../firebase";

export default function TeacherAuthPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const auth = getAuth();
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const normalizedIdentifier = identifier.trim();
      if (!normalizedIdentifier) {
        throw new Error("Please enter Login ID or Email.");
      }

      let loginEmail = normalizedIdentifier;
      if (!normalizedIdentifier.includes("@")) {
        const resolveResponse = await fetch(
          `${apiBase}/api/resolve-teacher-login/${encodeURIComponent(normalizedIdentifier)}`,
        );
        const resolveData = await resolveResponse.json();
        if (!resolveResponse.ok) {
          throw new Error(resolveData.message || "Invalid teacher login ID.");
        }
        loginEmail = resolveData.email;
      }

      const userCredential = await signInWithEmailAndPassword(
        auth,
        loginEmail,
        password,
      );
      const user = userCredential.user;

      if (user) {
        const tokenResult = await user.getIdTokenResult(true);

        if (tokenResult.claims.teacher) {
          navigate("/teacher-dashboard");
        } else {
          setError("You are not authorized as a teacher.");
        }
      }
    } catch (err) {
      console.error("Login Error:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError("");

    try {
      if (!identifier.includes("@")) {
        throw new Error("Please enter a valid email to self-register.");
      }

      const userCredential = await createTeacherAccount(
        identifier,
        password,
        "Teacher Name",
      );
      const user = userCredential.user;

      const response = await fetch(`${apiBase}/api/setTeacherRole`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to set teacher role.");
      }

      alert("Account created successfully. Please login now.");
      navigate("/login");
    } catch (err) {
      console.error("Error creating account:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eef2f6] px-4 pb-8 pt-24 sm:px-6">
      <div className="pointer-events-none absolute -left-24 top-24 h-60 w-60 rounded-full bg-[#bff0df] blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-6 h-64 w-64 rounded-full bg-[#d2e9ff] blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl lg:grid-cols-2"
      >
        <div className="hidden bg-gradient-to-br from-[#14967f] to-[#32b69d] p-8 text-white lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
            Faculty Access
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight">
            Manage Attendance and Classroom Control
          </h1>
          <p className="mt-4 text-sm text-emerald-50/95">
            Login using your teacher ID or registered email to start sessions,
            view analytics, and manage student attendance.
          </p>

          <div className="mt-8 space-y-3 text-sm">
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
              Teacher ID to email resolve is supported
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
              Role claim validation before dashboard access
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
              Self-register option for faculty onboarding
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#14967f]">
            Teacher Portal
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Login as Teacher
          </h2>

          {error ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Teacher Login ID or Email
              </label>
              <input
                type="text"
                placeholder="Example: pm01 or teacher@college.edu"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#14967f] focus:ring-2 focus:ring-[#c9efe7]"
                required
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
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#14967f] focus:ring-2 focus:ring-[#c9efe7]"
                required
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              className="w-full rounded-xl bg-[#14967f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f7f6b]"
              disabled={loading}
            >
              {loading ? "Please wait..." : "Login as Teacher"}
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

            <button
              onClick={handleRegister}
              className="font-semibold text-[#14967f] hover:underline"
              disabled={loading}
              type="button"
            >
              Register as Teacher
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
