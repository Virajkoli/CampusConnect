import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiBell, FiUser } from "react-icons/fi";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { firestore, auth } from "../firebase";
import NotificationsModal from "./NotificationsModal";

const StudentNavbar = () => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(firestore, "announcements"),
      where("active", "==", true)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const unreadCount = snapshot.docs.filter(
          (doc) => !doc.data().readBy?.includes(auth.currentUser.uid)
        ).length;

        setNotificationCount(unreadCount);
      },
      (error) => {
        console.error("Error fetching notification count:", error);
        setNotificationCount(0);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <>
      <div className="flex items-center space-x-4">
        {/* Notification Bell */}{" "}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowNotifications(true)}
          className="relative p-2 rounded-full hover:bg-indigo-100 transition-colors duration-200"
          aria-label="Notifications"
        >
          <FiBell
            className={`h-5 w-5 ${
              notificationCount > 0 ? "text-indigo-600" : "text-gray-700"
            }`}
          />
          {notificationCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 min-w-[18px] min-h-[18px] text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full"
            >
              {notificationCount > 99 ? "99+" : notificationCount}
            </motion.span>
          )}
        </motion.button>{" "}
        {/* User Profile */}
        <Link to="/profile">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-indigo-100 transition-colors duration-200"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white shadow-sm">
              <FiUser className="h-4 w-4" />
            </div>
          </motion.div>
        </Link>
      </div>

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
};

export default StudentNavbar;
