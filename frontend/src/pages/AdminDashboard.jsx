import React, { useState, useEffect, useRef, useCallback } from "react";
import { auth, firestore } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";

// Add custom CSS for scrollbar and navigation
const styles = `
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
`;

// Icons
import {
  FiSearch,
  FiLogOut,
  FiUser,
  FiUsers,
  FiHome,
  FiMessageSquare,
  FiBell,
  FiCalendar,
  FiCreditCard,
  FiSettings,
  FiActivity,
} from "react-icons/fi";
import { FaEnvelope, FaPhoneAlt } from "react-icons/fa";
import CalendarComponent from "../components/CalendarComponent";

// Sidebar Item Component
function SidebarItem({
  icon,
  label,
  path,
  isOpen,
  active,
  color = "blue",
  onClick,
}) {
  const navigate = useNavigate();

  // Define color mappings for backgrounds and text
  const colorMap = {
    blue: {
      bg: "bg-blue-50",
      hoverBg: "hover:bg-blue-100/60",
      activeBg: "from-blue-500 to-blue-600",
      text: "text-blue-600",
    },
    purple: {
      bg: "bg-purple-50",
      hoverBg: "hover:bg-purple-100/60",
      activeBg: "from-purple-500 to-purple-600",
      text: "text-purple-600",
    },
    green: {
      bg: "bg-green-50",
      hoverBg: "hover:bg-green-100/60",
      activeBg: "from-green-500 to-green-600",
      text: "text-green-600",
    },
    amber: {
      bg: "bg-amber-50",
      hoverBg: "hover:bg-amber-100/60",
      activeBg: "from-amber-500 to-amber-600",
      text: "text-amber-600",
    },
    red: {
      bg: "bg-red-50",
      hoverBg: "hover:bg-red-100/60",
      activeBg: "from-red-500 to-red-600",
      text: "text-red-600",
    },
  };

  // Get the appropriate colors from the map
  const colorStyle = colorMap[color] || colorMap.blue;

  // Handle the onClick event for items like Logout
  const handleItemClick = (e) => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <motion.div
      className={`mb-1 px-3 ${active ? colorStyle.bg : ""}`}
      whileHover={{
        backgroundColor: active ? undefined : "rgba(99, 102, 241, 0.1)",
        scale: 1.02,
      }}
      whileTap={{ scale: 0.98 }}
    >
      {path && !onClick ? (
        <Link
          to={path}
          className={`w-full flex items-center py-3 px-2 rounded-lg ${
            active
              ? `${colorStyle.text} font-medium bg-opacity-80`
              : `text-gray-600 ${colorStyle.hoverBg}`
          } transition-all duration-200`}
          aria-label={label}
        >
          <div
            className={`${!isOpen ? "mx-auto" : "mr-3"} text-lg ${
              active ? colorStyle.text : ""
            }`}
          >
            {icon}
          </div>
          {isOpen && (
            <motion.span
              className="text-sm"
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {label}
            </motion.span>
          )}
        </Link>
      ) : (
        <button
          onClick={handleItemClick}
          className={`w-full flex items-center py-3 px-2 rounded-lg ${
            active
              ? `${colorStyle.text} font-medium bg-opacity-80`
              : `text-gray-600 ${colorStyle.hoverBg}`
          } transition-all duration-200`}
          aria-label={label}
        >
          <div
            className={`${!isOpen ? "mx-auto" : "mr-3"} text-lg ${
              active ? colorStyle.text : ""
            }`}
          >
            {icon}
          </div>
          {isOpen && (
            <motion.span
              className="text-sm"
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {label}
            </motion.span>
          )}
        </button>
      )}
    </motion.div>
  );
}

// Stat Card Component
function StatCard({ title, value, change, icon, color }) {
  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        type: "spring",
        stiffness: 150,
        damping: 15,
      },
    },
  };

  return (
    <motion.div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-5 overflow-hidden relative`}
      variants={cardVariants}
      whileHover={{
        y: -5,
        boxShadow:
          "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 15,
        },
      }}
    >
      {/* Animated background blob */}
      <motion.div
        className={`absolute -right-5 -top-5 w-24 h-24 rounded-full bg-${color}-100 opacity-60 z-0`}
        initial={{ scale: 0.8 }}
        animate={{
          scale: [0.8, 1.2, 0.8],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="flex justify-between items-center relative z-10">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <motion.h3
            className="text-2xl font-bold text-gray-800"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {value}
          </motion.h3>
          <div
            className={`text-xs mt-1 font-medium text-${color}-600 flex items-center`}
          >
            <motion.span
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              {change}
            </motion.span>
          </div>
        </div>
        <motion.div
          className={`w-12 h-12 rounded-full bg-${color}-100 flex items-center justify-center`}
          whileHover={{
            rotate: 10,
            scale: 1.1,
            backgroundColor: `rgba(var(--${color}-200))`,
          }}
          whileTap={{ scale: 0.9 }}
        >
          {icon}
        </motion.div>
      </div>
    </motion.div>
  );
}

// NavLink Component for the Navbar
function NavLink({
  to,
  active,
  icon,
  label,
  bgColor = "from-indigo-500 to-indigo-600",
}) {
  return (
    <Link to={to}>
      <motion.div
        className={`px-3 py-2 rounded-lg flex items-center space-x-2 ${
          active
            ? `bg-gradient-to-r ${bgColor} text-white shadow-md`
            : "text-white/70 hover:bg-white/10 hover:text-white"
        } transition-all duration-300`}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-medium min-w-max">{label}</span>
      </motion.div>
    </Link>
  );
}

// QuickAccessLink Component with enhanced animations and error handling
function QuickAccessLink({ to, icon, label, color, delay = 0 }) {
  const navigate = useNavigate();

  // Define color mapping for the component
  const colorMap = {
    blue: {
      bg: "bg-blue-50",
      hoverBg: "hover:bg-blue-100",
      text: "text-blue-500",
      hoverText: "group-hover:text-blue-700",
      labelColor: "text-blue-700",
      gradient: "from-blue-500 to-blue-600",
    },
    green: {
      bg: "bg-green-50",
      hoverBg: "hover:bg-green-100",
      text: "text-green-500",
      hoverText: "group-hover:text-green-700",
      labelColor: "text-green-700",
      gradient: "from-green-500 to-green-600",
    },
    purple: {
      bg: "bg-purple-50",
      hoverBg: "hover:bg-purple-100",
      text: "text-purple-500",
      hoverText: "group-hover:text-purple-700",
      labelColor: "text-purple-700",
      gradient: "from-purple-500 to-purple-600",
    },
    orange: {
      bg: "bg-orange-50",
      hoverBg: "hover:bg-orange-100",
      text: "text-orange-500",
      hoverText: "group-hover:text-orange-700",
      labelColor: "text-orange-700",
      gradient: "from-orange-500 to-orange-600",
    },
  };

  const colors = colorMap[color] || colorMap.blue;

  // Safe click handler to prevent navigation errors
  const handleClick = (e) => {
    e.preventDefault();
    try {
      navigate(to || "/admin/dashboard");
    } catch (err) {
      console.error("Navigation error:", err);
      // Fallback to dashboard if navigation fails
      navigate("/admin/dashboard");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: delay,
        duration: 0.4,
        type: "spring",
        stiffness: 150,
      }}
    >
      <div onClick={handleClick} className="cursor-pointer">
        <motion.div
          className={`group p-4 rounded-lg text-center transition-all ${colors.bg} ${colors.hoverBg} relative overflow-hidden`}
          whileHover={{
            scale: 1.05,
            boxShadow:
              "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Gradient hover overlay */}
          <motion.div
            className={`absolute inset-0 bg-gradient-to-tr ${colors.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 0.15 }}
          />

          {/* Icon with animation */}
          <motion.div
            className="relative flex justify-center mb-2"
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <div
              className={`w-10 h-10 ${colors.text} ${colors.hoverText} flex items-center justify-center`}
            >
              {icon}
            </div>
          </motion.div>

          {/* Label */}
          <span
            className={`text-sm font-medium ${colors.labelColor} relative z-10`}
          >
            {label}
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [searchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [lastLoginTime, setLastLoginTime] = useState("");
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Define fetchUsers first, before using it in useEffect
  const fetchUsers = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, "users"));
      const userList = [];
      querySnapshot.forEach((docSnap) => {
        userList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setUsers(userList);
    } catch (err) {
      setError("Failed to fetch users: " + err.message);
    }
  }, []);

  useEffect(() => {
    // Local flag to prevent state updates after unmount
    let isMounted = true;

    // Set current login time
    const now = new Date();
    const options = {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };
    const formattedTime = now.toLocaleDateString("en-US", options);
    setLastLoginTime(formattedTime);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Only proceed if component is still mounted
      if (!isMounted) return;

      if (currentUser) {
        try {
          // Force refresh the token to ensure latest custom claims
          const tokenResult = await currentUser.getIdTokenResult(true);

          // Only navigate if component is still mounted
          if (!isMounted) return;

          if (!tokenResult.claims.admin) {
            navigate("/auth/admin");
          } else {
            // Only fetch users if still mounted
            fetchUsers();
          }
        } catch (error) {
          console.error("Token error:", error);
          if (isMounted) {
            navigate("/auth/admin");
          }
        }
      } else if (isMounted) {
        navigate("/auth/admin");
      }
    });

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    // Enhanced cleanup
    return () => {
      isMounted = false; // Mark as unmounted
      unsubscribe(); // Clean up auth listener
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [navigate, fetchUsers]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Simplified logout function to prevent errors
  const handleLogout = () => {
    // First close dropdown to prevent UI errors
    setIsDropdownOpen(false);

    // Small delay to ensure state updates complete
    setTimeout(() => {
      try {
        // Sign out and navigate
        auth.signOut();
        navigate("/login");
      } catch (err) {
        console.error("Logout error:", err);
      }
    }, 10);
  };

  // Animation variants
  const sidebarVariants = {
    open: {
      width: "256px",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.3,
      },
    },
    closed: {
      width: "80px",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.3,
      },
    },
  };

  const textVariants = {
    open: {
      opacity: 1,
      x: 0,
      display: "block",
      transition: {
        delay: 0.1,
        duration: 0.2,
      },
    },
    closed: {
      opacity: 0,
      x: -10,
      display: "none",
      transition: {
        duration: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
        type: "spring",
        stiffness: 150,
        damping: 15,
      },
    },
  };

  return (
    <>
      <style>{styles}</style>
      <div className=" rounded-full min-h-screen  bg-gray-50 text-gray-800 flex">
        {/* Sidebar */}
        <motion.aside
          className="bg-white shadow-lg text-gray-800 flex flex-col h-screen sticky top-0 z-10 border-r border-gray-200"
          variants={sidebarVariants}
          animate={isOpen ? "open" : "closed"}
        >
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <motion.div
              className="flex items-center"
              variants={textVariants}
              animate={isOpen ? "open" : "closed"}
            >
              <motion.div
                whileHover={{ rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="mr-2 bg-gradient-to-r from-indigo-600 to-purple-600 w-8 h-8 rounded-md flex items-center justify-center text-white shadow-md"
              >
                <span className="text-lg font-bold">CC</span>
              </motion.div>
              <motion.h2
                className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                CampusConnect
              </motion.h2>
            </motion.div>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 rounded-md hover:bg-indigo-100 hover:text-indigo-600 transition-all duration-300"
              aria-label="Toggle sidebar"
            >
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9, rotate: isOpen ? -10 : 10 }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    isOpen
                      ? "M11 19l-7-7 7-7m8 14l-7-7 7-7"
                      : "M13 5l7 7-7 7M5 5l7 7-7 7"
                  }
                />
              </motion.svg>
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 hide-scrollbar">
            <SidebarItem
              icon={<FiHome />}
              label="Dashboard"
              path="/admin/dashboard"
              isOpen={isOpen}
              active={true}
              color="blue"
            />
            <SidebarItem
              icon={<FiUsers />}
              label="Students"
              path="/admin/usermanagement"
              isOpen={isOpen}
              color="purple"
            />
            <SidebarItem
              icon={<FiUser />}
              label="Teachers"
              path="/admin/teachermanagement"
              isOpen={isOpen}
              color="green"
            />

            <div className="px-3 my-3">
              <div className="flex items-center">
                <div className="flex-grow h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                <motion.p
                  className="mx-2 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  variants={textVariants}
                  animate={isOpen ? "open" : "closed"}
                >
                  Settings
                </motion.p>
                <div className="flex-grow h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
              </div>
            </div>

            <SidebarItem
              icon={<FiBell />}
              label="Notifications"
              path="/admin/announcements"
              isOpen={isOpen}
              color="purple"
            />
            <SidebarItem
              icon={<FiSettings />}
              label="Settings"
              path="/admin/settings"
              isOpen={isOpen}
              color="amber"
            />
            <SidebarItem
              icon={<FiLogOut />}
              label="Logout"
              isOpen={isOpen}
              color="red"
              onClick={handleLogout}
            />
          </nav>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          {/* Top Navbar - Enhanced Design */}
          <motion.div
            className="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 sticky top-0 z-20 shadow-xl"
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
          >
            <motion.div
              className="container mx-auto px-4 py-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {/* Upper Navbar Section */}
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                {/* Left Side - Logo & Title */}
                <div className="flex items-center w-full md:w-auto justify-center md:justify-start">
                  <motion.div
                    className="bg-white/20 backdrop-blur-sm p-2 rounded-lg mr-3 text-white"
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </motion.div>

                  <div>
                    <motion.h1
                      className="text-xl md:text-2xl font-bold text-white text-center md:text-left"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      Admin Dashboard
                    </motion.h1>
                    <motion.p
                      className="text-indigo-200 text-xs hidden md:block"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      Manage your campus efficiently
                    </motion.p>
                  </div>
                </div>

                {/* Right Side - Search, Notifications & Profile */}
                <div className="flex items-center space-x-3 w-full md:w-auto">
                  {/* Search Bar with Animation */}
                  <motion.div
                    className="relative flex-grow md:w-56 lg:w-64"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <input
                      type="text"
                      placeholder="Search anything..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      aria-label="Search"
                      className="w-full px-4 py-2 pl-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent text-white placeholder-white/60 text-sm"
                    />
                    <FiSearch className="absolute top-2.5 left-3 text-white/70" />
                  </motion.div>

                  {/* Notification Icon with Badge and Animation */}

                  {/* Admin Avatar with dropdown */}
                  <div className="relative flex-shrink-0" ref={dropdownRef}>
                    <motion.div
                      whileHover={{ scale: 1.05, rotate: 3 }}
                      whileTap={{ scale: 0.95 }}
                      className="cursor-pointer flex items-center bg-white/10 backdrop-blur-sm rounded-xl px-2 py-1.5 hover:bg-white/20 transition-colors"
                      onClick={toggleDropdown}
                    >
                      <img
                        src="https://i.pravatar.cc/100?img=12"
                        alt="Admin"
                        className="w-8 h-8 rounded-full border-2 border-white/50 mr-2"
                      />
                      <span className="text-white text-sm font-medium hidden md:block">
                        Admin
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-white/70 ml-1 hidden md:block"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </motion.div>

                    {/* Profile Dropdown with Animation */}
                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{
                            duration: 0.2,
                            type: "spring",
                            stiffness: 300,
                          }}
                          className="absolute right-0 mt-3 w-60 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-100 overflow-hidden"
                        >
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-semibold text-gray-800">
                              Admin User
                            </p>
                            <p className="text-xs text-gray-500">
                              admin@campusconnect.com
                            </p>
                          </div>

                          <div className="py-1">
                            <Link
                              to="/profile"
                              className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                            >
                              <div className="flex items-center">
                                <FiUser className="mr-2 text-indigo-500" />{" "}
                                Profile Settings
                              </div>
                            </Link>
                            <Link
                              to="/admin/settings"
                              className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                            >
                              <div className="flex items-center">
                                <FiSettings className="mr-2 text-indigo-500" />{" "}
                                Admin Settings
                              </div>
                            </Link>
                          </div>

                          <div className="py-1 border-t border-gray-100 mt-1">
                            <button
                              onClick={handleLogout}
                              className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <div className="flex items-center">
                                <FiLogOut className="mr-2" /> Sign Out
                              </div>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Lower Navbar - Navigation Links */}
              <div className="flex flex-col md:flex-row justify-between gap-2 md:items-center mt-4 pt-2 border-t border-white/10">
                <div className="w-full overflow-x-auto scrollbar-hide">
                  <nav className="flex space-x-2 pb-1 min-w-max">
                    <NavLink
                      to="/admin/dashboard"
                      active={true}
                      icon={<FiHome />}
                      label="Overview"
                      bgColor="from-blue-500 to-blue-600"
                    />
                    <NavLink
                      to="/admin/usermanagement"
                      active={false}
                      icon={<FiUsers />}
                      label="Students"
                      bgColor="from-purple-500 to-purple-600"
                    />
                    <NavLink
                      to="/admin/teachermanagement"
                      active={false}
                      icon={<FiUser />}
                      label="Teachers"
                      bgColor="from-green-500 to-green-600"
                    />
                    <NavLink
                      to="/admin/announcements"
                      active={false}
                      icon={<FiBell />}
                      label="Announcements"
                      bgColor="from-pink-500 to-pink-600"
                    />
                  </nav>
                </div>

                <div className="hidden md:flex text-white/70 text-sm items-center">
                  <span className="mr-2">Last login:</span>
                  <span className="bg-white/10 rounded-lg px-2 py-0.5">
                    {lastLoginTime}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Dashboard Content */}
          <div className=" rounded-full container mx-auto px-4 py-6">
            {/* Welcome Banner */}
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md p-6 mb-8 text-white overflow-hidden relative"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                type: "spring",
                stiffness: 150,
                damping: 15,
              }}
            >
              <motion.div
                className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full filter blur-3xl"
                animate={{
                  x: [0, 30, 0],
                  y: [0, 15, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 8,
                  ease: "easeInOut",
                }}
              />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    Welcome to Admin Dashboard
                  </h2>
                  <p className="opacity-90">
                    Here's what's happening with your campus today
                  </p>
                </div>
                <img
                  src="https://i.pravatar.cc/100?img=12"
                  alt="Admin"
                  className="h-16 w-16 rounded-full border-4 border-white/30 hidden md:block"
                />
              </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.1,
                    delayChildren: 0.2,
                  },
                },
              }}
            >
              <StatCard
                title="Total Students"
                value="1,286"
                change="+12%"
                icon={<FiUsers className="text-blue-500" />}
                color="blue"
              />
              <StatCard
                title="Total Teachers"
                value="84"
                change="+4%"
                icon={<FiUser className="text-green-500" />}
                color="green"
              />
              <StatCard
                title="Active Courses"
                value="42"
                change="+7%"
                icon={<FiCreditCard className="text-purple-500" />}
                color="purple"
              />
              <StatCard
                title="System Status"
                value="Healthy"
                change="99.9%"
                icon={<FiActivity className="text-indigo-500" />}
                color="indigo"
              />
            </motion.div>

            {/* Main Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <motion.div
                className="lg:col-span-2 space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.3,
                  type: "spring",
                  stiffness: 150,
                  damping: 15,
                }}
              >
                {/* Campus News Card */}
                <motion.div
                  className="relative overflow-hidden rounded-lg shadow-md border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-6 transition-all duration-300 hover:shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.2,
                    type: "spring",
                    stiffness: 150,
                  }}
                >
                  {/* Decorative animated blob */}
                  <motion.div
                    className="absolute -top-8 -left-8 w-32 h-32 bg-indigo-100 rounded-full filter blur-2xl opacity-40 z-0"
                    animate={{
                      scale: [1, 1.15, 1],
                      opacity: [0.4, 0.6, 0.4],
                      x: [0, 10, 0],
                      y: [0, 10, 0],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <div className="relative z-10">
                    <h2 className="text-lg font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                      <motion.span
                        whileHover={{ rotate: 15 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                        }}
                        className="inline-flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-full w-9 h-9 shadow"
                      >
                        <FiBell className="text-xl" />
                      </motion.span>
                      Campus News
                    </h2>
                    <ul className="space-y-2 mt-2">
                      <li className="flex items-start gap-2">
                        <span className="mt-1 w-2 h-2 rounded-full bg-indigo-400"></span>
                        <span className="text-gray-700 text-sm font-medium">
                          <span className="font-semibold">
                            Exam Schedule Update:
                          </span>{" "}
                          Summer exams will start from{" "}
                          <span className="text-indigo-600 font-semibold">
                            27th May 2025
                          </span>
                          . Check the notice board for detailed timetable.
                        </span>
                      </li>
                    </ul>
                  </div>
                </motion.div>

                {/* Upcoming Events Card - Redesigned */}
                <div className="relative overflow-hidden rounded-lg shadow-md border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 transition-all duration-300 hover:shadow-lg">
                  {/* Decorative animated blob */}
                  <motion.div
                    className="absolute -top-8 -right-8 w-32 h-32 bg-blue-100 rounded-full filter blur-2xl opacity-40 z-0"
                    animate={{
                      scale: [1, 1.15, 1],
                      opacity: [0.4, 0.6, 0.4],
                      x: [0, 10, 0],
                      y: [0, 10, 0],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <div className="relative z-10">
                    <h2 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                      <motion.span
                        whileHover={{ rotate: 15 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="inline-flex items-center justify-center bg-blue-100 text-blue-600 rounded-full w-9 h-9 shadow"
                      >
                        <FiCalendar className="text-xl" />
                      </motion.span>
                      Upcoming Events
                    </h2>
                    <ul className="space-y-2 mt-2">
                      <li className="flex items-start gap-2">
                        <span className="mt-1 w-2 h-2 rounded-full bg-blue-400"></span>
                        <span className="text-gray-700 text-sm font-medium">
                          Workshop: AI in Education{" "}
                          <span className="text-xs text-blue-500 ml-2 font-normal">
                            20th May 2025
                          </span>
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 w-2 h-2 rounded-full bg-indigo-400"></span>
                        <span className="text-gray-700 text-sm font-medium">
                          Parent-Teacher Meeting{" "}
                          <span className="text-xs text-indigo-500 ml-2 font-normal">
                            28th May 2025
                          </span>
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 w-2 h-2 rounded-full bg-purple-400"></span>
                        <span className="text-gray-700 text-sm font-medium">
                          Annual Fest{" "}
                          <span className="text-xs text-purple-500 ml-2 font-normal">
                            10th June 2025
                          </span>
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 w-2 h-2 rounded-full bg-green-400"></span>
                        <span className="text-gray-700 text-sm font-medium">
                          Library Orientation{" "}
                          <span className="text-xs text-green-500 ml-2 font-normal">
                            15th June 2025
                          </span>
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 w-2 h-2 rounded-full bg-amber-400"></span>
                        <span className="text-gray-700 text-sm font-medium">
                          Sports Day{" "}
                          <span className="text-xs text-amber-500 ml-2 font-normal">
                            25th June 2025
                          </span>
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>
              {/* Right Column */}
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.4,
                  type: "spring",
                  stiffness: 150,
                  damping: 15,
                }}
              >
                {/* Enhanced Calendar */}
                <motion.div
                  className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 via-white to-indigo-50">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                      <motion.div
                        whileHover={{ rotate: 15 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <FiCalendar className="mr-2 text-indigo-600" />
                      </motion.div>
                      Calendar
                    </h2>
                  </div>
                  <div className="p-3 relative">
                    {/* Animated blob decoration */}
                    <motion.div
                      className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-50 rounded-full filter blur-2xl opacity-50 z-0"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                      }}
                      transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="relative z-10"
                    >
                      <CalendarComponent />+
                    </motion.div>
                  </div>
                </motion.div>

                {/* Enhanced Quick Access */}
                <motion.div
                  className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 via-white to-indigo-50">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                      <motion.div
                        whileHover={{ rotate: 15 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <FiCreditCard className="mr-2 text-indigo-600" />
                      </motion.div>
                      Quick Access
                    </h2>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3">
                    <QuickAccessLink
                      to="/admin/announcements"
                      icon={<FiBell />}
                      label="Announcements"
                      color="blue"
                      delay={0.1}
                    />
                    <QuickAccessLink
                      to="/admin/teachermanagement"
                      icon={<FiUser />}
                      label="Teachers"
                      color="green"
                      delay={0.2}
                    />
                    <QuickAccessLink
                      to="/admin/settings"
                      icon={<FiSettings />}
                      label="Settings"
                      color="purple"
                      delay={0.3}
                    />
                    {/* Using dashboard as fallback for Reports since no reports page exists yet */}
                    <QuickAccessLink
                      to="/admin/dashboard"
                      icon={<FiActivity />}
                      label="Dashboard"
                      color="orange"
                      delay={0.4}
                    />
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
