import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithEmailPassword, auth } from "../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { motion } from "framer-motion";

export default function AdminAuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [user, loading] = useAuthState(auth);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        const tokenResult = await user.getIdTokenResult(true);
        if (tokenResult.claims.admin) {
          navigate("/admin-dashboard");
        }
      }
      setCheckingAdmin(false);
    };

    checkAdmin();
  }, [user, navigate]);

  // ❗ Show nothing until auth AND admin check both complete
  if (loading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#eef2f6]">
        <p className="text-slate-700 text-lg">Checking admin status...</p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await loginWithEmailPassword(email, password);
      const user = auth.currentUser;

      if (user) {
        const tokenResult = await user.getIdTokenResult(true);
        if (tokenResult.claims.admin) {
          navigate("/admin-dashboard");
        } else {
          setError("You are not authorized as admin.");
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eef2f6] px-4 pb-8 pt-24 sm:px-6">
      <div className="pointer-events-none absolute -left-20 top-20 h-64 w-64 rounded-full bg-[#ffd7b8] blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-60 w-60 rounded-full bg-[#fbd9c5] blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl lg:grid-cols-2"
      >
        <div className="hidden bg-gradient-to-br from-[#f97316] to-[#fb923c] p-8 text-white lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-100">
            Admin Access
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight">
            Secure Control for Campus Operations
          </h1>
          <p className="mt-4 text-sm text-orange-50/95">
            Login with your admin credentials. Access is granted only after
            claim validation.
          </p>

          <div className="mt-8 space-y-3 text-sm">
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
              Protected admin claim verification
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
              User, teacher, and system management
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
              Dedicated secure admin dashboard
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f97316]">
            Admin Portal
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Login as Admin
          </h2>

          {error ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                placeholder="Enter admin email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#f97316] focus:ring-2 focus:ring-[#ffe2cc]"
                required
                autoFocus
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
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#f97316] focus:ring-2 focus:ring-[#ffe2cc]"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-[#f97316] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#ea580c]"
            >
              Login as Admin
            </button>
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
              type="button"
              onClick={() =>
                navigate("/reset-password", {
                  state: { loginId: String(email || "").trim() },
                })
              }
              className="font-semibold text-[#f97316] hover:underline"
            >
              Forgot password?
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
