// AuthPage.jsx (role selector only)
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function AuthPage() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-cyan-500"
    >
      <div className="bg-white/80 p-10 rounded-2xl shadow-xl backdrop-blur-md text-center space-y-6">
        <h2 className="text-2xl font-bold">Select Your Role</h2>
        <div className="flex justify-center gap-6">
          <button
            onClick={() => navigate("/auth/student")}
            className="bg-blue-500 text-white px-6 py-2 rounded-xl hover:bg-blue-600 transition"
          >
            Student
          </button>
          <button
            onClick={() => navigate("/auth/admin")}
            className="bg-red-500 text-white px-6 py-2 rounded-xl hover:bg-red-600 transition"
          >
            Admin
          </button>
        </div>
      </div>
    </motion.div>
  );
}
