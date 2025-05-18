import React, { useEffect, useState } from "react";
import { firestore, auth } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiBell,
  FiX,
  FiAlertCircle,
  FiInfo,
  FiCalendar,
  FiCheck,
} from "react-icons/fi";

const NotificationsModal = ({ isOpen, onClose }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("all");
  useEffect(() => {
    if (!isOpen) return;

    // Get active announcements, ordered by most recent first
    try {
      // Try the query with ordering that requires the composite index
      const q = query(
        collection(firestore, "announcements"),
        where("active", "==", true),
        orderBy("createdAt", "desc"),
        limit(20) // Limit to last 20 announcements
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const announcementsList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            isRead: doc.data().readBy?.includes(auth.currentUser?.uid) || false,
          }));
          setAnnouncements(announcementsList);
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching announcements:", error);

          // If composite index error occurs, fall back to a simpler query
          console.log(
            "Falling back to simple query. Please create the required index in Firebase console."
          );
          const simpleQuery = query(
            collection(firestore, "announcements"),
            where("active", "==", true)
          );

          const fallbackUnsubscribe = onSnapshot(simpleQuery, (snapshot) => {
            // Sort manually (not as efficient but works without the index)
            const announcementsList = snapshot.docs
              .map((doc) => ({
                id: doc.id,
                ...doc.data(),
                isRead:
                  doc.data().readBy?.includes(auth.currentUser?.uid) || false,
              }))
              .sort((a, b) => {
                // Sort by createdAt in descending order if available
                if (a.createdAt && b.createdAt) {
                  return b.createdAt.seconds - a.createdAt.seconds;
                }
                return 0;
              })
              .slice(0, 20); // Apply limit manually

            setAnnouncements(announcementsList);
            setLoading(false);
          });

          return fallbackUnsubscribe;
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error("Error setting up announcements listener:", error);
      setLoading(false);
      return () => {}; // Return empty cleanup function
    }

    return () => unsubscribe();
  }, [isOpen]);

  // Mark announcement as read
  const markAsRead = async (announcementId) => {
    if (!auth.currentUser || !announcementId) return;

    try {
      await updateDoc(doc(firestore, "announcements", announcementId), {
        readBy: arrayUnion(auth.currentUser.uid),
      });

      // Update local state to reflect the change
      setAnnouncements((prev) =>
        prev.map((announcement) =>
          announcement.id === announcementId
            ? { ...announcement, isRead: true }
            : announcement
        )
      );
    } catch (error) {
      console.error("Error marking announcement as read:", error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";

    const date = timestamp.toDate();
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "urgent":
        return <FiAlertCircle className="text-red-500" />;
      case "event":
        return <FiCalendar className="text-green-500" />;
      case "academic":
        return <FiInfo className="text-blue-500" />;
      default:
        return <FiInfo className="text-indigo-500" />;
    }
  };

  const getTypeBg = (type) => {
    switch (type) {
      case "urgent":
        return "bg-red-50";
      case "event":
        return "bg-green-50";
      case "academic":
        return "bg-blue-50";
      default:
        return "bg-gray-50";
    }
  };

  const filteredAnnouncements =
    selectedTab === "all"
      ? announcements
      : selectedTab === "unread"
      ? announcements.filter((a) => !a.isRead)
      : announcements.filter((a) => a.type === selectedTab);

  const unreadCount = announcements.filter((a) => !a.isRead).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
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
                <FiBell className="w-5 h-5 mr-2" />
                <h2 className="text-lg font-semibold">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-full p-1"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="border-b border-gray-200">
              <div className="flex px-4 overflow-x-auto">
                <button
                  onClick={() => setSelectedTab("all")}
                  className={`px-4 py-2 border-b-2 whitespace-nowrap ${
                    selectedTab === "all"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-gray-600 hover:text-gray-800"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedTab("unread")}
                  className={`px-4 py-2 border-b-2 whitespace-nowrap ${
                    selectedTab === "unread"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Unread
                </button>
                <button
                  onClick={() => setSelectedTab("urgent")}
                  className={`px-4 py-2 border-b-2 whitespace-nowrap ${
                    selectedTab === "urgent"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Urgent
                </button>
                <button
                  onClick={() => setSelectedTab("event")}
                  className={`px-4 py-2 border-b-2 whitespace-nowrap ${
                    selectedTab === "event"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Events
                </button>
                <button
                  onClick={() => setSelectedTab("academic")}
                  className={`px-4 py-2 border-b-2 whitespace-nowrap ${
                    selectedTab === "academic"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Academic
                </button>
              </div>
            </div>

            <div
              className="overflow-y-auto"
              style={{ maxHeight: "calc(80vh - 120px)" }}
            >
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
              ) : filteredAnnouncements.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <FiBell className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    No notifications
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedTab === "all"
                      ? "You don't have any notifications at the moment."
                      : selectedTab === "unread"
                      ? "You have read all notifications."
                      : `You don't have any ${selectedTab} notifications.`}
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {filteredAnnouncements.map((announcement) => (
                    <li
                      key={announcement.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !announcement.isRead ? "bg-blue-50/30" : ""
                      }`}
                      onClick={() =>
                        !announcement.isRead && markAsRead(announcement.id)
                      }
                    >
                      <div
                        className={`${getTypeBg(announcement.type)} ${
                          !announcement.isRead
                            ? "border-l-4 border-indigo-500"
                            : ""
                        } rounded-lg p-3`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center">
                            <div className="mr-2 bg-white p-1.5 rounded-full shadow-sm">
                              {getTypeIcon(announcement.type)}
                            </div>
                            <h3 className="font-medium text-gray-900">
                              {announcement.title}
                            </h3>
                          </div>

                          {!announcement.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(announcement.id);
                              }}
                              className="text-indigo-600 hover:text-indigo-700 p-1 hover:bg-white rounded-full"
                              title="Mark as read"
                            >
                              <FiCheck className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <p className="mb-2 text-gray-600 text-sm whitespace-pre-wrap">
                          {announcement.message}
                        </p>

                        <div className="text-xs text-gray-500 flex justify-between">
                          <div className="flex items-center">
                            <span>
                              Posted: {formatDate(announcement.createdAt)}
                            </span>
                          </div>
                          <span className="uppercase font-medium">
                            {announcement.type || "general"}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationsModal;
