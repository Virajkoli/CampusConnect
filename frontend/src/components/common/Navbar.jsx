import { Link } from "react-router-dom";
import { auth } from "../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import StudentNavbar from "../student/StudentNavbar"; // Import StudentNavbar
import { FiChevronDown } from "react-icons/fi";
import campusLogo from "../../assets/logo2.png";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useAuthState(auth);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Keep auth/reset pages readable with the light navbar style.
  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/reset-password" ||
    location.pathname === "/reset-password-confirm" ||
    location.pathname.startsWith("/auth/");

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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
    setIsDropdownOpen(false);
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

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const roleBasedLinks = {
    admin: [
      { path: "/admin-dashboard", name: "Dashboard" },
      { path: "/discussions", name: "Discussions" },
      { path: "/profile", name: "Profile" },
    ],
    teacher: [
      { path: "/teacher-dashboard", name: "Dashboard" },
      { path: "/discussions", name: "Discussions" },
      { path: "/profile", name: "Profile" },
    ],
    student: [
      { path: "/student-dashboard", name: "Dashboard" },
      { path: "/discussions", name: "Discussions" },
      { path: "/profile", name: "Profile" },
    ],
  };

  const linksToRender = roleBasedLinks[userRole] || [];

  // Always use a consistent navbar style
  // We're using a fully solid background for better readability on all pages
  const navbarClasses = `w-full z-30 transition-all duration-300 fixed top-0 left-0 ${
    isAuthPage
      ? "bg-white shadow-md text-gray-800"
      : scrolled
        ? "bg-white shadow-md text-gray-800"
        : "bg-black text-white"
  }`;

  return (
    <motion.nav
      className={navbarClasses}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 md:py-4">
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
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="w-10 h-10 mr-2 rounded-md overflow-hidden bg-white/90">
              <img
                src={campusLogo}
                alt="CampusConnect logo"
                className="w-full h-full object-cover"
              />
            </div>
            <h1
              className={`text-lg sm:text-xl font-bold ${
                scrolled || isAuthPage
                  ? "bg-clip-text text-black"
                  : "text-white"
              }`}
            >
              CampusConnect
            </h1>
          </motion.div>

          <div className="hidden md:flex items-center space-x-6">
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
                        className={`absolute right-0 mt-2 w-56 rounded-md shadow-lg z-50 ${
                          scrolled || isAuthPage
                            ? "bg-white text-gray-800"
                            : "bg-black text-white"
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
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/login"
                  className={`font-medium transition-colors ${
                    scrolled || isAuthPage
                      ? "hover:text-blue-600"
                      : "hover:text-gray-300"
                  }`}
                >
                  Login
                </Link>
              </motion.div>
            )}
          </div>

          <button
            type="button"
            className="md:hidden inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            Menu
            <FiChevronDown
              className={`h-4 w-4 transition-transform ${isMobileMenuOpen ? "rotate-180" : "rotate-0"}`}
            />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
            className="md:hidden border-t border-gray-200 bg-white text-gray-800 shadow-lg"
          >
            <div className="px-4 py-3 space-y-1">
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md hover:bg-gray-100"
              >
                Home
              </Link>
              <Link
                to="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md hover:bg-gray-100"
              >
                About
              </Link>

              {user ? (
                <>
                  {linksToRender.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-md hover:bg-gray-100"
                    >
                      {item.name}
                    </Link>
                  ))}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 rounded-md text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                  <div className="pt-2 mt-2 border-t border-gray-200">
                    <StudentNavbar />
                  </div>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md hover:bg-gray-100"
                >
                  Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

export default Navbar;
