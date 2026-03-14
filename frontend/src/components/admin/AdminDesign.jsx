import React from "react";
import { motion } from "framer-motion";
import {
  FiActivity,
  FiHome,
  FiUsers,
  FiBell,
  FiCalendar,
  FiSettings,
} from "react-icons/fi";

// Reusable dashboard components for the admin interface

// Admin Page Layout
export function AdminLayout({ children, sidebar }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex">
      {sidebar}
      <main className="flex-1 min-h-screen">{children}</main>
    </div>
  );
}

// Admin Sidebar
export function AdminSidebar({
  isOpen,
  setIsOpen,
  activeItem = "dashboard",
  onNavItemClick,
}) {
  const sidebarVariants = {
    open: { width: "256px", transition: { duration: 0.3 } },
    closed: { width: "80px", transition: { duration: 0.3 } },
  };

  const textVariants = {
    open: { opacity: 1, display: "block", transition: { delay: 0.1 } },
    closed: { opacity: 0, display: "none", transition: { duration: 0.1 } },
  };

  // Navigation items with icons and links
  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <FiHome />,
      path: "/admin/dashboard",
    },
    {
      id: "students",
      label: "Students",
      icon: <FiUsers />,
      path: "/admin/usermanagement",
    },
    {
      id: "teachers",
      label: "Teachers",
      icon: <FiUser />,
      path: "/admin/teachermanagement",
    },
    {
      id: "announcements",
      label: "Announcements",
      icon: <FiBell />,
      path: "/admin/announcements",
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: <FiCalendar />,
      path: "/admin/calendar",
    },
    {
      id: "settings",
      label: "Settings",
      icon: <FiSettings />,
      path: "/admin/settings",
    },
  ];

  return (
    <motion.aside
      className="bg-white shadow-lg text-gray-800 flex flex-col h-screen sticky top-0 z-10 border-r border-gray-200"
      variants={sidebarVariants}
      animate={isOpen ? "open" : "closed"}
    >
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <motion.div
          className="flex items-center"
          variants={textVariants}
          animate={isOpen ? "open" : "closed"}
        >
          <img
            src="https://i.pravatar.cc/100?img=12"
            alt="CampusConnect Logo"
            className="w-8 h-8 rounded-md mr-2"
          />
          <motion.h2
            className="text-lg font-bold text-blue-600"
            variants={textVariants}
            animate={isOpen ? "open" : "closed"}
          >
            CampusConnect
          </motion.h2>
        </motion.div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-500 hover:text-blue-600 transition-colors rounded-full p-1 hover:bg-blue-50"
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Admin Profile Summary */}
      <div
        className={`p-4 flex items-center space-x-3 border-b border-gray-100 ${
          !isOpen && "justify-center"
        }`}
      >
        <img
          src="https://i.pravatar.cc/100?img=12"
          alt="Admin Profile"
          className="w-10 h-10 rounded-full object-cover border-2 border-blue-200"
        />
        <motion.div
          variants={textVariants}
          animate={isOpen ? "open" : "closed"}
          className="flex flex-col"
        >
          <p className="font-semibold text-sm text-gray-800">Admin User</p>
          <p className="text-xs text-blue-600 font-medium">Super Admin</p>
        </motion.div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-3 mb-2">
          <motion.p
            className="text-xs font-semibold text-gray-400 uppercase tracking-wider"
            variants={textVariants}
            animate={isOpen ? "open" : "closed"}
          >
            Main Menu
          </motion.p>
        </div>

        {navItems.map((item) => (
          <div
            key={item.id}
            className={`mb-1 px-3 ${
              activeItem === item.id ? "bg-blue-50" : ""
            }`}
            onClick={() => onNavItemClick && onNavItemClick(item.id, item.path)}
          >
            <button
              className={`w-full flex items-center py-3 px-2 rounded-lg ${
                activeItem === item.id
                  ? "text-blue-600 font-medium"
                  : "text-gray-600 hover:text-blue-600"
              } transition-colors duration-200`}
              aria-label={item.label}
            >
              <div className={`${!isOpen ? "mx-auto" : "mr-3"} text-lg`}>
                {item.icon}
              </div>
              {isOpen && <span className="text-sm">{item.label}</span>}
            </button>
          </div>
        ))}
      </nav>
    </motion.aside>
  );
}

// Admin Header
export function AdminHeader({
  title,
  searchTerm,
  setSearchTerm,
  notificationCount = 0,
  onProfileClick,
}) {
  return (
    <div className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-20">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <motion.h1
          className="text-xl font-bold text-blue-600"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {title}
        </motion.h1>

        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search"
              className="w-64 px-4 py-2 pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <svg
              className="absolute top-2.5 left-3 text-gray-400 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </motion.div>

          {/* Notification Icon */}
          <motion.button
            className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-50"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Notifications"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {notificationCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-xs text-white rounded-full w-4 h-4 flex items-center justify-center">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </motion.button>

          {/* Admin Avatar */}
          <motion.div
            className="relative"
            whileHover={{ scale: 1.05 }}
            onClick={onProfileClick}
          >
            <img
              src="https://i.pravatar.cc/100?img=12"
              alt="Admin"
              className="w-9 h-9 rounded-full cursor-pointer border-2 border-blue-200"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Stat Card
export function StatCard({ title, value, change, icon, color }) {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      className={`bg-white rounded-lg shadow-md border border-gray-200 p-5`}
      variants={cardVariants}
      whileHover={{
        y: -5,
        boxShadow:
          "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      }}
    >
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
          <div
            className={`text-xs mt-1 font-medium ${
              color === "blue"
                ? "text-blue-600"
                : color === "green"
                ? "text-green-600"
                : color === "red"
                ? "text-red-600"
                : color === "purple"
                ? "text-purple-600"
                : color === "indigo"
                ? "text-indigo-600"
                : "text-gray-600"
            }`}
          >
            {change}
          </div>
        </div>
        <div
          className={`w-12 h-12 rounded-full ${
            color === "blue"
              ? "bg-blue-100"
              : color === "green"
              ? "bg-green-100"
              : color === "red"
              ? "bg-red-100"
              : color === "purple"
              ? "bg-purple-100"
              : color === "indigo"
              ? "bg-indigo-100"
              : "bg-gray-100"
          } flex items-center justify-center`}
        >
          {icon || (
            <FiActivity
              className={`${
                color === "blue"
                  ? "text-blue-500"
                  : color === "green"
                  ? "text-green-500"
                  : color === "red"
                  ? "text-red-500"
                  : color === "purple"
                  ? "text-purple-500"
                  : color === "indigo"
                  ? "text-indigo-500"
                  : "text-gray-500"
              }`}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Content Card
export function ContentCard({
  title,
  children,
  actionLabel,
  onAction,
  className = "",
  icon,
}) {
  return (
    <div
      className={`bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden ${className}`}
    >
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          {icon && <span className="mr-2 text-blue-500">{icon}</span>}
          {title}
        </h2>
        {actionLabel && (
          <button
            onClick={onAction}
            className="text-blue-500 text-sm hover:underline flex items-center"
          >
            {actionLabel}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 ml-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// Main Function
function AdminDesign() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Admin Design Components
      </h1>
      <p className="text-gray-600 mb-8">
        These are reusable components for the admin dashboard interface. Import
        individual components as needed.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Example Stat"
          value="1,234"
          change="+12%"
          color="blue"
        />
        <StatCard title="Another Stat" value="567" change="+5%" color="green" />
        <StatCard title="Third Stat" value="89" change="-2%" color="red" />
        <StatCard
          title="Fourth Stat"
          value="99.9%"
          change="Stable"
          color="indigo"
        />
      </div>

      <ContentCard
        title="Example Content Card"
        actionLabel="View All"
        onAction={() => alert("Action clicked")}
      >
        <p>This is an example of content that can go inside the card.</p>
      </ContentCard>
    </div>
  );
}

export default AdminDesign;
