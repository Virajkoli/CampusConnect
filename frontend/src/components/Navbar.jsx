import { Link } from "react-router-dom";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const [user] = useAuthState(auth);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const handleLogout = () => {
    auth.signOut();
    navigate("/login");
    setIsDropdownOpen(false);
  };

  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-transparent text-black relative">
      <h1 className="text-xl font-bold">CampusConnect</h1>

      <div className="flex items-center space-x-6">
        <Link to="/">Home</Link>

        {user ? (
          <>
            <div className="relative">
              <button className="hover:text-gray-200" onClick={toggleDropdown}>
                Features ▾
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg z-10">
                  <Link
                    to="/announcements"
                    onClick={() => setIsDropdownOpen(false)}
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    Announcements
                  </Link>
                  <Link
                    to="/discussions"
                    onClick={() => setIsDropdownOpen(false)}
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    Discussions
                  </Link>
                  <Link
                    to="/notes"
                    onClick={() => setIsDropdownOpen(false)}
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    Notes
                  </Link>
                  <Link
                    to="/chat"
                    onClick={() => setIsDropdownOpen(false)}
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    Chat
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 hover:bg-red-100 text-red-600"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/login">Login / Signup</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
