import React, { useEffect, useState } from "react";
import { firestore } from "../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiBell,
  FiPlus,
  FiTrash2,
  FiEdit3,
  FiEye,
  FiEyeOff,
  FiSearch,
  FiFilter,
  FiCalendar,
  FiAlertTriangle,
  FiInfo,
  FiRefreshCw,
  FiUser,
  FiX,
  FiArrowLeft,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import AnnouncementForm from "../components/AnnouncementForm";

export default function AnnouncementManagement() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [users, setUsers] = useState({});
  const [showReaders, setShowReaders] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  // Fetch all user data to map UIDs to names
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(firestore, "users"));
        const usersData = {};

        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          // Use UID as key if available, otherwise use document ID
          const userKey = userData.uid || doc.id;
          usersData[userKey] = {
            id: userKey,
            name: userData.name || userData.displayName || "Unknown User",
            email: userData.email || "",
            dept: userData.dept || "",
          };
        });

        setUsers(usersData);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    fetchUsers();
  }, []);

  // Helper function to get readable data about each student who read an announcement
  const getReadersData = (announcement) => {
    if (
      !announcement ||
      !announcement.readBy ||
      announcement.readBy.length === 0
    ) {
      return [];
    }

    return announcement.readBy.map((userId) => {
      const user = users[userId] || {
        id: userId,
        name: "Unknown User",
        email: `ID: ${userId}`,
      };
      return user;
    });
  };

  useEffect(() => {
    // Subscribe to real-time updates from Firestore
    const q = query(
      collection(firestore, "announcements"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const announcementsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAnnouncements(announcementsList);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching announcements:", err);
        setError("Failed to load announcements");
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const toggleAnnouncementStatus = async (id, currentStatus) => {
    try {
      await updateDoc(doc(firestore, "announcements", id), {
        active: !currentStatus,
      });
    } catch (error) {
      console.error("Error updating announcement status:", error);
      setError("Failed to update announcement status");
    }
  };

  const deleteAnnouncement = async (id) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      try {
        await deleteDoc(doc(firestore, "announcements", id));
      } catch (error) {
        console.error("Error deleting announcement:", error);
        setError("Failed to delete announcement");
      }
    }
  };

  const editAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setShowForm(true);
  };

  const filteredAnnouncements = announcements.filter((announcement) => {
    // Filter by search term
    const matchesSearch =
      announcement.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.message?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by active status
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && announcement.active) ||
      (filter === "inactive" && !announcement.active) ||
      filter === announcement.type;

    return matchesSearch && matchesFilter;
  });

  const getTypeColor = (type) => {
    switch (type) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "event":
        return "bg-green-100 text-green-800";
      case "academic":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";

    const date = timestamp.toDate();
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div>
        <div>
          <button
            onClick={() => navigate("/admin-dashboard")}
            className="mb-4 flex items-center text-red-900 hover:text-green-900 transition-colors"
          >
            <FiArrowLeft className="mr-2" />Go Back
          </button>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
          <FiBell className="mr-3 text-indigo-600" />
          Announcement Management
        </h1>
        <p className="text-gray-600">
          Create and manage important announcements for students and staff
        </p>
      </div>

      {/* Error message */}
      {error && (
        <motion.div
          className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center">
            <FiAlertTriangle className="text-red-500 w-5 h-5 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
          <button
            onClick={() => setError("")}
            className="text-red-500 text-sm mt-2 hover:underline"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Control Panel */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setEditingAnnouncement(null);
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-6 rounded-lg flex items-center justify-center md:justify-start"
          >
            <FiPlus className="mr-2" /> New Announcement
          </motion.button>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="relative">
              <FiFilter className="absolute left-3 top-3 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
              >
                <option value="all">All Announcements</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
                <option value="general">General</option>
                <option value="urgent">Urgent</option>
                <option value="event">Event</option>
                <option value="academic">Academic</option>
              </select>
              <div className="absolute right-3 top-3 pointer-events-none">
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
              Total
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {announcements.length}
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-green-600 text-xs font-semibold uppercase tracking-wider mb-1">
              Active
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {announcements.filter((a) => a.active).length}
            </div>
          </div>
          <div className="bg-amber-50 p-4 rounded-lg">
            <div className="text-amber-600 text-xs font-semibold uppercase tracking-wider mb-1">
              Events
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {announcements.filter((a) => a.type === "event").length}
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-red-600 text-xs font-semibold uppercase tracking-wider mb-1">
              Urgent
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {announcements.filter((a) => a.type === "urgent").length}
            </div>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <FiBell className="mr-2 text-indigo-500" />
            All Announcements
          </h2>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500">Loading announcements...</p>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex rounded-full bg-gray-100 p-4">
              <FiInfo className="h-6 w-6 text-gray-500" />
            </div>
            <h3 className="mt-5 text-base font-semibold text-gray-800">
              No announcements found
            </h3>
            <p className="mt-1 text-gray-500">
              {searchTerm || filter !== "all"
                ? "Try changing your search terms or filters"
                : "Create a new announcement to get started"}
            </p>
            <div className="mt-6">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilter("all");
                }}
                className="text-indigo-600 hover:text-indigo-500 flex items-center justify-center mx-auto"
              >
                <FiRefreshCw className="mr-2" /> Reset Filters
              </button>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            <AnimatePresence>
              {filteredAnnouncements.map((announcement) => (
                <motion.li
                  key={announcement.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-6 hover:bg-gray-50"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="mb-4 md:mb-0 md:pr-4 flex-grow">
                      <div className="flex items-center mb-2">
                        <span
                          className={`inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full mr-2 ${getTypeColor(
                            announcement.type
                          )}`}
                        >
                          {announcement.type?.charAt(0).toUpperCase() +
                            announcement.type?.slice(1) || "General"}
                        </span>
                        {!announcement.active && (
                          <span className="inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800">
                            Inactive
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        {announcement.title}
                      </h3>

                      <p className="text-gray-600 mb-2 line-clamp-2">
                        {announcement.message}
                      </p>
                      <div className="flex items-center text-xs text-gray-500">
                        <FiCalendar className="mr-1" />
                        Posted: {formatDate(announcement.createdAt)}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAnnouncement(announcement);
                            setShowReaders(true);
                          }}
                          className="ml-4 flex items-center hover:text-indigo-600 transition-colors"
                        >
                          <FiEye className="inline mr-1" />
                          {announcement.readBy?.length || 0} views
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 justify-end">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          toggleAnnouncementStatus(
                            announcement.id,
                            announcement.active
                          )
                        }
                        className={`p-2 rounded-md ${
                          announcement.active
                            ? "bg-amber-50 text-amber-700"
                            : "bg-green-50 text-green-700"
                        }`}
                        title={announcement.active ? "Deactivate" : "Activate"}
                      >
                        {announcement.active ? <FiEyeOff /> : <FiEye />}
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => editAnnouncement(announcement)}
                        className="p-2 rounded-md bg-blue-50 text-blue-700"
                        title="Edit"
                      >
                        <FiEdit3 />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => deleteAnnouncement(announcement.id)}
                        className="p-2 rounded-md bg-red-50 text-red-700"
                        title="Delete"
                      >
                        <FiTrash2 />
                      </motion.button>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      {/* Modal for Announcement Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-3xl">
              <AnnouncementForm
                onClose={() => setShowForm(false)}
                onSuccess={() => {
                  setShowForm(false);
                  // Add success notification here if needed
                }}
                editAnnouncement={editingAnnouncement}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal for Readers List */}
      <AnimatePresence>
        {showReaders && selectedAnnouncement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowReaders(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-gray-200 p-4 flex items-center justify-between bg-indigo-600 text-white">
                <div className="flex items-center">
                  <FiUser className="w-5 h-5 mr-2" />
                  <h2 className="text-lg font-semibold">
                    Read by ({selectedAnnouncement.readBy?.length || 0}{" "}
                    students)
                  </h2>
                </div>
                <button
                  onClick={() => setShowReaders(false)}
                  className="text-white hover:bg-white/20 rounded-full p-1"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div
                className="overflow-y-auto p-4"
                style={{ maxHeight: "calc(80vh - 120px)" }}
              >
                {selectedAnnouncement.readBy?.length > 0 ? (
                  <div className="space-y-2">
                    {getReadersData(selectedAnnouncement).map((user) => (
                      <div
                        key={user.id}
                        className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="font-medium text-gray-800">
                          {user.name}
                        </div>
                        <div className="text-gray-500 text-sm">
                          {user.email}
                        </div>
                        {user.dept && (
                          <div className="text-gray-500 text-sm">
                            {user.dept}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <FiEye className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">
                      No readers yet
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No students have read this announcement yet.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
