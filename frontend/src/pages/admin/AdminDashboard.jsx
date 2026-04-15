import React, { useState, useEffect, useCallback, useMemo } from "react";
import { auth, firestore } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";

// Add custom CSS for scrollbar and navigation
const styles = `
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
`;

// Icons
import {
  FiAlertCircle,
  FiSearch,
  FiLogOut,
  FiUser,
  FiUsers,
  FiHome,
  FiMessageSquare,
  FiBell,
  FiCalendar,
  FiCreditCard,
  FiSettings,
  FiActivity,
  FiMenu,
  FiX,
  FiUpload,
  FiLayers,
  FiEdit3,
  FiChevronDown,
  FiChevronRight,
} from "react-icons/fi";
import { FaEnvelope, FaPhoneAlt } from "react-icons/fa";
import CalendarComponent from "../../components/common/CalendarComponent";
import FixItBoard from "../../components/common/FixItBoard";

// Sidebar Item Component
function SidebarItem({
  icon,
  label,
  path,
  isOpen,
  active,
  color = "blue",
  onClick,
  itemOnClick,
}) {
  const navigate = useNavigate();

  // Define color mappings for backgrounds and text
  const colorMap = {
    blue: {
      bg: "bg-blue-50",
      hoverBg: "hover:bg-blue-100/60",
      activeBg: "from-blue-500 to-blue-600",
      text: "text-blue-600",
    },
    purple: {
      bg: "bg-purple-50",
      hoverBg: "hover:bg-purple-100/60",
      activeBg: "from-purple-500 to-purple-600",
      text: "text-purple-600",
    },
    green: {
      bg: "bg-green-50",
      hoverBg: "hover:bg-green-100/60",
      activeBg: "from-green-500 to-green-600",
      text: "text-green-600",
    },
    amber: {
      bg: "bg-amber-50",
      hoverBg: "hover:bg-amber-100/60",
      activeBg: "from-amber-500 to-amber-600",
      text: "text-amber-600",
    },
    red: {
      bg: "bg-red-50",
      hoverBg: "hover:bg-red-100/60",
      activeBg: "from-red-500 to-red-600",
      text: "text-red-600",
    },
  };

  // Get the appropriate colors from the map
  const colorStyle = colorMap[color] || colorMap.blue;

  // Handle the onClick event for items like Logout
  const handleItemClick = (e) => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <motion.div
      className={`mb-1 px-3 ${active ? colorStyle.bg : ""}`}
      whileHover={{
        backgroundColor: active ? undefined : "rgba(99, 102, 241, 0.1)",
        scale: 1.02,
      }}
      whileTap={{ scale: 0.98 }}
    >
      {path && !onClick ? (
        <Link
          to={path}
          onClick={itemOnClick}
          className={`w-full flex items-center py-3 px-2 rounded-lg ${
            active
              ? `${colorStyle.text} font-medium bg-opacity-80`
              : `text-slate-600 ${colorStyle.hoverBg}`
          } transition-all duration-200`}
          aria-label={label}
        >
          <div
            className={`${!isOpen ? "mx-auto" : "mr-3"} text-lg ${
              active ? colorStyle.text : ""
            }`}
          >
            {icon}
          </div>
          {isOpen && (
            <motion.span
              className="text-sm"
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {label}
            </motion.span>
          )}
        </Link>
      ) : (
        <button
          onClick={handleItemClick}
          className={`w-full flex items-center py-3 px-2 rounded-lg ${
            active
              ? `${colorStyle.text} font-medium bg-opacity-80`
              : `text-slate-600 ${colorStyle.hoverBg}`
          } transition-all duration-200`}
          aria-label={label}
        >
          <div
            className={`${!isOpen ? "mx-auto" : "mr-3"} text-lg ${
              active ? colorStyle.text : ""
            }`}
          >
            {icon}
          </div>
          {isOpen && (
            <motion.span
              className="text-sm"
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {label}
            </motion.span>
          )}
        </button>
      )}
    </motion.div>
  );
}

// Stat Card Component
function StatCard({ title, value, change, icon, color, breakdown }) {
  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        type: "spring",
        stiffness: 150,
        damping: 15,
      },
    },
  };

  return (
    <motion.div
      className={`bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 overflow-hidden relative`}
      variants={cardVariants}
      whileHover={{
        y: -5,
        boxShadow:
          "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 15,
        },
      }}
    >
      {/* Animated background blob */}
      <motion.div
        className={`absolute -right-5 -top-5 w-24 h-24 rounded-full bg-${color}-100 opacity-60 z-0`}
        initial={{ scale: 0.8 }}
        animate={{
          scale: [0.8, 1.2, 0.8],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="flex justify-between items-center relative z-10">
        <div>
          <p className="text-sm text-slate-500 mb-1">{title}</p>
          <motion.h3
            className="text-2xl font-bold text-slate-800"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {value}
          </motion.h3>
          <div
            className={`text-xs mt-1 font-medium text-${color}-600 flex items-center`}
          >
            <motion.span
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              {change}
            </motion.span>
          </div>
          {breakdown && (
            <div className="mt-2 text-xs text-slate-500">
              {Object.entries(breakdown)
                .filter(([dept, count]) => count > 0)
                .map(([dept, count]) => `${dept}: ${count}`)
                .join(", ")}
            </div>
          )}
        </div>
        <motion.div
          className={`w-12 h-12 rounded-full bg-${color}-100 flex items-center justify-center`}
          whileHover={{
            rotate: 10,
            scale: 1.1,
            backgroundColor: `rgba(var(--${color}-200))`,
          }}
          whileTap={{ scale: 0.9 }}
        >
          {icon}
        </motion.div>
      </div>
    </motion.div>
  );
}

// NavLink Component for the Navbar
function NavLink({
  to,
  active,
  icon,
  label,
  bgColor = "from-[#2f87d9] to-[#1f6fb7]",
}) {
  return (
    <Link to={to}>
      <motion.div
        className={`px-3 py-2 rounded-lg flex items-center space-x-2 ${
          active
            ? `bg-gradient-to-r ${bgColor} text-white shadow-md`
            : "text-slate-600 hover:bg-[#e9f2ff] hover:text-[#1f6fb7]"
        } transition-all duration-300`}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-medium min-w-max">{label}</span>
      </motion.div>
    </Link>
  );
}

// QuickAccessLink Component with enhanced animations and error handling
function QuickAccessLink({ to, icon, label, color, delay = 0 }) {
  const navigate = useNavigate();

  // Define color mapping for the component
  const colorMap = {
    blue: {
      bg: "bg-blue-50",
      hoverBg: "hover:bg-blue-100",
      text: "text-blue-500",
      hoverText: "group-hover:text-blue-700",
      labelColor: "text-blue-700",
      gradient: "from-blue-500 to-blue-600",
    },
    green: {
      bg: "bg-green-50",
      hoverBg: "hover:bg-green-100",
      text: "text-green-500",
      hoverText: "group-hover:text-green-700",
      labelColor: "text-green-700",
      gradient: "from-green-500 to-green-600",
    },
    purple: {
      bg: "bg-purple-50",
      hoverBg: "hover:bg-purple-100",
      text: "text-purple-500",
      hoverText: "group-hover:text-purple-700",
      labelColor: "text-purple-700",
      gradient: "from-purple-500 to-purple-600",
    },
    orange: {
      bg: "bg-orange-50",
      hoverBg: "hover:bg-orange-100",
      text: "text-orange-500",
      hoverText: "group-hover:text-orange-700",
      labelColor: "text-orange-700",
      gradient: "from-orange-500 to-orange-600",
    },
  };

  const colors = colorMap[color] || colorMap.blue;

  // Safe click handler to prevent navigation errors
  const handleClick = (e) => {
    e.preventDefault();
    try {
      navigate(to || "/admin/dashboard");
    } catch (err) {
      console.error("Navigation error:", err);
      // Fallback to dashboard if navigation fails
      navigate("/admin/dashboard");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: delay,
        duration: 0.4,
        type: "spring",
        stiffness: 150,
      }}
    >
      <div onClick={handleClick} className="cursor-pointer">
        <motion.div
          className={`group p-4 rounded-lg text-center transition-all ${colors.bg} ${colors.hoverBg} relative overflow-hidden`}
          whileHover={{
            scale: 1.05,
            boxShadow:
              "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Gradient hover overlay */}
          <motion.div
            className={`absolute inset-0 bg-gradient-to-tr ${colors.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 0.15 }}
          />

          {/* Icon with animation */}
          <motion.div
            className="relative flex justify-center mb-2"
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <div
              className={`w-10 h-10 ${colors.text} ${colors.hoverText} flex items-center justify-center`}
            >
              {icon}
            </div>
          </motion.div>

          {/* Label */}
          <span
            className={`text-sm font-medium ${colors.labelColor} relative z-10`}
          >
            {label}
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [examTimetable, setExamTimetable] = useState([]);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();

  const [studentStats, setStudentStats] = useState({ total: 0, byDept: {} });
  const [teacherStats, setTeacherStats] = useState({ total: 0, byDept: {} });

  // Define fetchUsers first, before using it in useEffect
  const fetchUsers = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, "users"));
      const userList = [];
      querySnapshot.forEach((docSnap) => {
        userList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setUsers(userList);
    } catch (err) {
      setError("Failed to fetch users: " + err.message);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      // Fetch students
      const usersSnapshot = await getDocs(collection(firestore, "users"));
      const students = usersSnapshot.docs
        .map((doc) => doc.data())
        .filter((u) => (u.role || "Student") === "Student");
      const studentByDept = {};
      students.forEach((u) => {
        const dept = (u.dept || "Other").trim();
        studentByDept[dept] = (studentByDept[dept] || 0) + 1;
      });
      setStudentStats({
        total: students.length,
        byDept: studentByDept,
      });

      // Fetch teachers
      const teachersSnapshot = await getDocs(collection(firestore, "teachers"));
      const teachersData = teachersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTeachers(teachersData);
      const teacherByDept = {};
      teachersData.forEach((t) => {
        const dept = (t.dept || "Other").trim();
        teacherByDept[dept] = (teacherByDept[dept] || 0) + 1;
      });
      setTeacherStats({
        total: teachersData.length,
        byDept: teacherByDept,
      });
    } catch (err) {
      // Optionally handle error
    }
  }, []);

  const fetchCenterPanelData = useCallback(async () => {
    try {
      const [announcementSnapshot, examSnapshot] = await Promise.all([
        getDocs(collection(firestore, "announcements")),
        getDocs(collection(firestore, "examTimetable")),
      ]);

      const announcementList = announcementSnapshot.docs
        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        .sort((a, b) => {
          const aSec = a?.createdAt?.seconds || 0;
          const bSec = b?.createdAt?.seconds || 0;
          return bSec - aSec;
        });
      setAnnouncements(announcementList);

      const examList = examSnapshot.docs
        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        .sort((a, b) =>
          String(a.date || "").localeCompare(String(b.date || "")),
        );
      setExamTimetable(examList);
    } catch (err) {
      console.error("Failed to load center panel data:", err);
    }
  }, []);

  const studentOnlyUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          (u.role || "Student") === "Student" ||
          (!u.role && (u.rollNo || u.rollNumber)),
      ),
    [users],
  );

  useEffect(() => {
    // Local flag to prevent state updates after unmount
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Only proceed if component is still mounted
      if (!isMounted) return;

      if (currentUser) {
        try {
          // Force refresh the token to ensure latest custom claims
          const tokenResult = await currentUser.getIdTokenResult(true);

          // Only navigate if component is still mounted
          if (!isMounted) return;

          if (!tokenResult.claims.admin) {
            navigate("/auth/admin");
          } else {
            // Only fetch users if still mounted
            fetchUsers();
            fetchStats();
            fetchCenterPanelData();
          }
        } catch (error) {
          console.error("Token error:", error);
          if (isMounted) {
            navigate("/auth/admin");
          }
        }
      } else if (isMounted) {
        navigate("/auth/admin");
      }
    });

    // Enhanced cleanup
    return () => {
      isMounted = false; // Mark as unmounted
      unsubscribe(); // Clean up auth listener
    };
  }, [navigate, fetchUsers, fetchStats, fetchCenterPanelData]);

  // Simplified logout function to prevent errors
  const handleLogout = () => {
    setTimeout(() => {
      try {
        // Sign out and navigate
        auth.signOut();
        navigate("/login");
      } catch (err) {
        console.error("Logout error:", err);
      }
    }, 10);
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
        type: "spring",
        stiffness: 150,
        damping: 15,
      },
    },
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: FiHome },
    {
      id: "students",
      label: "Students",
      icon: FiUsers,
      route: "/admin/usermanagement",
    },
    {
      id: "teachers",
      label: "Teachers",
      icon: FiUser,
      route: "/admin/teachermanagement",
    },
    {
      id: "subject-sets",
      label: "Subject Sets",
      icon: FiLayers,
      route: "/admin/subject-sets",
    },
    {
      id: "upload",
      label: "Upload Students",
      icon: FiUpload,
      route: "/admin/upload-students",
    },
    {
      id: "bulk-update",
      label: "Bulk Academic Update",
      icon: FiEdit3,
      route: "/admin/bulk-academic-update",
    },
    {
      id: "announcements",
      label: "Announcements",
      icon: FiBell,
      route: "/admin/announcements",
    },
    {
      id: "fixit",
      label: "FixIt",
      icon: FiAlertCircle,
    },
    {
      id: "calendars",
      label: "Calendars",
      icon: FiCalendar,
      route: "/calendars",
    },
    {
      id: "exam-timetable",
      label: "Exam Timetable",
      icon: FiCreditCard,
      route: "/admin/exam-timetable",
    },
    {
      id: "settings",
      label: "Settings",
      icon: FiSettings,
      route: "/admin/settings",
    },
  ];

  const openNavItem = (item) => {
    setActiveTab(item.id);
  };

  const adminName = auth.currentUser?.displayName || "Administrator";

  const renderOverview = () => {
    const topStats = [
      {
        title: "Total Students",
        value: studentStats.total,
        tint: "bg-[#eef4ff]",
      },
      {
        title: "Total Teachers",
        value: teacherStats.total,
        tint: "bg-[#f2f7ef]",
      },
      {
        title: "Announcements",
        value: "5",
        tint: "bg-[#fff6eb]",
      },
      {
        title: "System",
        value: "Live",
        tint: "bg-[#f3f1ff]",
      },
    ];

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <div className="xl:col-span-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Admin Workspace
            </p>
            <h1 className="mt-2 text-4xl font-semibold text-slate-900">
              {adminName}
            </h1>
            <p className="mt-2 text-lg text-slate-600">Campus Control Center</p>
          </div>

          <div className="xl:col-span-4 grid grid-cols-2 gap-4">
            {topStats.map((stat) => (
              <div
                key={stat.title}
                className={`${stat.tint} rounded-3xl border border-slate-200/80 p-5`}
              >
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {stat.title}
                </p>
                <p className="mt-3 text-5xl font-semibold leading-none text-slate-900">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-4xl font-semibold text-slate-900">
              Quick Control
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 xl:grid-cols-3">
            {[
              {
                label: "Manage Students",
                route: "/admin/usermanagement",
                icon: FiUsers,
              },
              {
                label: "Manage Teachers",
                route: "/admin/teachermanagement",
                icon: FiUser,
              },
              {
                label: "Announcements",
                route: "/admin/announcements",
                icon: FiBell,
              },
              {
                label: "Subject Sets",
                route: "/admin/subject-sets",
                icon: FiLayers,
              },
              {
                label: "Bulk Update",
                route: "/admin/bulk-academic-update",
                icon: FiEdit3,
              },
              {
                label: "Settings",
                route: "/admin/settings",
                icon: FiSettings,
              },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => navigate(action.route)}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left text-slate-800 transition hover:border-[#b8d9ff] hover:bg-[#f4f8ff]"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Icon className="h-4 w-4 text-[#2f87d9]" /> {action.label}
                  </span>
                  <FiChevronRight className="h-4 w-4 text-slate-500" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderSectionPanel = ({
    title,
    description,
    primaryLabel,
    primaryRoute,
    secondaryLabel,
    secondaryRoute,
  }) => (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
          Admin Workspace
        </p>
        <h2 className="mt-2 text-4xl font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 text-lg text-slate-600">{description}</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-800">Quick Actions</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => navigate(primaryRoute)}
            className="flex items-center justify-between rounded-xl bg-[#2f87d9] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1f6fb7]"
          >
            <span>{primaryLabel}</span>
            <FiChevronRight className="h-4 w-4" />
          </button>
          {secondaryLabel && secondaryRoute ? (
            <button
              type="button"
              onClick={() => navigate(secondaryRoute)}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-[#f4f8ff]"
            >
              <span>{secondaryLabel}</span>
              <FiChevronRight className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );

  const renderCalendarsPanel = () => (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
          Admin Workspace
        </p>
        <h2 className="mt-2 text-4xl font-semibold text-slate-900">
          Calendars
        </h2>
        <p className="mt-2 text-lg text-slate-600">
          Access events and academic calendars from one place.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <button
          type="button"
          onClick={() => navigate("/events-calendar")}
          className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-[#b8d9ff] hover:bg-[#f4f8ff]"
        >
          <div className="mb-2 flex items-center gap-2 text-slate-800">
            <FiCalendar className="h-5 w-5 text-[#2f87d9]" />
            <span className="text-lg font-semibold">Events Calendar</span>
          </div>
          <p className="text-sm text-slate-600">
            View and manage campus events.
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate("/academic-calendar")}
          className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-[#b8d9ff] hover:bg-[#f4f8ff]"
        >
          <div className="mb-2 flex items-center gap-2 text-slate-800">
            <FiCreditCard className="h-5 w-5 text-[#2f87d9]" />
            <span className="text-lg font-semibold">Academic Calendar</span>
          </div>
          <p className="text-sm text-slate-600">
            Review semester schedule and exam windows.
          </p>
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <CalendarComponent />
      </div>
    </div>
  );

  const renderStudentsPanel = () => (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
          Admin Workspace
        </p>
        <h2 className="mt-2 text-4xl font-semibold text-slate-900">Students</h2>
        <p className="mt-2 text-lg text-slate-600">
          Recent students rendered directly in dashboard center.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">
            Student Records
          </h3>
          <button
            type="button"
            onClick={() => navigate("/admin/usermanagement")}
            className="rounded-xl bg-[#2f87d9] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#1f6fb7]"
          >
            Open Full Management
          </button>
        </div>

        {studentOnlyUsers.length === 0 ? (
          <p className="text-sm text-slate-500">No student records found.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-[720px] w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    Name
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    Email
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    Roll
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    Department
                  </th>
                </tr>
              </thead>
              <tbody>
                {studentOnlyUsers.slice(0, 12).map((student) => (
                  <tr key={student.id} className="border-t border-slate-200">
                    <td className="px-3 py-2 text-slate-800">
                      {student.name || student.displayName || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {student.email || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {student.rollNo || student.rollNumber || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {student.dept || student.department || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderTeachersPanel = () => (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
          Admin Workspace
        </p>
        <h2 className="mt-2 text-4xl font-semibold text-slate-900">Teachers</h2>
        <p className="mt-2 text-lg text-slate-600">
          Faculty overview rendered in dashboard center.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">
            Teacher Records
          </h3>
          <button
            type="button"
            onClick={() => navigate("/admin/teachermanagement")}
            className="rounded-xl bg-[#2f87d9] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#1f6fb7]"
          >
            Open Full Management
          </button>
        </div>

        {teachers.length === 0 ? (
          <p className="text-sm text-slate-500">No teacher records found.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {teachers.slice(0, 12).map((teacher) => (
              <div
                key={teacher.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-sm font-semibold text-slate-800">
                  {teacher.name || teacher.displayName || "Unnamed Teacher"}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {teacher.email || "-"}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {teacher.department || teacher.dept || "Department not set"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderAnnouncementsPanel = () => (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
          Admin Workspace
        </p>
        <h2 className="mt-2 text-4xl font-semibold text-slate-900">
          Announcements
        </h2>
        <p className="mt-2 text-lg text-slate-600">
          Latest notices rendered here in dashboard center.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">
            Recent Announcements
          </h3>
          <button
            type="button"
            onClick={() => navigate("/admin/announcements")}
            className="rounded-xl bg-[#2f87d9] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#1f6fb7]"
          >
            Open Full Management
          </button>
        </div>

        {announcements.length === 0 ? (
          <p className="text-sm text-slate-500">No announcements available.</p>
        ) : (
          <div className="space-y-3">
            {announcements.slice(0, 8).map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {item.title || "Untitled"}
                    </p>
                    <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                      {item.message || "-"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-semibold ${item.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}
                  >
                    {item.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderExamPanel = () => (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
          Admin Workspace
        </p>
        <h2 className="mt-2 text-4xl font-semibold text-slate-900">
          Exam Timetable
        </h2>
        <p className="mt-2 text-lg text-slate-600">
          Upcoming exam entries rendered in center panel.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">
            Upcoming Exams
          </h3>
          <button
            type="button"
            onClick={() => navigate("/admin/exam-timetable")}
            className="rounded-xl bg-[#2f87d9] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#1f6fb7]"
          >
            Open Full Management
          </button>
        </div>

        {examTimetable.length === 0 ? (
          <p className="text-sm text-slate-500">
            No exam timetable data available.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-[760px] w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    Date
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    Course
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    Year
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">
                    Branch
                  </th>
                </tr>
              </thead>
              <tbody>
                {examTimetable.slice(0, 12).map((exam) => (
                  <tr key={exam.id} className="border-t border-slate-200">
                    <td className="px-3 py-2 text-slate-700">
                      {exam.date || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {exam.courseName || exam.subject || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {exam.year || "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {exam.branch || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderActivePanel = () => {
    if (activeTab === "overview") return renderOverview();
    if (activeTab === "students") return renderStudentsPanel();
    if (activeTab === "teachers") return renderTeachersPanel();
    if (activeTab === "announcements") return renderAnnouncementsPanel();
    if (activeTab === "fixit")
      return <FixItBoard role="admin" displayName={adminName} />;
    if (activeTab === "calendars") return renderCalendarsPanel();
    if (activeTab === "exam-timetable") return renderExamPanel();

    const panelMap = {
      students: {
        title: "Students",
        description: "Manage student records, edits, and enrollment updates.",
        primaryLabel: "Open Student Management",
        primaryRoute: "/admin/usermanagement",
        secondaryLabel: "Open Bulk Academic Update",
        secondaryRoute: "/admin/bulk-academic-update",
      },
      teachers: {
        title: "Teachers",
        description: "Manage faculty profiles and assignment mappings.",
        primaryLabel: "Open Teacher Management",
        primaryRoute: "/admin/teachermanagement",
      },
      "subject-sets": {
        title: "Subject Sets",
        description: "Maintain branch-year-semester subject matrices.",
        primaryLabel: "Open Subject Set Management",
        primaryRoute: "/admin/subject-sets",
      },
      upload: {
        title: "Bulk Onboarding",
        description:
          "Parse admission data and create student accounts in bulk.",
        primaryLabel: "Open Bulk Student Onboarding",
        primaryRoute: "/admin/upload-students",
      },
      "bulk-update": {
        title: "Bulk Academic Update",
        description: "Apply branch/year/semester updates to many students.",
        primaryLabel: "Open Bulk Academic Update",
        primaryRoute: "/admin/bulk-academic-update",
      },
      announcements: {
        title: "Announcements",
        description: "Create and manage notices for all users.",
        primaryLabel: "Open Announcement Management",
        primaryRoute: "/admin/announcements",
      },
      "exam-timetable": {
        title: "Exam Timetable",
        description: "Upload and manage exam timetables for all branches.",
        primaryLabel: "Open Exam Timetable Management",
        primaryRoute: "/admin/exam-timetable",
      },
      settings: {
        title: "Settings",
        description: "Configure admin-level platform preferences.",
        primaryLabel: "Open Admin Settings",
        primaryRoute: "/admin/settings",
      },
    };

    const panel = panelMap[activeTab];
    if (!panel) return renderOverview();
    return renderSectionPanel(panel);
  };

  return (
    <div className="min-h-screen bg-[#eef2f6] pb-6 pt-4 sm:pb-10 sm:pt-7">
      <style>{styles}</style>
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        {error ? (
          <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mb-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-left text-slate-800"
          >
            <FiChevronDown
              className={`h-4 w-4 transition-transform ${sidebarOpen ? "rotate-180" : "rotate-0"}`}
            />
            <span>
              <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-500">
                Admin Dashboard
              </span>
              <span className="block text-xs font-semibold text-slate-800">
                {navItems.find((item) => item.id === activeTab)?.label ||
                  "Control Center"}
              </span>
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <AnimatePresence initial={false}>
              {sidebarOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="mb-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:hidden"
                >
                  <div className="p-2.5">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            openNavItem(item);
                            setSidebarOpen(false);
                          }}
                          className={`mb-1 flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs font-medium transition ${
                            isActive
                              ? "bg-[#e9f2ff] text-[#1f6fb7]"
                              : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4" /> {item.label}
                          </span>
                          <FiChevronRight className="h-4 w-4" />
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mb-1 mt-2 flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs font-medium text-red-600 transition hover:bg-red-50"
                    >
                      <span className="flex items-center gap-2">
                        <FiLogOut className="h-4 w-4" /> Logout
                      </span>
                      <FiChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">
              <div className="border-b border-slate-200 bg-[#f8fafc] px-4 py-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Admin Menu
                </p>
                <p className="text-lg font-semibold text-slate-800">
                  Dashboard
                </p>
              </div>
              <div className="p-3">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openNavItem(item)}
                      className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                        isActive
                          ? "bg-[#e9f2ff] text-[#1f6fb7]"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4" /> {item.label}
                      </span>
                      <FiChevronRight className="h-4 w-4" />
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mb-1 mt-2 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  <span className="flex items-center gap-2">
                    <FiLogOut className="h-4 w-4" /> Logout
                  </span>
                  <FiChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-9">{renderActivePanel()}</main>
        </div>
      </div>
    </div>
  );
}
