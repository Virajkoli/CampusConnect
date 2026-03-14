// AuthPage.jsx - Professional Role Selector (Simplified)
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function AuthPage() {
  const navigate = useNavigate();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 pt-16">
      <motion.div
        className="w-full max-w-4xl bg-white rounded-lg shadow-md p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          ease: "easeOut",
        }}
      >
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <motion.h1
            className="text-2xl font-bold text-gray-800 cursor-pointer"
            onClick={() => navigate("/")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Campus Connect
          </motion.h1>
          <div className="mt-2 mb-3 h-1 w-16 bg-blue-600 mx-auto rounded"></div>
          <motion.p
            className="text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Select your role to continue
          </motion.p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Student Card */}
          <motion.div
            className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            variants={itemVariants}
            whileHover={{
              scale: 1.03,
              boxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            }}
          >
            <div className="p-6">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998a12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-800 text-center mb-3">
                Student
              </h3>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Access course materials and submit assignments
              </p>
              <motion.button
                onClick={() => navigate("/auth/student")}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Continue
              </motion.button>
            </div>
          </motion.div>

          {/* Teacher Card */}
          <motion.div
            className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            variants={itemVariants}
            whileHover={{
              scale: 1.03,
              boxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            }}
          >
            <div className="p-6">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-800 text-center mb-3">
                Teacher
              </h3>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Manage courses and engage with students
              </p>
              <motion.button
                onClick={() => navigate("/auth/teacher")}
                className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Continue
              </motion.button>
            </div>
          </motion.div>

          {/* Admin Card */}
          <motion.div
            className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            variants={itemVariants}
            whileHover={{
              scale: 1.03,
              boxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            }}
          >
            <div className="p-6">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-800 text-center mb-3">
                Admin
              </h3>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Manage users and system configuration
              </p>
              <motion.button
                onClick={() => navigate("/auth/admin")}
                className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Continue
              </motion.button>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="text-center text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <p>© {new Date().getFullYear()} Campus Connect</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
