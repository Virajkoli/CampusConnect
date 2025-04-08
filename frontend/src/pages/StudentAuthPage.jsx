import { useState } from "react";
import { motion } from "framer-motion";
import { signUpWithEmailPassword, loginWithEmailPassword } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await loginWithEmailPassword(email, password);
      } else {
        await signUpWithEmailPassword(email, password, name);
      }
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        className="bg-white/60 rounded-2xl shadow-2xl p-8 w-full max-w-md backdrop-blur-md"
      >
        <div className="flex justify-center mb-6">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsLogin(true)}
            className={`px-4 py-2 rounded-l-full font-semibold ${
              isLogin ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            Login
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsLogin(false)}
            className={`px-4 py-2 rounded-r-full font-semibold ${
              !isLogin ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            Sign Up
          </motion.button>
        </div>

        {error && <p className="text-red-500 text-center">{error}</p>}

        {isLogin ? (
          <motion.form
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
            onSubmit={handleSubmit}
          >
            <h2 className="text-2xl font-bold text-center">Welcome Back</h2>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            <p className="text-right text-sm">
              <button
                type="button"
                onClick={() => navigate("/reset-password")}
                className="text-blue-600 hover:underline"
              >
                Forgot Password?
              </button>
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded-xl hover:bg-blue-600 transition"
            >
              Login
            </motion.button>
            <p className="text-center text-sm text-gray-600 mt-2">
            <button
              onClick={() => navigate("/login")}
              type="button"
              className="text-red-600 hover:underline"
            >
              ← Back to Role Selection
            </button>
          </p>
          </motion.form>
        ) : (
          <motion.form
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
            onSubmit={handleSubmit}
          >
            <h2 className="text-2xl font-bold text-center">
              Create an Account
            </h2>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              type="submit"
              className="w-full bg-purple-500 text-white py-2 rounded-xl hover:bg-purple-600 transition"
            >
              Sign Up
            </motion.button>
            <p className="text-center text-sm text-gray-600 mt-2">
            <button
              onClick={() => navigate("/login")}
              type="button"
              className="text-red-600 hover:underline"
            >
              ← Back to Role Selection
            </button>
          </p>
          </motion.form>
        )}
      </motion.div>
    </motion.div>
  );
}
