import React, { useState, useEffect } from "react";
import { auth, firestore } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate , Link} from "react-router-dom";
import { FiSearch, FiLogOut } from "react-icons/fi";
import {
  FaEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaBell,
  FaComments,
} from "react-icons/fa";
import { PiStudentFill } from "react-icons/pi";
import { GiTeacher } from "react-icons/gi";
import { IoHome } from "react-icons/io5";
import CalendarComponent from "../Components/CalendarComponent";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
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
    };

    const checkAdmin = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const tokenResult = await currentUser.getIdTokenResult();
        if (!tokenResult.claims.admin) {
          navigate("/auth/admin");
        } else {
          fetchUsers();
        }
      } else {
        navigate("/auth/admin");
      }
    };

    checkAdmin();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#e0eafc] via-[#cfdef3] to-[#dcdfe2] text-gray-800 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-indigo-600 via-purple-500 to-indigo-600 text-white p-6 flex flex-col space-y-6 relative">
        <h2 className="text-2xl font-bold mb-4">Akademi</h2>
        {/* Admin Mini Profile Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 shadow-md flex items-center space-x-3">
          <img
            src="https://i.pravatar.cc/100?img=12"
            alt="Admin"
            className="w-12 h-12 rounded-full object-cover border-2 border-white"
          />
          <div>
            <p className="font-semibold text-sm">Nabila Azalea</p>
            <p className="text-xs text-gray-200">Admin</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className=" space-y-4 mt-6">
          <SidebarItem icon={<PiStudentFill />} label="Students" path="/admin-adduser" />
          <SidebarItem icon={<IoHome />} label="Dashboard" />
          <SidebarItem icon={<GiTeacher />} label="Teachers" />
          <SidebarItem icon={<FaComments />} label="Chat" />
          <SidebarItem icon={<FaBell />} label="Notifications" />
          <SidebarItem icon={<FiLogOut />} label="Logout" path="/logout" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 space-y-6">
        {/* Topbar */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-center space-x-2">
                <FaPhoneAlt />
                <span>+12 345 6789 0</span>
              </div>
              <div className="flex items-center space-x-2">
                <FaEnvelope />
                <span>jordan@mail.com</span>
              </div>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search here..."
                className="px-4 py-2 border rounded-lg pl-10"
              />
              <FiSearch className="absolute top-2.5 left-3 text-gray-400" />
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-300" />
          </div>
        </div>

        {/* 3 Columns: Contacts, Messages, Activity */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-7">
          {/* Contacts */}
          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-2">Contacts</h3>
            <input
              type="text"
              placeholder="Search here..."
              className="w-full mb-2 px-3 py-2 border rounded"
            />
            <div className="space-y-3 overflow-y-auto max-h-80">
              {users.slice(0, 5).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <img
                      src={`https://i.pravatar.cc/40?u=${user.email}`}
                      alt=""
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-xs text-gray-500">
                        {user.role || "User"}
                      </p>
                    </div>
                  </div>
                  <button className="text-blue-500 hover:underline">✉️</button>
                </div>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-2">Messages</h3>
            <input
              type="text"
              placeholder="Search here..."
              className="w-full mb-2 px-3 py-2 border rounded"
            />
            <div className="space-y-3 overflow-y-auto max-h-80">
              {users.slice(0, 5).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <img
                      src={`https://i.pravatar.cc/40?u=${user.email}`}
                      alt=""
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-xs text-gray-500">
                        Lorem ipsum dolor sit amet...
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">12:45 PM</p>
                </div>
              ))}
            </div>
          </div>

          {/* Latest Activity */}
          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-2">Latest Activity</h3>
            <div className="space-y-4 text-sm max-h-80 overflow-y-auto">
              <div className="flex items-start space-x-2">
                <img
                  src="https://i.pravatar.cc/40?img=8"
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <p>
                    <strong>Karen Hope</strong> moved task{" "}
                    <span className="text-blue-600">"User Research"</span> to{" "}
                    <span className="text-green-600">Done</span>
                  </p>
                  <p className="text-gray-400 text-xs">
                    2 March 2023, 18:45 PM
                  </p>
                </div>
              </div>
              
            </div>
          </div>
          <div className="  p-4  overflow-auto">
                <CalendarComponent />
              </div>
        </div>
      </main>
    </div>
  );
}

// SidebarItem Component
function SidebarItem({ icon, label, path }) {
  return (
    <Link
      to={path || "#"}
      className="flex items-center space-x-3 hover:bg-white hover:text-[#4776e6] px-4 py-2 rounded-lg transition"
    >
      <div className="text-lg">{icon}</div>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
