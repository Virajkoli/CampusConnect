// AdminAuthPage.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import { loginWithEmailPassword } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function AdminAuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await loginWithEmailPassword(email, password);
      navigate("/admin-dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen flex items-center justify-center bg-gradient-to-br from-red-600 to-yellow-500"
    >
      <div className="bg-white/60 rounded-2xl shadow-2xl p-8 w-full max-w-md backdrop-blur-md">
        <h2 className="text-center text-xl font-bold text-red-700 mb-4">
          Admin Portal
        </h2>

        {error && <p className="text-red-500 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-xl"
          />
          <input
            type="password"
            placeholder="Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-xl"
          />
          <button
            type="submit"
            className="w-full bg-red-500 text-white py-2 rounded-xl hover:opacity-90 transition"
          >
            Login
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
      </div>
    </motion.div>
  );
}
