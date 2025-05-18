import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { firestore, auth } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  FiBook,
  FiFileText,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiDownload,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

function Courses() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedTab, setSelectedTab] = useState("materials");
  const [loading, setLoading] = useState(true);

  // Mock data for course materials, assignments, and grades
  const courseMaterials = {
    CS101: [
      {
        id: 1,
        title: "Introduction to Programming",
        type: "pdf",
        size: "2.3 MB",
        date: "May 2, 2025",
      },
      {
        id: 2,
        title: "Variables and Data Types",
        type: "pptx",
        size: "4.7 MB",
        date: "May 5, 2025",
      },
      {
        id: 3,
        title: "Control Structures Video Lecture",
        type: "video",
        size: "42 MB",
        date: "May 8, 2025",
      },
    ],
    CS201: [
      {
        id: 1,
        title: "Arrays and LinkedLists",
        type: "pdf",
        size: "3.1 MB",
        date: "May 3, 2025",
      },
      {
        id: 2,
        title: "Stacks and Queues",
        type: "pdf",
        size: "2.8 MB",
        date: "May 7, 2025",
      },
      {
        id: 3,
        title: "Trees and Graphs",
        type: "pptx",
        size: "5.2 MB",
        date: "May 10, 2025",
      },
    ],
    CS301: [
      {
        id: 1,
        title: "Database Design Principles",
        type: "pdf",
        size: "4.3 MB",
        date: "May 4, 2025",
      },
      {
        id: 2,
        title: "SQL Fundamentals",
        type: "video",
        size: "38 MB",
        date: "May 9, 2025",
      },
      {
        id: 3,
        title: "Normalization Techniques",
        type: "pdf",
        size: "2.5 MB",
        date: "May 12, 2025",
      },
    ],
    CS401: [
      {
        id: 1,
        title: "Network Protocols",
        type: "pdf",
        size: "3.5 MB",
        date: "May 6, 2025",
      },
      {
        id: 2,
        title: "TCP/IP Model",
        type: "pptx",
        size: "4.1 MB",
        date: "May 11, 2025",
      },
      {
        id: 3,
        title: "Network Security",
        type: "pdf",
        size: "3.9 MB",
        date: "May 15, 2025",
      },
    ],
  };

  const assignments = {
    CS101: [
      {
        id: 1,
        title: "Programming Basics Assignment",
        dueDate: "May 25, 2025",
        status: "pending",
        description:
          "Implement basic programs using variables, loops, and control structures.",
        points: 20,
      },
      {
        id: 2,
        title: "Functions and Arrays",
        dueDate: "June 8, 2025",
        status: "pending",
        description:
          "Create programs that use functions and arrays to solve specific problems.",
        points: 30,
      },
    ],
    CS201: [
      {
        id: 1,
        title: "Data Structures Implementation",
        dueDate: "May 22, 2025",
        status: "pending",
        description: "Implement linked list, stack, and queue data structures.",
        points: 40,
      },
      {
        id: 2,
        title: "Sorting Algorithms",
        dueDate: "June 5, 2025",
        status: "pending",
        description: "Implement and analyze different sorting algorithms.",
        points: 35,
      },
    ],
    CS301: [
      {
        id: 1,
        title: "SQL Database Creation",
        dueDate: "May 28, 2025",
        status: "pending",
        description:
          "Design and implement a relational database with at least 5 tables.",
        points: 45,
      },
      {
        id: 2,
        title: "Advanced SQL Queries",
        dueDate: "June 15, 2025",
        status: "pending",
        description:
          "Write complex SQL queries involving joins, subqueries, and aggregations.",
        points: 30,
      },
    ],
    CS401: [
      {
        id: 1,
        title: "Network Configuration",
        dueDate: "May 30, 2025",
        status: "pending",
        description:
          "Configure a small network with proper IP addressing and subnetting.",
        points: 25,
      },
      {
        id: 2,
        title: "Network Security Implementation",
        dueDate: "June 18, 2025",
        status: "pending",
        description:
          "Implement security measures to protect a network from common threats.",
        points: 35,
      },
    ],
  };

  const grades = {
    CS101: [
      {
        id: 1,
        title: "Quiz 1",
        grade: "18/20",
        feedback: "Good understanding of basic concepts.",
      },
      {
        id: 2,
        title: "Mid-term Exam",
        grade: "42/50",
        feedback: "Well done with most topics.",
      },
    ],
    CS201: [
      {
        id: 1,
        title: "Assignment 1",
        grade: "27/30",
        feedback: "Excellent implementation of data structures.",
      },
      {
        id: 2,
        title: "Project Proposal",
        grade: "18/20",
        feedback: "Clear and well-structured proposal.",
      },
    ],
    CS301: [
      {
        id: 1,
        title: "Database Design",
        grade: "37/40",
        feedback: "Very good normalization and structure.",
      },
      {
        id: 2,
        title: "SQL Quiz",
        grade: "28/30",
        feedback: "Strong grasp of SQL concepts.",
      },
    ],
    CS401: [
      {
        id: 1,
        title: "Network Analysis",
        grade: "32/40",
        feedback: "Good understanding of protocols.",
      },
      {
        id: 2,
        title: "Security Exercise",
        grade: "24/25",
        feedback: "Excellent security implementation.",
      },
    ],
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Fetch student's courses
    const fetchCourses = async () => {
      try {
        const q = query(
          collection(firestore, "users"),
          where("uid", "==", user.uid)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // Mock course data since we don't have actual course enrollments in the database
          const mockCourses = [
            {
              id: "CS101",
              code: "CS101",
              name: "Introduction to Programming",
              professor: "Dr. Smith",
              credits: 4,
              schedule: "Mon, Wed, Fri - 9:00 AM to 10:30 AM",
              room: "Room 105",
              description:
                "A foundational course covering the basics of programming concepts, syntax, and problem-solving strategies using modern programming languages.",
            },
            {
              id: "CS201",
              code: "CS201",
              name: "Data Structures and Algorithms",
              professor: "Dr. Williams",
              credits: 4,
              schedule: "Tue, Thu - 11:00 AM to 12:30 PM",
              room: "Room 203",
              description:
                "Study of fundamental data structures such as arrays, linked lists, stacks, queues, trees, and graphs, along with algorithms for manipulating them.",
            },
            {
              id: "CS301",
              code: "CS301",
              name: "Database Management Systems",
              professor: "Dr. Johnson",
              credits: 3,
              schedule: "Mon, Wed - 2:00 PM to 3:30 PM",
              room: "Lab 108",
              description:
                "Introduction to database design, development, and management with emphasis on relational database principles, SQL, and normalization techniques.",
            },
            {
              id: "CS401",
              code: "CS401",
              name: "Computer Networks",
              professor: "Dr. Brown",
              credits: 3,
              schedule: "Tue, Thu - 3:00 PM to 4:30 PM",
              room: "Room 305",
              description:
                "Comprehensive study of computer network architectures, protocols, and technologies with practical applications in modern networked environments.",
            },
          ];

          setCourses(mockCourses);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching course data:", error);
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user, navigate]);

  const getFileIcon = (type) => {
    switch (type) {
      case "pdf":
        return <FiFileText className="text-red-500" />;
      case "pptx":
        return <FiFileText className="text-orange-500" />;
      case "video":
        return <FiFileText className="text-blue-500" />;
      default:
        return <FiFileText className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-green-500";
      case "pending":
        return "text-amber-500";
      case "overdue":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <FiCheckCircle className="text-green-500" />;
      case "pending":
        return <FiClock className="text-amber-500" />;
      case "overdue":
        return <FiAlertCircle className="text-red-500" />;
      default:
        return <FiClock className="text-gray-500" />;
    }
  };

  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    setSelectedTab("materials");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Courses</h1>
          <p className="text-gray-600 mt-2">
            View your enrolled courses, materials, assignments and grades
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Courses Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <h2 className="text-lg font-semibold">Enrolled Courses</h2>
              </div>
              <div className="p-2">
                {courses.map((course) => (
                  <motion.div
                    key={course.id}
                    whileHover={{ backgroundColor: "#f3f4f6" }}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedCourse?.id === course.id
                        ? "bg-indigo-50 border-l-4 border-indigo-500"
                        : ""
                    }`}
                    onClick={() => handleSelectCourse(course)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-indigo-100 rounded-full">
                        <FiBook className="text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">
                          {course.code}
                        </h3>
                        <p className="text-sm text-gray-600">{course.name}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Course Details */}
          <div className="lg:col-span-3">
            {selectedCourse ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl shadow-md overflow-hidden"
              >
                {/* Course Header */}
                <div className="p-6 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
                  <h2 className="text-2xl font-bold">{selectedCourse.name}</h2>
                  <p className="text-indigo-100 mt-1">
                    {selectedCourse.code} • {selectedCourse.credits} Credits
                  </p>
                  <div className="flex flex-wrap items-center mt-4 text-sm text-indigo-100">
                    <p className="mr-4">
                      <span className="font-semibold">Professor:</span>{" "}
                      {selectedCourse.professor}
                    </p>
                    <p className="mr-4">
                      <span className="font-semibold">Schedule:</span>{" "}
                      {selectedCourse.schedule}
                    </p>
                    <p>
                      <span className="font-semibold">Room:</span>{" "}
                      {selectedCourse.room}
                    </p>
                  </div>
                </div>

                {/* Course Description */}
                <div className="p-6 bg-indigo-50 border-b border-indigo-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Description
                  </h3>
                  <p className="text-gray-700">{selectedCourse.description}</p>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-gray-200">
                  {["materials", "assignments", "grades"].map((tab) => (
                    <button
                      key={tab}
                      className={`flex-1 py-4 px-6 text-center font-medium ${
                        selectedTab === tab
                          ? "text-indigo-600 border-b-2 border-indigo-500"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => setSelectedTab(tab)}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {/* Materials Tab */}
                  {selectedTab === "materials" && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                          Course Materials
                        </h3>
                        <span className="text-sm text-gray-500">
                          {courseMaterials[selectedCourse.code]?.length || 0}{" "}
                          items
                        </span>
                      </div>

                      {courseMaterials[selectedCourse.code]?.map((material) => (
                        <motion.div
                          key={material.id}
                          whileHover={{ backgroundColor: "#f9fafb" }}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="p-2 bg-gray-100 rounded-full">
                              {getFileIcon(material.type)}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-800">
                                {material.title}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {material.type.toUpperCase()} • {material.size}{" "}
                                • Uploaded on {material.date}
                              </p>
                            </div>
                          </div>
                          <button className="p-2 text-indigo-600 hover:text-indigo-800">
                            <FiDownload />
                          </button>
                        </motion.div>
                      ))}

                      {!courseMaterials[selectedCourse.code] ||
                      courseMaterials[selectedCourse.code].length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No materials available for this course.
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Assignments Tab */}
                  {selectedTab === "assignments" && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                          Assignments
                        </h3>
                        <span className="text-sm text-gray-500">
                          {assignments[selectedCourse.code]?.length || 0} items
                        </span>
                      </div>

                      {assignments[selectedCourse.code]?.map((assignment) => (
                        <motion.div
                          key={assignment.id}
                          whileHover={{ backgroundColor: "#f9fafb" }}
                          className="p-4 border border-gray-200 rounded-lg"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-start space-x-4">
                              <div className="p-2 bg-gray-100 rounded-full mt-1">
                                {getStatusIcon(assignment.status)}
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-800">
                                  {assignment.title}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {assignment.description}
                                </p>
                                <div className="flex items-center mt-2 text-sm">
                                  <p
                                    className={`font-medium ${getStatusColor(
                                      assignment.status
                                    )}`}
                                  >
                                    {assignment.status.charAt(0).toUpperCase() +
                                      assignment.status.slice(1)}
                                  </p>
                                  <span className="mx-2">•</span>
                                  <p className="text-gray-500">
                                    Due: {assignment.dueDate}
                                  </p>
                                  <span className="mx-2">•</span>
                                  <p className="text-gray-500">
                                    {assignment.points} points
                                  </p>
                                </div>
                              </div>
                            </div>
                            <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm">
                              Submit
                            </button>
                          </div>
                        </motion.div>
                      ))}

                      {!assignments[selectedCourse.code] ||
                      assignments[selectedCourse.code].length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No assignments available for this course.
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Grades Tab */}
                  {selectedTab === "grades" && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                          Grades
                        </h3>
                      </div>

                      {grades[selectedCourse.code]?.map((grade) => (
                        <motion.div
                          key={grade.id}
                          whileHover={{ backgroundColor: "#f9fafb" }}
                          className="p-4 border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-start space-x-4">
                            <div className="p-2 bg-gray-100 rounded-full">
                              <FiCheckCircle className="text-green-500" />
                            </div>
                            <div>
                              <div className="flex items-center">
                                <h4 className="font-medium text-gray-800">
                                  {grade.title}
                                </h4>
                                <span className="mx-2">•</span>
                                <p className="font-medium text-green-600">
                                  {grade.grade}
                                </p>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                Feedback: {grade.feedback}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}

                      {!grades[selectedCourse.code] ||
                      grades[selectedCourse.code].length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No grades available for this course.
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <FiBook className="mx-auto h-12 w-12 text-indigo-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Select a Course
                </h3>
                <p className="mt-2 text-gray-500">
                  Choose a course from the list to view its details, materials,
                  assignments, and grades.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Courses;
