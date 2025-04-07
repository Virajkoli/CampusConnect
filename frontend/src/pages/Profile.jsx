import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import defaultProfile from "../assets/pallavi.jpg";

function Profile() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await currentUser.reload(); // 💥 force update from server
        setUser(auth.currentUser); // ✅ updated user object
      } else {
        navigate("/login");
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-purple-500 flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-blue-800 mb-6">
          🎓 Student Profile
        </h1>

        {/* Profile Picture and Basic Info */}
        <div className="flex-col sm:flex-row items-center gap-6 mb-8">
          <img
            className="h-20 w-20 rounded-full object-cover"
            src={user?.photoURL}
            alt="Profile"
          />

          <div className="text-center sm:text-left">
            <h2 className="text-xl font-semibold text-gray-800">
              {user?.displayName || "Not Provided"}
            </h2>
            <p className="text-gray-600">{user?.email}</p>
          </div>
        </div>

        {/* Student Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="font-medium text-gray-700">Roll Number</p>
            <p className="text-gray-600">20231234</p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="font-medium text-gray-700">Department</p>
            <p className="text-gray-600">Computer Science</p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="font-medium text-gray-700">Year</p>
            <p className="text-gray-600">2nd Year</p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="font-medium text-gray-700">Semester</p>
            <p className="text-gray-600">4th</p>
          </div>
        </div>

        {/* Subjects & CGPA */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="font-medium text-gray-700 mb-2">Subjects</p>
          <ul className="list-disc list-inside text-gray-600">
            <li>Data Structures</li>
            <li>Operating Systems</li>
            <li>Database Systems</li>
          </ul>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="font-medium text-gray-700">CGPA</p>
          <p className="text-gray-600">8.5</p>
        </div>

        {/* Activities */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="font-medium text-gray-700 mb-2">Activity Summary</p>
          <ul className="list-disc list-inside text-gray-600">
            <li>5 Events Attended</li>
            <li>3 Campus Posts</li>
            <li>Member of Coding Club</li>
          </ul>
        </div>

        {/* Notifications */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="font-medium text-gray-700 mb-2">Notifications</p>
          <ul className="list-disc list-inside text-gray-600">
            <li>Midterm exam on 10th April</li>
            <li>Workshop: AI in Campus - 15th April</li>
          </ul>
        </div>

        {/* Settings */}
        <div className="flex flex-wrap gap-4 justify-center mt-4">
          <button
            onClick={() => navigate("/edit-profile")}
            className="bg-yellow-400 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-500"
          >
            Edit Profile
          </button>
          <button
            onClick={() => navigate("/change-password")}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600"
          >
            Change Password
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
