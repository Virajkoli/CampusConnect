import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiSettings, FiUser, FiLock, FiBell, FiDatabase } from "react-icons/fi";
import { firestore, auth } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [adminData, setAdminData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setIsLoading(true);
        const user = auth.currentUser;
        if (user) {
          const userRef = doc(firestore, "users", user.uid);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            setAdminData(docSnap.data());
          }
        }
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const tabs = [
    { id: "profile", label: "Profile Settings", icon: <FiUser /> },
    { id: "security", label: "Security", icon: <FiLock /> },
    { id: "notifications", label: "Notifications", icon: <FiBell /> },
    { id: "system", label: "System Settings", icon: <FiDatabase /> },
  ];

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center mb-2">
              <FiSettings className="mr-2 text-indigo-600" /> Admin Settings
            </h1>
            <p className="text-gray-600">
              Configure your administrative settings and preferences
            </p>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-fit"
          >
            <nav>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center p-3 mb-2 rounded-md transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-indigo-50 text-indigo-600 font-medium"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <span className="mr-3">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </motion.div>

          {/* Content Area */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 col-span-1 md:col-span-3"
          >
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <>
                {activeTab === "profile" && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">
                      Profile Settings
                    </h2>
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-700 mb-2">
                          Admin Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Name</p>
                            <p className="font-medium">
                              {adminData.name || "Not set"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium">
                              {adminData.email || "Not set"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Role</p>
                            <p className="font-medium">
                              {adminData.role || "Admin"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "security" && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">
                      Security Settings
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Manage your account security settings and preferences
                    </p>
                    {/* Security settings content would go here */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">
                        Security settings will be implemented soon
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === "notifications" && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">
                      Notification Preferences
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Manage how you receive notifications from the system
                    </p>
                    {/* Notification settings content would go here */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">
                        Notification settings will be implemented soon
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === "system" && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">
                      System Settings
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Configure global system settings
                    </p>
                    {/* System settings content would go here */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">
                        System settings will be implemented soon
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminSettings;
