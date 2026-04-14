import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiBell,
  FiDatabase,
  FiLock,
  FiSettings,
  FiUser,
} from "react-icons/fi";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { auth, firestore } from "../../firebase";
import {
  getAttendanceSettings,
  updateAttendanceSettings,
} from "../../services/attendanceService";

const AdminSettings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [adminData, setAdminData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [attendanceSettings, setAttendanceSettings] = useState({
    distanceEnforcementDefault: false,
  });
  const [attendanceSettingsLoading, setAttendanceSettingsLoading] =
    useState(true);
  const [attendanceSettingsSaving, setAttendanceSettingsSaving] =
    useState(false);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setIsLoading(true);
        const user = auth.currentUser;

        if (!user) {
          setAttendanceSettingsLoading(false);
          return;
        }

        const [docSnap, settingsResult] = await Promise.all([
          getDoc(doc(firestore, "users", user.uid)),
          getAttendanceSettings().catch(() => null),
        ]);

        if (docSnap.exists()) {
          setAdminData(docSnap.data());
        }

        const defaultSetting =
          settingsResult?.settings?.distanceEnforcementDefault;
        if (typeof defaultSetting === "boolean") {
          setAttendanceSettings({
            distanceEnforcementDefault: defaultSetting,
          });
        }
      } catch (error) {
        console.error("Error fetching admin data:", error);
        toast.error("Failed to load admin settings.");
      } finally {
        setAttendanceSettingsLoading(false);
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const handleDistanceEnforcementToggle = async (event) => {
    const nextValue = Boolean(event.target.checked);
    const previousValue = attendanceSettings.distanceEnforcementDefault;

    setAttendanceSettings((prev) => ({
      ...prev,
      distanceEnforcementDefault: nextValue,
    }));
    setAttendanceSettingsSaving(true);

    try {
      await updateAttendanceSettings({
        distanceEnforcementDefault: nextValue,
      });
      toast.success("Attendance location enforcement updated.");
    } catch (error) {
      setAttendanceSettings((prev) => ({
        ...prev,
        distanceEnforcementDefault: previousValue,
      }));
      toast.error(error.message || "Failed to update attendance setting.");
    } finally {
      setAttendanceSettingsSaving(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile Settings", icon: <FiUser /> },
    { id: "security", label: "Security", icon: <FiLock /> },
    { id: "notifications", label: "Notifications", icon: <FiBell /> },
    { id: "system", label: "System Settings", icon: <FiDatabase /> },
  ];

  return (
    <div className="min-h-screen bg-[#eef2f6] p-4 sm:p-6">
      <button
        onClick={() => navigate("/admin-dashboard")}
        className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:text-[#2f87d9] sm:px-4 sm:py-2 sm:text-sm"
      >
        <FiArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-6xl"
      >
        <div className="mb-8 flex flex-col items-start justify-between md:flex-row md:items-center">
          <div>
            <h1 className="mb-2 flex items-center text-2xl font-bold text-slate-800 md:text-3xl">
              <FiSettings className="mr-2 text-[#2f87d9]" /> Admin Settings
            </h1>
            <p className="text-slate-600">
              Configure your administrative settings and preferences
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="h-fit rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4"
          >
            <nav className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1 md:gap-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`mb-2 flex w-full items-center rounded-md p-3 transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-indigo-50 font-medium text-[#2f87d9]"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="mr-3">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="col-span-1 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6 md:col-span-3"
          >
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-indigo-500" />
              </div>
            ) : (
              <>
                {activeTab === "profile" && (
                  <div>
                    <h2 className="mb-4 text-xl font-semibold">
                      Profile Settings
                    </h2>
                    <div className="space-y-4">
                      <div className="rounded-lg bg-slate-50 p-4">
                        <h3 className="mb-2 font-medium text-slate-700">
                          Admin Information
                        </h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <p className="text-sm text-slate-500">Name</p>
                            <p className="font-medium">
                              {adminData.name || "Not set"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">Email</p>
                            <p className="font-medium">
                              {adminData.email || "Not set"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">Role</p>
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
                    <h2 className="mb-4 text-xl font-semibold">
                      Security Settings
                    </h2>
                    <p className="mb-6 text-slate-600">
                      Manage your account security settings and preferences
                    </p>
                    <div className="rounded-lg bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">
                        Security settings will be implemented soon
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === "notifications" && (
                  <div>
                    <h2 className="mb-4 text-xl font-semibold">
                      Notification Preferences
                    </h2>
                    <p className="mb-6 text-slate-600">
                      Manage how you receive notifications from the system
                    </p>
                    <div className="rounded-lg bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">
                        Notification settings will be implemented soon
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === "system" && (
                  <div>
                    <h2 className="mb-4 text-xl font-semibold">
                      System Settings
                    </h2>
                    <p className="mb-6 text-slate-600">
                      Configure global system settings
                    </p>
                    <div className="space-y-4">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              Enforce Student Location Radius By Default
                            </p>
                            <p className="mt-1 text-xs text-slate-600">
                              When enabled, new attendance sessions require
                              students to be within the configured radius unless
                              the teacher disables it for that specific session.
                            </p>
                          </div>

                          <label className="inline-flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-600">
                              {attendanceSettings.distanceEnforcementDefault
                                ? "ON"
                                : "OFF"}
                            </span>
                            <input
                              type="checkbox"
                              checked={
                                attendanceSettings.distanceEnforcementDefault
                              }
                              onChange={handleDistanceEnforcementToggle}
                              disabled={
                                attendanceSettingsLoading ||
                                attendanceSettingsSaving
                              }
                              className="h-4 w-4 rounded border-slate-300 text-[#2f87d9] focus:ring-[#2f87d9]"
                            />
                          </label>
                        </div>

                        {attendanceSettingsSaving ? (
                          <p className="mt-2 text-xs text-slate-500">
                            Saving setting...
                          </p>
                        ) : null}

                        {attendanceSettingsLoading ? (
                          <p className="mt-2 text-xs text-slate-500">
                            Loading setting...
                          </p>
                        ) : null}
                      </div>
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
