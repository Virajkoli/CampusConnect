import { Link } from "react-router-dom";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function Navbar() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-transparent text-white absolute top-0 left-0 w-full z-10">
      <h1 className="text-xl font-bold">CampusConnect</h1>

      <div className="flex items-center space-x-6">
        <div>
          <Link to="/" className="font-medium hover:text-gray-300">
            Home
          </Link>
          <Link to="/about" className="font-medium ml-6 hover:text-gray-300">
            About
          </Link>
        </div>

        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              className="hover:text-gray-300 flex items-center space-x-1"
              onClick={toggleDropdown}
            >
              <span>Features</span>
              <span className="transform transition-transform duration-200">
                {isDropdownOpen ? "▴" : "▾"}
              </span>
            </button>

            {isDropdownOpen && (
              <motion.div
                className="absolute right-0 mt-2 w-48 text-white rounded-md shadow-lg z-50 backdrop-blur-lg"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  to="/announcements"
                  onClick={() => setIsDropdownOpen(false)}
                  className="block px-4 py-2 hover:bg-gray-700"
                >
                  Announcements
                </Link>
                <Link
                  to="/discussions"
                  onClick={() => setIsDropdownOpen(false)}
                  className="block px-4 py-2 hover:bg-gray-700"
                >
                  Discussions
                </Link>
                <Link
                  to="/notes"
                  onClick={() => setIsDropdownOpen(false)}
                  className="block px-4 py-2 hover:bg-gray-700"
                >
                  Notes
                </Link>
                <Link
                  to="/chat"
                  onClick={() => setIsDropdownOpen(false)}
                  className="block px-4 py-2 hover:bg-gray-700"
                >
                  Chat
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="block px-4 py-2 hover:bg-gray-700"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-700 hover:text-white transition-colors duration-300"
                >
                  Logout
                </button>
              </motion.div>
            )}
          </div>
        ) : (
          <Link to="/login" className="hover:text-gray-300">
            Login / Signup
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
