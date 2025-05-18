import React, { useState } from "react";
import { firestore } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { motion } from "framer-motion";
import { FiBell, FiSend, FiX, FiAlertCircle, FiInfo } from "react-icons/fi";

const AnnouncementForm = ({ onClose, onSuccess, editAnnouncement }) => {
  const [title, setTitle] = useState(editAnnouncement?.title || "");
  const [message, setMessage] = useState(editAnnouncement?.message || "");
  const [type, setType] = useState(editAnnouncement?.type || "general"); // general, urgent, event
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      setError("Please fill out all required fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Add the announcement to Firestore
      await addDoc(collection(firestore, "announcements"), {
        title,
        message,
        type,
        createdAt: serverTimestamp(),
        active: true,
        readBy: [],
      });

      setLoading(false);
      setTitle("");
      setMessage("");
      setType("general");

      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (error) {
      console.error("Error posting announcement:", error);
      setError("Failed to post announcement. Please try again.");
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", duration: 0.5 }}
    >
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between text-white">
        <div className="flex items-center">
          <FiBell className="w-5 h-5 mr-2" />
          <h2 className="text-lg font-semibold">
            {editAnnouncement ? "Edit Announcement" : "New Announcement"}
          </h2>
        </div>
        {onClose && (
          <motion.button
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20"
          >
            <FiX className="w-5 h-5" />
          </motion.button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <div className="flex items-center">
              <FiAlertCircle className="text-red-500 w-5 h-5 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="title"
          >
            Announcement Title*
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., Important Notice about Course Registration"
            maxLength={100}
            required
          />
          <div className="mt-1 text-xs text-gray-500 flex items-center">
            <FiInfo className="w-3 h-3 mr-1" />
            Keep titles concise and descriptive
          </div>
        </div>

        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="message"
          >
            Announcement Message*
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter the full announcement details here..."
            rows={5}
            maxLength={500}
            required
          />
          <div className="flex justify-between mt-1">
            <div className="text-xs text-gray-500 flex items-center">
              <FiInfo className="w-3 h-3 mr-1" />
              Be clear and provide any necessary instructions
            </div>
            <div className="text-xs text-gray-500">{message.length}/500</div>
          </div>
        </div>

        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="type"
          >
            Announcement Type
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="general">General Information</option>
            <option value="urgent">Urgent Notice</option>
            <option value="event">Event Announcement</option>
            <option value="academic">Academic Update</option>
          </select>
        </div>

        <div className="flex justify-end pt-4">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 mr-2 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white flex items-center ${
              loading
                ? "opacity-70 cursor-not-allowed"
                : "hover:from-indigo-700 hover:to-purple-700"
            }`}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Posting...
              </>
            ) : (
              <>
                <FiSend className="mr-2" />{" "}
                {editAnnouncement ? "Update Announcement" : "Post Announcement"}
              </>
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

export default AnnouncementForm;
