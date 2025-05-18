import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { firestore, auth } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { FiBell, FiCalendar, FiInfo, FiAlertCircle } from "react-icons/fi";
import AnnouncementsBanner from "../components/AnnouncementsBanner";
import NotificationsModal from "../components/NotificationsModal";

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const q = query(
      collection(firestore, "announcements"),
      where("active", "==", true),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const announcementsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        isRead: doc.data().readBy?.includes(auth.currentUser?.uid) || false,
      }));
      setAnnouncements(announcementsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
        return "bg-red-50 border-red-200";
      case "event":
        return "bg-green-50 border-green-200";
      case "academic":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-indigo-50 border-indigo-200";
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

  return (
    <div className="min-h-screen bg-gray-50">
      <AnnouncementsBanner />

      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">
              Announcements
            </h1>
            <p className="text-gray-600">
              Stay updated with the latest campus news and events
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center"
          >
            <FiBell className="mr-2" /> View All Notifications
          </motion.button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
              <FiBell className="w-8 h-8 text-indigo-500" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No announcements yet
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Check back later for campus news and updates
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {announcements.map((announcement) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`p-5 rounded-xl shadow-sm border ${getTypeBg(
                  announcement.type
                )} ${
                  !announcement.isRead
                    ? "ring-2 ring-offset-2 ring-indigo-300"
                    : ""
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center mb-2">
                      <div className="p-2 rounded-full bg-white shadow-sm mr-3">
                        {getTypeIcon(announcement.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {announcement.title}
                          {!announcement.isRead && (
                            <span className="ml-2 bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full">
                              New
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(announcement.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="pl-12 text-gray-700 whitespace-pre-wrap">
                      {announcement.message}
                    </div>
                  </div>
                  <div className="md:text-right">
                    <span className="inline-block px-3 py-1 bg-white shadow-sm rounded-full text-xs uppercase font-semibold">
                      {announcement.type || "General"}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <NotificationsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
};

export default Announcements;
