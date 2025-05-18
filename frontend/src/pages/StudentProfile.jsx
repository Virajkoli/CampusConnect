import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { FiArrowLeft } from "react-icons/fi";

const StudentProfile = ({ userData }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  return (
    <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-8">
      <button
        onClick={() => navigate("/student-dashboard")}
        className="flex items-center my-4 text-red-600 hover:text-green-800 transition-colors"
      >
        <FiArrowLeft className="mr-2" />
        Go Back
      </button>
      <h1 className="text-3xl font-bold text-center text-blue-800 mb-6">
        🎓 Student Profile
      </h1>

      {/* Profile Picture and Basic Info */}
      <div className="flex-col sm:flex-row items-center gap-6 mb-8">
        <img
          className="h-20 w-20 rounded-full object-cover mx-auto sm:mx-0"
          src={userData?.photoURL || "https://via.placeholder.com/80"}
          alt="Profile"
        />

        <div className="text-center sm:text-left mt-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {userData?.displayName || "Not Provided"}
          </h2>
          <p className="text-gray-600">{userData?.email}</p>
        </div>
      </div>

      {/* Student Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="font-medium text-gray-700">Roll Number</p>
          <p className="text-gray-600">
            {userData?.rollNumber || "Not assigned"}
          </p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="font-medium text-gray-700">Department</p>
          <p className="text-gray-600">{userData?.dept || "Not assigned"}</p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="font-medium text-gray-700">Year</p>
          <p className="text-gray-600">{userData?.year || "Not assigned"}</p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="font-medium text-gray-700">Semester</p>
          <p className="text-gray-600">
            {userData?.semester || "Not assigned"}
          </p>
        </div>
      </div>

      {/* Subjects & CGPA */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <p className="font-medium text-gray-700 mb-2">Subjects</p>
        {userData?.subjects && userData.subjects.length > 0 ? (
          <ul className="list-disc list-inside text-gray-600">
            {userData.subjects.map((subject, index) => (
              <li key={index}>{subject}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No subjects assigned</p>
        )}
      </div>

      <div className="flex flex-wrap gap-4 justify-center mt-2">
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
  );
};

export default StudentProfile;
