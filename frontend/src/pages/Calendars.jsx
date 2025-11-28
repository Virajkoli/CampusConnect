import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCalendar, FiBook } from "react-icons/fi";
import { FaCalendarAlt, FaGraduationCap } from "react-icons/fa";
import { auth, firestore } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

function Calendars() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      if (user) {
        // Check admin
        const adminQuery = query(
          collection(firestore, "admins"),
          where("uid", "==", user.uid)
        );
        const adminSnapshot = await getDocs(adminQuery);
        setIsAdmin(!adminSnapshot.empty);

        // Check teacher
        const teacherQuery = query(
          collection(firestore, "teachers"),
          where("uid", "==", user.uid)
        );
        const teacherSnapshot = await getDocs(teacherQuery);
        setIsTeacher(!teacherSnapshot.empty);
      }
    };
    checkUserRole();
  }, [user]);

  const calendarOptions = [
    {
      id: "events",
      title: "Events Calendar",
      description:
        "View upcoming college events, workshops, seminars, and activities",
      icon: FaCalendarAlt,
      path: "/events-calendar",
      gradient: "from-blue-500 to-indigo-600",
      bgGradient: "from-blue-50 to-indigo-50",
      borderColor: "border-blue-200",
      canEdit: isTeacher || isAdmin,
      editLabel:
        isTeacher || isAdmin ? "Teachers & Admins can edit" : "View only",
    },
    {
      id: "academic",
      title: "Academic Calendar",
      description:
        "Official academic schedule including semesters, exams, and holidays",
      icon: FaGraduationCap,
      path: "/academic-calendar",
      gradient: "from-purple-500 to-pink-600",
      bgGradient: "from-purple-50 to-pink-50",
      borderColor: "border-purple-200",
      canEdit: isAdmin,
      editLabel: isAdmin ? "Admins can edit" : "View only",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-10 pb-10">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center ml-8 my-4 text-indigo-600 hover:text-indigo-800 transition-colors"
      >
        <FiArrowLeft className="mr-2" />
        Go Back
      </button>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <FiCalendar className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            Calendars
          </h1>
          <p className="text-gray-600 text-lg">
            Choose a calendar to view schedules and events
          </p>
        </motion.div>

        {/* Calendar Options */}
        <div className="grid md:grid-cols-2 gap-6">
          {calendarOptions.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={option.path}>
                <motion.div
                  whileHover={{ scale: 1.03, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  className={`bg-gradient-to-br ${option.bgGradient} rounded-2xl p-8 border-2 ${option.borderColor} shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer h-full`}
                >
                  {/* Icon */}
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${option.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}
                  >
                    <option.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-bold text-gray-800 mb-3">
                    {option.title}
                  </h2>

                  {/* Description */}
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {option.description}
                  </p>

                  {/* Permission Badge */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm px-3 py-1.5 rounded-full ${
                        option.canEdit
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {option.canEdit ? "✏️ " : "👁️ "}
                      {option.editLabel}
                    </span>
                    <span className="text-indigo-600 font-medium flex items-center gap-1">
                      View →
                    </span>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-10 bg-white rounded-2xl p-6 shadow-md border border-gray-100"
        >
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <FiBook className="text-indigo-600" />
            About Calendars
          </h3>
          <div className="text-gray-600 space-y-2 text-sm">
            <p>
              <strong>Events Calendar:</strong> Contains college events,
              workshops, seminars, cultural activities, and important dates.
              Teachers and admins can add and manage events.
            </p>
            <p>
              <strong>Academic Calendar:</strong> Official academic schedule
              including semester dates, examination schedules, holidays, and
              submission deadlines. Only admins can modify this calendar.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Calendars;
