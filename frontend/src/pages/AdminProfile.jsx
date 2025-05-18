import React from "react";

const AdminProfile = ({ userData }) => {
  return (
    <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-8">
      <h1 className="text-3xl font-bold text-center text-purple-800 mb-6">
        👑 Admin Profile
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

      {/* Admin Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="font-medium text-gray-700">Admin ID</p>
          <p className="text-gray-600">{userData?.adminId || "Not assigned"}</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="font-medium text-gray-700">Role</p>
          <p className="text-gray-600">System Administrator</p>
        </div>
      </div>

      {/* Permissions */}
      <div className="bg-purple-50 p-4 rounded-lg mb-6">
        <p className="font-medium text-gray-700 mb-2">Permissions</p>
        <ul className="list-disc list-inside text-gray-600">
          <li>User Management</li>
          <li>Teacher Management</li>
          <li>Course Management</li>
          <li>Announcements</li>
          <li>System Configuration</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminProfile;