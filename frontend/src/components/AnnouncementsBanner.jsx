import React, { useEffect, useState } from "react";
import { firestore } from "../firebase";
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
  FiChevronLeft,
  FiChevronRight,
  FiInfo,
  FiAlertCircle,
  FiCalendar,
} from "react-icons/fi";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";

const AnnouncementsBanner = () => {
  const [user] = useAuthState(auth);
  const [announcements, setAnnouncements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Get active announcements, ordered by most recent first
    const q = query(
      collection(firestore, "announcements"),
      where("active", "==", true),
      orderBy("createdAt", "desc"),
      limit(10) // Limit to last 10 announcements
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const announcementsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAnnouncements(announcementsList);
      setLoading(false);

      // Mark as read if there are announcements and user is logged in
      if (announcementsList.length > 0 && user) {
        markAnnouncementAsRead(announcementsList[currentIndex].id);
      }
    });

    return () => unsubscribe();
  }, [user, currentIndex]);

  // Mark the current announcement as read by this user
  const markAnnouncementAsRead = async (announcementId) => {
    if (!user || !announcementId) return;

    try {
      await updateDoc(doc(firestore, "announcements", announcementId), {
        readBy: arrayUnion(user.uid),
      });
    } catch (error) {
      console.error("Error marking announcement as read:", error);
    }
  };

  const nextAnnouncement = () => {
    if (currentIndex < announcements.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      markAnnouncementAsRead(announcements[nextIndex].id);
    }
  };

  const prevAnnouncement = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      markAnnouncementAsRead(announcements[prevIndex].id);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";

    const date = timestamp.toDate();
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Don't render if there are no announcements or still loading
  if (loading) return null;
  if (announcements.length === 0) return null;

  const currentAnnouncement = announcements[currentIndex];
  const getTypeIcon = (type) => {
    switch (type) {
      case "urgent":
        return <FiAlertCircle className="text-red-500" />;
      case "event":
        return <FiCalendar className="text-green-500" />;
      default:
        return <FiInfo className="text-blue-500" />;
    }
  };

  const getTypeBg = (type) => {
    switch (type) {
      case "urgent":
        return "bg-red-50 border-red-200";
      case "event":
        return "bg-green-50 border-green-200";
      case "academic":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-indigo-50 border-indigo-200";
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        exit={{ y: -100 }}
        className={`fixed top-0 left-0 right-0 z-50 mx-auto max-w-5xl shadow-lg border ${getTypeBg(
          currentAnnouncement.type
        )} rounded-b-lg`}
        style={{ maxWidth: expanded ? "42rem" : "36rem" }}
        id="announcement-banner"
      >
        <motion.div layout className="p-3 px-4 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-white p-1.5 rounded-full shadow-sm">
                <FiBell className="w-5 h-5 text-indigo-600" />
              </div>

              <div className="text-sm text-gray-800">
                <div
                  className={`font-medium line-clamp-1 ${
                    expanded ? "" : "max-w-xs"
                  }`}
                >
                  {currentAnnouncement.title}
                </div>
                {!expanded && (
                  <div className="text-xs text-gray-600 flex items-center">
                    {getTypeIcon(currentAnnouncement.type)}
                    <span className="ml-1 capitalize">
                      {currentAnnouncement.type || "General"}
                    </span>
                    <span className="mx-1">•</span>
                    <span>{formatDate(currentAnnouncement.createdAt)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-gray-500 hover:text-indigo-600 p-1 rounded-full hover:bg-white"
              >
                {expanded ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>

              <button
                onClick={() =>
                  document.getElementById("announcement-banner")?.remove()
                }
                className="text-gray-500 hover:text-red-600 p-1 rounded-full hover:bg-white"
                aria-label="Close announcement"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>

          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2"
            >
              <p className="text-sm text-gray-800 whitespace-pre-wrap mb-2">
                {currentAnnouncement.message}
              </p>

              <div className="flex items-center justify-between mt-3 text-xs text-gray-600">
                <div className="flex items-center">
                  {getTypeIcon(currentAnnouncement.type)}
                  <span className="ml-1 capitalize">
                    {currentAnnouncement.type || "General"}
                  </span>
                  <span className="mx-1">•</span>
                  <span>{formatDate(currentAnnouncement.createdAt)}</span>
                </div>

                {announcements.length > 1 && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={prevAnnouncement}
                      disabled={currentIndex === 0}
                      className={`p-1 rounded-full ${
                        currentIndex === 0
                          ? "text-gray-300"
                          : "text-gray-500 hover:text-indigo-600 hover:bg-white"
                      }`}
                    >
                      <FiChevronLeft className="w-4 h-4" />
                    </button>

                    <span className="text-xs">
                      {currentIndex + 1} / {announcements.length}
                    </span>

                    <button
                      onClick={nextAnnouncement}
                      disabled={currentIndex === announcements.length - 1}
                      className={`p-1 rounded-full ${
                        currentIndex === announcements.length - 1
                          ? "text-gray-300"
                          : "text-gray-500 hover:text-indigo-600 hover:bg-white"
                      }`}
                    >
                      <FiChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AnnouncementsBanner;
