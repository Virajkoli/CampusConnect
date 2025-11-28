import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { firestore, auth } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  FiCalendar,
  FiClock,
  FiArrowLeft,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiCheckCircle,
  FiX,
  FiSave,
} from "react-icons/fi";
import {
  FaGraduationCap,
  FaFlask,
  FaCalendarAlt,
  FaClipboardList,
  FaUmbrellaBeach,
  FaUserTie,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

// Default Academic Calendar Data for 2025-26
const defaultAcademicCalendarData = [
  {
    activity: "Commencement of Odd Semester (III, V, and VII)",
    dateSlots: "28 July 2025",
    startDate: "2025-07-28",
    endDate: "2025-07-28",
    responsibility: "Dean (Academics) and HoD",
    category: "academic",
    color: "blue",
    icon: "graduation",
  },
  {
    activity:
      "Admission formalities, registration, re-registration in offline mode",
    dateSlots: "28 July 2025",
    startDate: "2025-07-28",
    endDate: "2025-07-28",
    responsibility: "Office and HoD",
    category: "academic",
    color: "blue",
    icon: "book",
  },
  {
    activity:
      "Selection of MDM, OE, PE, Honour and double minor for SY B.Tech. under NEP2020",
    dateSlots: "28 July – 2 Aug, 2025",
    startDate: "2025-07-28",
    endDate: "2025-08-02",
    responsibility: "Dean (Academics) and HoD",
    category: "academic",
    color: "blue",
    icon: "book",
  },
  {
    activity: "Selection of PE, OE and MOOC for Third and Final Year",
    dateSlots: "28 July – 2 Aug, 2025",
    startDate: "2025-07-28",
    endDate: "2025-08-02",
    responsibility: "Dean (Academics) and HoD",
    category: "academic",
    color: "blue",
    icon: "book",
  },
  {
    activity: "MSE based on 50% syllabus",
    dateSlots: "22 – 25 Sept., 2025",
    startDate: "2025-09-22",
    endDate: "2025-09-25",
    responsibility: "HoD",
    category: "exam",
    color: "yellow",
    icon: "clipboard",
  },
  {
    activity: "Technical Events (Co-curricular activities)",
    dateSlots: "3 – 5 Oct, 2025",
    startDate: "2025-10-03",
    endDate: "2025-10-05",
    responsibility: "Dean (S. A.)",
    category: "event",
    color: "cyan",
    icon: "flask",
  },
  {
    activity: "Submission of term work of all courses (Winter 2025)",
    dateSlots: "14 Nov., 2025",
    startDate: "2025-11-14",
    endDate: "2025-11-14",
    responsibility: "Course Teacher and Coordinator",
    category: "academic",
    color: "blue",
    icon: "check",
  },
  {
    activity:
      "Meeting of all faculty members regarding finalizing list of Not Eligible (NE) Students due to lack of attendance",
    dateSlots: "14 Nov., 2025",
    startDate: "2025-11-14",
    endDate: "2025-11-14",
    responsibility: "HoD",
    category: "academic",
    color: "blue",
    icon: "user",
  },
  {
    activity: "End of odd semester",
    dateSlots: "14 Nov., 2025",
    startDate: "2025-11-14",
    endDate: "2025-11-14",
    responsibility: "HoD",
    category: "academic",
    color: "blue",
    icon: "calendar",
  },
  {
    activity: "ESE laboratory exam (PR-ESE Winter 2025)",
    dateSlots: "17 - 24 Nov., 2025",
    startDate: "2025-11-17",
    endDate: "2025-11-24",
    responsibility: "HoD and CoE",
    category: "exam",
    color: "orange",
    icon: "flask",
  },
  {
    activity: "ESE theory exam (TH-ESE Winter 2025)",
    dateSlots: "26 Nov - 11 Dec, 2025",
    startDate: "2025-11-26",
    endDate: "2025-12-11",
    responsibility: "CoE",
    category: "exam",
    color: "red",
    icon: "clipboard",
  },
  {
    activity: "Winter vacation / Internship-slot for students",
    dateSlots: "12 Dec, 2025 – 3 Jan, 2026",
    startDate: "2025-12-12",
    endDate: "2026-01-03",
    responsibility: "--",
    category: "holiday",
    color: "green",
    icon: "umbrella",
  },
  {
    activity: "Commencement of Even Semester for Academic Year 2025-26",
    dateSlots: "5 January, 2026",
    startDate: "2026-01-05",
    endDate: "2026-01-05",
    responsibility: "Dean (Academics) and HoD",
    category: "academic",
    color: "purple",
    icon: "graduation",
  },
];

const iconMap = {
  graduation: FaGraduationCap,
  book: FiCalendar,
  clipboard: FaClipboardList,
  flask: FaFlask,
  check: FiCheckCircle,
  user: FaUserTie,
  calendar: FiCalendar,
  umbrella: FaUmbrellaBeach,
};

function AcademicCalendar() {
  const [user] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [academicEvents, setAcademicEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    activity: "",
    dateSlots: "",
    startDate: "",
    endDate: "",
    responsibility: "",
    category: "academic",
    color: "blue",
    icon: "calendar",
  });

  const categories = [
    { id: "academic", name: "Academic", color: "blue" },
    { id: "exam", name: "Examination", color: "red" },
    { id: "event", name: "Event", color: "cyan" },
    { id: "holiday", name: "Holiday", color: "green" },
  ];

  const colors = ["blue", "yellow", "orange", "red", "cyan", "green", "purple"];

  // Check if user is admin
  useEffect(() => {
    const checkUserRole = async () => {
      if (user) {
        const adminQuery = query(
          collection(firestore, "admins"),
          where("uid", "==", user.uid)
        );
        const adminSnapshot = await getDocs(adminQuery);
        setIsAdmin(!adminSnapshot.empty);
      }
    };
    checkUserRole();
  }, [user]);

  // Fetch academic calendar events
  useEffect(() => {
    const fetchAcademicEvents = async () => {
      setLoading(true);
      try {
        const eventsQuery = query(
          collection(firestore, "academicCalendar"),
          orderBy("startDate")
        );
        const snapshot = await getDocs(eventsQuery);

        if (snapshot.empty) {
          // Initialize with default data if empty
          setAcademicEvents(
            defaultAcademicCalendarData.map((item, index) => ({
              ...item,
              id: `default-${index}`,
            }))
          );
        } else {
          const events = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setAcademicEvents(events);
        }
      } catch (error) {
        console.error("Error fetching academic calendar:", error);
        // Use default data on error
        setAcademicEvents(
          defaultAcademicCalendarData.map((item, index) => ({
            ...item,
            id: `default-${index}`,
          }))
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAcademicEvents();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        // Update existing event
        if (!editingEvent.id.startsWith("default-")) {
          await updateDoc(
            doc(firestore, "academicCalendar", editingEvent.id),
            formData
          );
        } else {
          // Convert default to real document
          await addDoc(collection(firestore, "academicCalendar"), formData);
        }
        toast.success("Event updated successfully");
      } else {
        // Add new event
        await addDoc(collection(firestore, "academicCalendar"), formData);
        toast.success("Event added successfully");
      }

      // Refresh events
      const eventsQuery = query(
        collection(firestore, "academicCalendar"),
        orderBy("startDate")
      );
      const snapshot = await getDocs(eventsQuery);
      const events = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAcademicEvents(
        events.length > 0
          ? events
          : defaultAcademicCalendarData.map((item, index) => ({
              ...item,
              id: `default-${index}`,
            }))
      );

      resetForm();
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error("Failed to save event");
    }
  };

  const handleDelete = async (eventId) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      if (!eventId.startsWith("default-")) {
        await deleteDoc(doc(firestore, "academicCalendar", eventId));
      }
      setAcademicEvents(academicEvents.filter((e) => e.id !== eventId));
      toast.success("Event deleted successfully");
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    }
  };

  const editEvent = (event) => {
    setEditingEvent(event);
    setFormData({
      activity: event.activity,
      dateSlots: event.dateSlots,
      startDate: event.startDate,
      endDate: event.endDate,
      responsibility: event.responsibility,
      category: event.category,
      color: event.color,
      icon: event.icon || "calendar",
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      activity: "",
      dateSlots: "",
      startDate: "",
      endDate: "",
      responsibility: "",
      category: "academic",
      color: "blue",
      icon: "calendar",
    });
    setEditingEvent(null);
    setShowForm(false);
  };

  const getIconComponent = (iconName) => {
    return iconMap[iconName] || FiCalendar;
  };

  const colorClasses = {
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-400",
      icon: "bg-blue-500",
      text: "text-blue-700",
      badge: "bg-blue-100 text-blue-700",
    },
    yellow: {
      bg: "bg-yellow-50",
      border: "border-yellow-400",
      icon: "bg-yellow-500",
      text: "text-yellow-700",
      badge: "bg-yellow-100 text-yellow-700",
    },
    orange: {
      bg: "bg-orange-50",
      border: "border-orange-400",
      icon: "bg-orange-500",
      text: "text-orange-700",
      badge: "bg-orange-100 text-orange-700",
    },
    red: {
      bg: "bg-red-50",
      border: "border-red-400",
      icon: "bg-red-500",
      text: "text-red-700",
      badge: "bg-red-100 text-red-700",
    },
    cyan: {
      bg: "bg-cyan-50",
      border: "border-cyan-400",
      icon: "bg-cyan-500",
      text: "text-cyan-700",
      badge: "bg-cyan-100 text-cyan-700",
    },
    green: {
      bg: "bg-green-50",
      border: "border-green-400",
      icon: "bg-green-500",
      text: "text-green-700",
      badge: "bg-green-100 text-green-700",
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-400",
      icon: "bg-purple-500",
      text: "text-purple-700",
      badge: "bg-purple-100 text-purple-700",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 pt-10 pb-10">
      {/* Back Button */}
      <button
        onClick={() => navigate("/calendars")}
        className="flex items-center ml-8 my-4 text-indigo-600 hover:text-indigo-800 transition-colors"
      >
        <FiArrowLeft className="mr-2" />
        Back to Calendars
      </button>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FaCalendarAlt className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Academic Calendar 2025-26
              </h1>
              <p className="text-gray-500 mt-1">Odd Semester Schedule</p>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl transition shadow-lg"
            >
              {showForm ? <FiX /> : <FiPlus />}
              {showForm ? "Cancel" : "Add Event"}
            </button>
          )}
        </motion.div>

        {/* Add/Edit Form */}
        <AnimatePresence>
          {showForm && isAdmin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-2xl shadow-xl p-6 mb-8 overflow-hidden"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {editingEvent ? "Edit Event" : "Add New Event"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 mb-1 font-medium">
                      Activity*
                    </label>
                    <input
                      type="text"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-indigo-500 focus:outline-none"
                      value={formData.activity}
                      onChange={(e) =>
                        setFormData({ ...formData, activity: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-1 font-medium">
                      Date/Slots Display*
                    </label>
                    <input
                      type="text"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-indigo-500 focus:outline-none"
                      value={formData.dateSlots}
                      onChange={(e) =>
                        setFormData({ ...formData, dateSlots: e.target.value })
                      }
                      placeholder="e.g., 28 July 2025"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-1 font-medium">
                      Responsibility*
                    </label>
                    <input
                      type="text"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-indigo-500 focus:outline-none"
                      value={formData.responsibility}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          responsibility: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-1 font-medium">
                      Start Date*
                    </label>
                    <input
                      type="date"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-indigo-500 focus:outline-none"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-1 font-medium">
                      End Date*
                    </label>
                    <input
                      type="date"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-indigo-500 focus:outline-none"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      min={formData.startDate}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-1 font-medium">
                      Category
                    </label>
                    <select
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-indigo-500 focus:outline-none"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-1 font-medium">
                      Color
                    </label>
                    <select
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-indigo-500 focus:outline-none"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                    >
                      {colors.map((color) => (
                        <option key={color} value={color}>
                          {color.charAt(0).toUpperCase() + color.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-5 py-2.5 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition"
                  >
                    <FiSave />
                    {editingEvent ? "Update" : "Save"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-3 mb-6"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm text-blue-700 font-medium">Academic</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-full">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-sm text-yellow-700 font-medium">
              MSE Exam
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-full">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-sm text-orange-700 font-medium">
              Lab Exam
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-full">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-red-700 font-medium">
              Theory Exam
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-cyan-50 rounded-full">
            <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
            <span className="text-sm text-cyan-700 font-medium">Events</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-green-700 font-medium">Holiday</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-sm text-purple-700 font-medium">
              New Semester
            </span>
          </div>
        </motion.div>

        {/* Timeline */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FiCalendar className="w-5 h-5" />
                Semester Timeline
              </h3>
              <p className="text-white/80 text-sm mt-1">
                July 2025 - January 2026
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <AnimatePresence>
                  {academicEvents.map((item, index) => {
                    const IconComponent = getIconComponent(item.icon);
                    const isPast = new Date(item.endDate) < new Date();
                    const isOngoing =
                      new Date() >= new Date(item.startDate) &&
                      new Date() <= new Date(item.endDate);
                    const isUpcoming = new Date(item.startDate) > new Date();

                    const colors =
                      colorClasses[item.color] || colorClasses.blue;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`relative flex gap-4 p-5 rounded-xl border-l-4 ${
                          colors.border
                        } ${colors.bg} ${
                          isPast ? "opacity-60" : ""
                        } hover:shadow-md transition-all duration-300`}
                      >
                        {/* Icon */}
                        <div
                          className={`flex-shrink-0 w-12 h-12 ${colors.icon} rounded-xl flex items-center justify-center shadow-lg`}
                        >
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4
                                className={`font-semibold ${colors.text} text-lg leading-tight`}
                              >
                                {item.activity}
                              </h4>
                              <div className="flex flex-wrap items-center gap-3 mt-2">
                                <span className="flex items-center gap-1 text-gray-600 text-sm">
                                  <FiCalendar className="w-4 h-4" />
                                  {item.dateSlots}
                                </span>
                                <span className="flex items-center gap-1 text-gray-500 text-sm">
                                  <FaUserTie className="w-4 h-4" />
                                  {item.responsibility}
                                </span>
                              </div>
                            </div>

                            {/* Status Badge & Actions */}
                            <div className="flex items-center gap-2">
                              {isOngoing && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500 text-white text-xs font-semibold animate-pulse">
                                  <span className="w-2 h-2 bg-white rounded-full"></span>
                                  Ongoing
                                </span>
                              )}
                              {isPast && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-400 text-white text-xs font-semibold">
                                  <FiCheckCircle className="w-3 h-3" />
                                  Completed
                                </span>
                              )}
                              {isUpcoming && !isOngoing && (
                                <span
                                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${colors.badge} text-xs font-semibold`}
                                >
                                  <FiClock className="w-3 h-3" />
                                  Upcoming
                                </span>
                              )}

                              {isAdmin && (
                                <div className="flex gap-1 ml-2">
                                  <button
                                    onClick={() => editEvent(item)}
                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                                  >
                                    <FiEdit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                                  >
                                    <FiTrash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg"
          >
            <FaGraduationCap className="w-8 h-8 mb-2 opacity-80" />
            <div className="text-3xl font-bold">110</div>
            <div className="text-blue-100 text-sm">Teaching Days</div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 text-white shadow-lg"
          >
            <FaClipboardList className="w-8 h-8 mb-2 opacity-80" />
            <div className="text-3xl font-bold">20</div>
            <div className="text-red-100 text-sm">Exam Days</div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white shadow-lg"
          >
            <FaUmbrellaBeach className="w-8 h-8 mb-2 opacity-80" />
            <div className="text-3xl font-bold">23</div>
            <div className="text-green-100 text-sm">Vacation Days</div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg"
          >
            <FaFlask className="w-8 h-8 mb-2 opacity-80" />
            <div className="text-3xl font-bold">3</div>
            <div className="text-purple-100 text-sm">Tech Events</div>
          </motion.div>
        </div>

        {/* Important Dates Cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                📝
              </span>
              Examination Schedule
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="text-gray-700">MSE (50% Syllabus)</span>
                <span className="text-yellow-700 font-semibold">
                  22-25 Sept
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="text-gray-700">Lab Exam (PR-ESE)</span>
                <span className="text-orange-700 font-semibold">17-24 Nov</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-gray-700">Theory Exam (TH-ESE)</span>
                <span className="text-red-700 font-semibold">
                  26 Nov - 11 Dec
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                📅
              </span>
              Key Deadlines
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-700">Course Selection</span>
                <span className="text-blue-700 font-semibold">
                  28 Jul - 2 Aug
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-gray-700">Term Work Submission</span>
                <span className="text-purple-700 font-semibold">14 Nov</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-gray-700">Winter Vacation Starts</span>
                <span className="text-green-700 font-semibold">12 Dec</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default AcademicCalendar;
