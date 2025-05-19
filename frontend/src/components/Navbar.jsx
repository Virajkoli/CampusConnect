import { Link } from "react-router-dom";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import StudentNavbar from "./StudentNavbar"; // Import StudentNavbar

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useAuthState(auth);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const [userRole, setUserRole] = useState(null);


  // Check if current page is login/signup
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/signup";

  // Handle scrolling effects
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleLogout = () => {
    auth.signOut();
    navigate("/login");
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

 useEffect(() => {
  const checkUserRole = async () => {
    if (user) {
      try {
        const tokenResult = await user.getIdTokenResult(true);
        if (tokenResult.claims.admin) {
          setUserRole("admin");
        } else if (tokenResult.claims.teacher) {
          setUserRole("teacher");
        } else {
          setUserRole("student");
        }
      } catch (error) {
        console.error("Error checking user role:", error);
      }
    }
  };

  checkUserRole();
}, [user]);

const roleBasedLinks = {
  admin: [
    { path: "/admin-dashboard", name: "Dashboard" },
     { path: "/announcements", name: "Announcements" },
    { path: "/discussions", name: "Discussions" },
    { path: "/events-calendar", name: "Events Calendar" },
    { path: "/profile", name: "Profile" },
  ],
  teacher: [
    { path: "/teacher-dashboard", name: "Dashboard" },
    { path: "/announcements", name: "Announcements" },
    { path: "/discussions", name: "Discussions" },
    { path: "/events-calendar", name: "Events Calendar" },
    { path: "/profile", name: "Profile" },
  ],
  student: [
    { path: "/student-dashboard", name: "Dashboard" },
    { path: "/announcements", name: "Announcements" },
    { path: "/discussions", name: "Discussions" },
    { path: "/study-materials", name: "Study Materials" },
    { path: "/events-calendar", name: "Events Calendar" },
    { path: "/profile", name: "Profile" },
  ],
};

const linksToRender = roleBasedLinks[userRole] || [];



  // Always use a consistent navbar style
  // We're using a fully solid background for better readability on all pages
  const navbarClasses = `flex justify-between items-center px-6 py-4 w-full z-30 transition-all duration-300 fixed top-0 left-0 ${
    isAuthPage
      ? "bg-white shadow-md text-gray-800"
      : scrolled
      ? "bg-white shadow-md text-gray-800"
      : "bg-indigo-600 text-white"
  }`;

  return (
    <motion.nav
      className={navbarClasses}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="flex items-center cursor-pointer"
        onClick={() => {
  if (!user) {
    navigate("/");
  } else if (userRole === "admin") {
    navigate("/admin-dashboard");
  } else if (userRole === "teacher") {
    navigate("/teacher-dashboard");
  } else {
    navigate("/student-dashboard");
  }
}}

        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="w-10 h-10 mr-2 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-md flex items-center justify-center text-white shadow-md">
          <span className="text-lg font-bold">CC</span>
        </div>
        <h1
          className={`text-xl font-bold ${
            scrolled || isAuthPage
              ? "bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent"
              : "text-white"
          }`}
        >
          CampusConnect
        </h1>
      </motion.div>

      <div className="flex items-center space-x-6">
        <div>
          <motion.div
            className="inline-block"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/"
              className={`font-medium transition-colors ${
                scrolled || isAuthPage
                  ? "hover:text-indigo-600"
                  : "hover:text-indigo-200"
              }`}
            >
              Home
            </Link>
          </motion.div>
          <motion.div
            className="inline-block ml-6"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/about"
              className={`font-medium transition-colors ${
                scrolled || isAuthPage
                  ? "hover:text-indigo-600"
                  : "hover:text-indigo-200"
              }`}
            >
              About
            </Link>
          </motion.div>
        </div>

        {user ? (
          <div className="flex items-center space-x-4">
            {/* Add StudentNavbar for notification bell */}
            <StudentNavbar />

            <div className="relative" ref={dropdownRef}>
              <motion.button
                className={`flex items-center space-x-1 transition-colors ${
                  scrolled || isAuthPage
                    ? "hover:text-indigo-600"
                    : "hover:text-indigo-200"
                }`}
                onClick={toggleDropdown}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>Features</span>
                <span className="transform transition-transform duration-200">
                  {isDropdownOpen ? "▴" : "▾"}
                </span>
              </motion.button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg z-50 ${
                      scrolled || isAuthPage
                        ? "bg-white text-gray-800"
                        : "bg-indigo-800 text-white"
                    }`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {linksToRender.map((item) => (
                      <motion.div
                        key={item.path}
                        whileHover={{
                          backgroundColor:
                            scrolled || isAuthPage ? "#f3f4f6" : "#374151",
                        }}
                      >
                        <Link
                          to={item.path}
                          onClick={() => setIsDropdownOpen(false)}
                          className={`block px-4 py-2 ${
                            scrolled || isAuthPage
                              ? "hover:bg-gray-100"
                              : "hover:bg-gray-700"
                          }`}
                        >
                          {item.name}
                        </Link>
                      </motion.div>
                    ))}
                    <motion.div
                      whileHover={{
                        backgroundColor:
                          scrolled || isAuthPage ? "#EEF2FF" : "#4338CA",
                      }}
                    >
                      <button
                        onClick={handleLogout}
                        className={`block w-full text-left px-4 py-2 text-red-600 ${
                          scrolled || isAuthPage
                            ? "hover:bg-gray-100"
                            : "hover:bg-gray-700 hover:text-white"
                        } transition-colors duration-300`}
                      >
                        Logout
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to="/login"
              className={`font-medium transition-colors ${
                scrolled || isAuthPage
                  ? "hover:text-blue-600"
                  : "hover:text-gray-300"
              }`}
            >
              Login / Signup
            </Link>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}

export default Navbar;
