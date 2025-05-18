import { useNavigate } from "react-router-dom";
import { auth } from "../firebase"; 

const TeacherProfile = ({ userData }) => {
    const navigate = useNavigate();

   const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };
  return (
    <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-8">
      <h1 className="text-3xl font-bold text-center text-green-800 mb-6">
        👨‍🏫 Teacher Profile
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
            {userData?.displayName || userData?.name || "Not Provided"}
          </h2>
          <p className="text-gray-600">{userData?.email}</p>
        </div>
      </div>

      {/* Teacher Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="font-medium text-gray-700">Employee ID</p>
          <p className="text-gray-600">{userData?.employeeId || "Not assigned"}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="font-medium text-gray-700">Department</p>
          <p className="text-gray-600">{userData?.dept || "Not assigned"}</p>
        </div>
      </div>

      {/* Courses */}
      <div className="bg-green-50 p-4 rounded-lg mb-6">
        <p className="font-medium text-gray-700 mb-2">Assigned Courses</p>
        {userData?.assignedCourses && userData.assignedCourses.length > 0 ? (
          <div>
            {userData.assignedCourses.map((course, idx) => (
              <div key={idx} className="mb-3 p-3 bg-white rounded-lg">
                <h3 className="font-medium">{course.year} Year</h3>
                <ul className="list-disc list-inside text-gray-600 mt-1">
                  {course.subjects.map((subject, sidx) => (
                    <li key={sidx}>{subject}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No courses assigned</p>
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

export default TeacherProfile;