import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithEmailPassword, auth } from "../firebase";
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-700 text-lg">Checking admin status...</p>
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
          setError("❌ You are not authorized as admin.");
        }
      }
    } catch (err) {
      setError("❌ " + err.message);
    }
  };

  return (
    <motion.div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 to-yellow-400">
      <motion.div className="w-full max-w-md bg-white/30 backdrop-blur-xl rounded-3xl shadow-2xl p-8">
        <motion.h2 className="text-2xl font-bold text-center text-red-700 mb-6">
          Admin Login
        </motion.h2>

        {error && <p className="text-red-600 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300"
            required
          />
          <button
            type="submit"
            className="w-full bg-red-500 text-white py-3 rounded-xl shadow-md hover:bg-red-600"
          >
            Login as Admin
          </button>
          <p className="text-center text-sm text-gray-600 mt-2">
            <button
              onClick={() => navigate("/login")}
              type="button"
              className="text-red-600 hover:underline"
            >
              ← Back to Role Selection
            </button>
          </p>
        </form>
      </motion.div>
    </motion.div>
  );
}
