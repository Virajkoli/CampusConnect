import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { createTeacherAccount } from "../firebase";
import { updateFirestoreUser } from "../utils/userUtils";

export default function TeacherAuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const auth = getAuth();

  // Handle login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      if (user) {
        const tokenResult = await user.getIdTokenResult();
        if (tokenResult.claims.teacher) {
          await updateFirestoreUser(); // Firestore mein update
          navigate("/teacher-dashboard");
        } else {
          setError("❌ You are not authorized as a teacher.");
        }
      }
    } catch (err) {
      console.error("Login Error:", err.message);
      setError("❌ " + err.message); // Display error message
    } finally {
      setLoading(false);
    }
  };

  // Handle register (creating a teacher account)
  const handleRegister = async () => {
    setLoading(true);
    setError("");

    try {
      await createTeacherAccount(email, password, "Teacher Name");
      alert("Account created successfully!");
    } catch (err) {
      console.error("Error creating account:", err.message);
      setError("❌ Error creating account: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 to-blue-400"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/30 backdrop-blur-xl rounded-3xl shadow-2xl p-8"
      >
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-center text-green-700 mb-6"
        >
          🎓 Teacher Login
        </motion.h2>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-600 text-center mb-4"
          >
            {error}
          </motion.p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.input
            whileFocus={{ scale: 1.02 }}
            type="email"
            placeholder="Teacher Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none"
            required
          />

          <motion.input
            whileFocus={{ scale: 1.02 }}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none"
            required
          />

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-green-500 text-white py-3 rounded-xl shadow-md hover:bg-green-600 transition duration-200"
            disabled={loading} // Disable button during loading
          >
            {loading ? "Loading..." : "Login as Teacher"}
          </motion.button>

          <p className="text-center mt-4 text-sm text-gray-600">
            <button
              onClick={() => navigate("/login")}
              type="button"
              className="text-green-700 hover:underline"
            >
              ← Back to Role Selection
            </button>
          </p>
        </form>

        {/* Register Button */}
        <div className="mt-6 text-center">
          <button
            onClick={handleRegister}
            className="text-sm text-green-700 hover:underline"
            disabled={loading} // Disable register button during loading
          >
            Don’t have an account? Register as Teacher
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
