import React, { useState, useEffect } from "react";
import { firestore, auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  FiCheck,
  FiX,
  FiCalendar,
  FiPieChart,
  FiBarChart2,
  FiUser,
  FiFilter,
  FiDownload,
  FiArrowLeft,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

function AttendanceTracker() {
  const [user] = useAuthState(auth);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceView, setAttendanceView] = useState("mark"); // 'mark', 'history', 'stats'
  const [attendanceFilter, setAttendanceFilter] = useState("all"); // 'all', 'present', 'absent'
  const [studentAttendance, setStudentAttendance] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const navigate = useNavigate();

  // Check user role and load appropriate data
  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) return;

      try {
        // Check if teacher
        const teacherQuery = query(
          collection(firestore, "teachers"),
          where("uid", "==", user.uid)
        );
        const teacherSnapshot = await getDocs(teacherQuery);
        const isUserTeacher = !teacherSnapshot.empty;
        setIsTeacher(isUserTeacher);

        // Check if student
        const studentQuery = query(
          collection(firestore, "students"),
          where("uid", "==", user.uid)
        );
        const studentSnapshot = await getDocs(studentQuery);
        const isUserStudent = !studentSnapshot.empty;
        setIsStudent(isUserStudent);

        // Fetch courses based on role
        if (isUserTeacher) {
          const teacherCoursesQuery = query(
            collection(firestore, "courses"),
            where("teacherId", "==", user.uid)
          );
          const coursesSnapshot = await getDocs(teacherCoursesQuery);
          const coursesList = coursesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setCourses(coursesList);
          if (coursesList.length > 0) {
            setSelectedCourse(coursesList[0].id);
          }
        } else if (isUserStudent) {
          // Fetch student's enrolled courses
          const studentDoc = studentSnapshot.docs[0];
          const studentData = studentDoc.data();

          if (studentData.enrolledCourses) {
            const coursesPromises = studentData.enrolledCourses.map(
              async (courseId) => {
                const courseDoc = await getDoc(
                  doc(firestore, "courses", courseId)
                );
                if (courseDoc.exists()) {
                  return {
                    id: courseDoc.id,
                    ...courseDoc.data(),
                  };
                }
                return null;
              }
            );

            const coursesList = (await Promise.all(coursesPromises)).filter(
              Boolean
            );
            setCourses(coursesList);

            if (coursesList.length > 0) {
              setSelectedCourse(coursesList[0].id);

              // Fetch student's attendance for the selected course
              await fetchStudentAttendance(user.uid, coursesList[0].id);
            }

            // Set student info
            setSelectedStudent({
              id: studentDoc.id,
              uid: user.uid,
              name: studentData.name || studentData.displayName,
              ...studentData,
            });
          }
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        toast.error("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [user]);

  // Fetch students for a course when a course is selected (teacher view)
  useEffect(() => {
    const fetchStudentsForCourse = async () => {
      if (!selectedCourse || !isTeacher) return;

      try {
        setLoading(true);

        // Fetch students enrolled in this course
        const enrollmentsQuery = query(
          collection(firestore, "enrollments"),
          where("courseId", "==", selectedCourse)
        );
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
        const enrollments = enrollmentsSnapshot.docs.map((doc) => doc.data());

        // Get student details for each enrollment
        const studentIds = enrollments.map(
          (enrollment) => enrollment.studentId
        );
        const studentsQuery = query(
          collection(firestore, "students"),
          where("uid", "in", studentIds)
        );
        const studentsSnapshot = await getDocs(studentsQuery);
        const studentsList = studentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setStudents(studentsList);

        // Check if attendance is already marked for today
        await checkExistingAttendance();
      } catch (error) {
        console.error("Error fetching students:", error);
        toast.error("Failed to load students");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentsForCourse();
  }, [selectedCourse, isTeacher]);

  // For students: fetch attendance when course selected
  useEffect(() => {
    if (isStudent && selectedCourse && user) {
      fetchStudentAttendance(user.uid, selectedCourse);
    }
  }, [selectedCourse, isStudent, user]);

  // Fetch student's attendance records for a specific course
  const fetchStudentAttendance = async (studentId, courseId) => {
    try {
      setLoading(true);
      const attendanceQuery = query(
        collection(firestore, "attendance"),
        where("courseId", "==", courseId)
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);

      // Get all attendance sessions for this course
      const attendanceSessions = attendanceSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Extract this student's attendance from the sessions
      const studentAttendanceRecords = [];

      attendanceSessions.forEach((session) => {
        const record = session.attendanceData.find(
          (record) => record.studentId === studentId
        );

        if (record) {
          studentAttendanceRecords.push({
            date: session.date,
            present: record.present,
            sessionId: session.id,
          });
        }
      });

      // Sort by date (newest first)
      studentAttendanceRecords.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      setStudentAttendance(studentAttendanceRecords);
    } catch (error) {
      console.error("Error fetching student attendance:", error);
      toast.error("Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  };

  // Check if attendance is already marked for selected date
  const checkExistingAttendance = async () => {
    if (!selectedCourse) return;

    try {
      const attendanceQuery = query(
        collection(firestore, "attendance"),
        where("courseId", "==", selectedCourse),
        where("date", "==", selectedDate)
      );

      const attendanceSnapshot = await getDocs(attendanceQuery);

      if (!attendanceSnapshot.empty) {
        const attendanceDoc = attendanceSnapshot.docs[0];
        const attendanceData = attendanceDoc.data().attendanceData || [];

        // Pre-fill the attendance records
        setAttendanceRecords(attendanceData);
      } else {
        // Initialize attendance records for all students
        const initialAttendance = students.map((student) => ({
          studentId: student.uid,
          studentName: student.name || student.displayName,
          present: false,
        }));

        setAttendanceRecords(initialAttendance);
      }
    } catch (error) {
      console.error("Error checking existing attendance:", error);
    }
  };

  // Mark a student as present or absent
  const toggleAttendance = (studentId) => {
    setAttendanceRecords(
      attendanceRecords.map((record) => {
        if (record.studentId === studentId) {
          return { ...record, present: !record.present };
        }
        return record;
      })
    );
  };

  // Save attendance for the day
  const saveAttendance = async () => {
    if (!selectedCourse || !selectedDate) {
      toast.error("Please select a course and date");
      return;
    }

    try {
      // Check if attendance record exists for this date and course
      const attendanceQuery = query(
        collection(firestore, "attendance"),
        where("courseId", "==", selectedCourse),
        where("date", "==", selectedDate)
      );

      const attendanceSnapshot = await getDocs(attendanceQuery);

      if (attendanceSnapshot.empty) {
        // Create new attendance record
        await addDoc(collection(firestore, "attendance"), {
          courseId: selectedCourse,
          date: selectedDate,
          markedBy: user.uid,
          markedAt: Timestamp.now(),
          attendanceData: attendanceRecords,
        });
      } else {
        // Update existing record
        const attendanceDoc = attendanceSnapshot.docs[0];
        await updateDoc(doc(firestore, "attendance", attendanceDoc.id), {
          attendanceData: attendanceRecords,
          lastUpdatedBy: user.uid,
          lastUpdatedAt: Timestamp.now(),
        });
      }

      toast.success("Attendance saved successfully");
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error("Failed to save attendance");
    }
  };

  // Fetch attendance history for a course
  const fetchAttendanceHistory = async () => {
    if (!selectedCourse) return;

    try {
      setLoading(true);
      const attendanceQuery = query(
        collection(firestore, "attendance"),
        where("courseId", "==", selectedCourse)
      );

      const attendanceSnapshot = await getDocs(attendanceQuery);
      const attendanceList = attendanceSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort by date (newest first)
      attendanceList.sort((a, b) => new Date(b.date) - new Date(a.date));

      return attendanceList;
    } catch (error) {
      console.error("Error fetching attendance history:", error);
      toast.error("Failed to load attendance records");
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Calculate attendance statistics
  const calculateAttendanceStats = (attendanceHistory) => {
    if (!students || students.length === 0) return [];

    const studentStats = {};

    // Initialize stats for each student
    students.forEach((student) => {
      studentStats[student.uid] = {
        studentId: student.uid,
        studentName: student.name || student.displayName,
        totalClasses: 0,
        presentCount: 0,
        absentCount: 0,
        percentage: 0,
      };
    });

    // Calculate attendance for each session
    attendanceHistory.forEach((session) => {
      session.attendanceData.forEach((record) => {
        if (studentStats[record.studentId]) {
          studentStats[record.studentId].totalClasses++;

          if (record.present) {
            studentStats[record.studentId].presentCount++;
          } else {
            studentStats[record.studentId].absentCount++;
          }
        }
      });
    });

    // Calculate percentage
    Object.keys(studentStats).forEach((studentId) => {
      const stats = studentStats[studentId];
      stats.percentage =
        stats.totalClasses > 0
          ? Math.round((stats.presentCount / stats.totalClasses) * 100)
          : 0;
    });

    // Convert to array and sort by name
    return Object.values(studentStats).sort((a, b) =>
      a.studentName.localeCompare(b.studentName)
    );
  };

  // Download attendance record as CSV
  const downloadAttendanceCSV = async () => {
    if (!selectedCourse) {
      toast.error("Please select a course");
      return;
    }

    try {
      // Get course name
      const courseDoc = await getDoc(doc(firestore, "courses", selectedCourse));
      const courseName = courseDoc.exists() ? courseDoc.data().name : "Course";

      // Get attendance history
      const attendanceHistory = await fetchAttendanceHistory();

      if (attendanceHistory.length === 0) {
        toast.info("No attendance records to download");
        return;
      }

      // Format the data
      let csvContent = "Student Name,Student ID";

      // Add dates as columns
      const dates = attendanceHistory.map((session) => session.date);
      dates.forEach((date) => {
        csvContent += `,${date}`;
      });

      csvContent += ",Present Count,Absent Count,Attendance Percentage\n";

      // Add data for each student
      const stats = calculateAttendanceStats(attendanceHistory);

      stats.forEach((studentStat) => {
        csvContent += `${studentStat.studentName},${studentStat.studentId}`;

        // Add attendance for each date
        dates.forEach((date) => {
          const session = attendanceHistory.find((s) => s.date === date);
          const record = session?.attendanceData.find(
            (r) => r.studentId === studentStat.studentId
          );
          csvContent += `,${record?.present ? "Present" : "Absent"}`;
        });

        // Add summary
        csvContent += `,${studentStat.presentCount},${studentStat.absentCount},${studentStat.percentage}%\n`;
      });

      // Create and download the file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `${courseName}_Attendance.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading attendance:", error);
      toast.error("Failed to download attendance records");
    }
  };

  // Get attendance percentage class based on value
  const getAttendanceClass = (percentage) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 75) return "text-blue-600";
    if (percentage >= 60) return "text-amber-500";
    return "text-red-600";
  };

  // Get attendance indicator component
  const getAttendanceIndicator = (present) => {
    return present ? (
      <span className="flex items-center text-green-600">
        <FiCheck className="mr-1" /> Present
      </span>
    ) : (
      <span className="flex items-center text-red-600">
        <FiX className="mr-1" /> Absent
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pt-10 pb-10">
      <button
        onClick={() => navigate("/student-dashboard")}
        className="flex items-center ml-8 my-4 text-red-600 hover:text-green-800 transition-colors"
      >
        <FiArrowLeft className="mr-2" />
        Go Back
      </button>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Attendance Tracker
        </h1>

        {/* Course Selection */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Course:
              </label>
              <select
                className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                disabled={loading}
              >
                {courses.length === 0 ? (
                  <option value="">No courses available</option>
                ) : (
                  courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {isTeacher && (
              <div className="flex flex-wrap gap-2">
                <button
                  className={`flex items-center px-4 py-2 rounded-md ${
                    attendanceView === "mark"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  onClick={() => setAttendanceView("mark")}
                >
                  <FiCheck className="mr-2" /> Mark Attendance
                </button>
                <button
                  className={`flex items-center px-4 py-2 rounded-md ${
                    attendanceView === "history"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  onClick={async () => {
                    setAttendanceView("history");
                  }}
                >
                  <FiCalendar className="mr-2" /> Attendance History
                </button>
                <button
                  className={`flex items-center px-4 py-2 rounded-md ${
                    attendanceView === "stats"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  onClick={async () => {
                    setAttendanceView("stats");
                  }}
                >
                  <FiPieChart className="mr-2" /> Statistics
                </button>
                <button
                  className="flex items-center px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
                  onClick={downloadAttendanceCSV}
                >
                  <FiDownload className="mr-2" /> Export CSV
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content based on role and view selection */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <p className="text-lg text-gray-600">Loading...</p>
          </div>
        ) : (
          <>
            {isTeacher && (
              <>
                {/* Teacher's View */}
                {attendanceView === "mark" && (
                  <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 md:mb-0">
                          Mark Attendance
                        </h2>
                        <div className="flex items-center">
                          <label className="block text-sm font-medium text-gray-700 mr-2">
                            Date:
                          </label>
                          <input
                            type="date"
                            className="border border-gray-300 rounded-md shadow-sm py-1 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            value={selectedDate}
                            onChange={(e) => {
                              setSelectedDate(e.target.value);
                              // Reset attendance records when date changes
                              const initialAttendance = students.map(
                                (student) => ({
                                  studentId: student.uid,
                                  studentName:
                                    student.name || student.displayName,
                                  present: false,
                                })
                              );
                              setAttendanceRecords(initialAttendance);
                            }}
                            max={new Date().toISOString().split("T")[0]}
                          />
                        </div>
                      </div>
                    </div>

                    {students.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-gray-600">
                          No students enrolled in this course.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {students.map((student) => {
                                const attendanceRecord = attendanceRecords.find(
                                  (record) => record.studentId === student.uid
                                ) || { present: false };

                                return (
                                  <tr
                                    key={student.uid}
                                    className="hover:bg-gray-50"
                                  >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className="ml-4">
                                          <div className="text-sm font-medium text-gray-900">
                                            {student.name ||
                                              student.displayName}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-500">
                                        {student.studentId ||
                                          student.uid.slice(0, 8)}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      {attendanceRecord.present ? (
                                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                          Present
                                        </span>
                                      ) : (
                                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                          Absent
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                      <button
                                        onClick={() =>
                                          toggleAttendance(student.uid)
                                        }
                                        className={`${
                                          attendanceRecord.present
                                            ? "bg-red-600 hover:bg-red-700"
                                            : "bg-green-600 hover:bg-green-700"
                                        } text-white py-1 px-3 rounded-md transition-colors`}
                                      >
                                        {attendanceRecord.present
                                          ? "Mark Absent"
                                          : "Mark Present"}
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                          <button
                            onClick={saveAttendance}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Save Attendance
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {attendanceView === "history" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-xl shadow-md overflow-hidden"
                  >
                    <div className="p-6 bg-gradient-to-r from-amber-50 to-amber-100 border-b border-amber-200">
                      <h2 className="text-xl font-semibold text-gray-800">
                        Attendance History
                      </h2>
                    </div>

                    <div className="p-6">
                      {/* Fetch and display attendance history */}
                      {loading ? (
                        <p className="text-center py-4">Loading history...</p>
                      ) : (
                        <>
                          <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between">
                            <div className="mb-4 md:mb-0">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Filter by:
                              </label>
                              <div className="flex space-x-2">
                                <button
                                  className={`px-3 py-1 rounded-md text-sm ${
                                    attendanceFilter === "all"
                                      ? "bg-blue-600 text-white"
                                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                  }`}
                                  onClick={() => setAttendanceFilter("all")}
                                >
                                  All
                                </button>
                                <button
                                  className={`px-3 py-1 rounded-md text-sm ${
                                    attendanceFilter === "present"
                                      ? "bg-green-600 text-white"
                                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                  }`}
                                  onClick={() => setAttendanceFilter("present")}
                                >
                                  Present
                                </button>
                                <button
                                  className={`px-3 py-1 rounded-md text-sm ${
                                    attendanceFilter === "absent"
                                      ? "bg-red-600 text-white"
                                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                  }`}
                                  onClick={() => setAttendanceFilter("absent")}
                                >
                                  Absent
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Implement the fetch and display history here */}
                        </>
                      )}
                    </div>
                  </motion.div>
                )}

                {attendanceView === "stats" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-xl shadow-md overflow-hidden"
                  >
                    <div className="p-6 bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
                      <h2 className="text-xl font-semibold text-gray-800">
                        Attendance Statistics
                      </h2>
                    </div>

                    <div className="p-6">
                      {/* Implement attendance statistics here */}
                    </div>
                  </motion.div>
                )}
              </>
            )}

            {isStudent && selectedStudent && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Student overview */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                      <h2 className="text-xl font-semibold text-gray-800">
                        My Attendance
                      </h2>
                    </div>

                    <div className="p-6">
                      {/* Calculate overall statistics */}
                      {studentAttendance.length > 0 ? (
                        <>
                          <div className="mb-6">
                            <h3 className="text-lg font-medium text-gray-800 mb-3">
                              Overview
                            </h3>

                            {(() => {
                              const totalClasses = studentAttendance.length;
                              const presentCount = studentAttendance.filter(
                                (a) => a.present
                              ).length;
                              const percentage = Math.round(
                                (presentCount / totalClasses) * 100
                              );

                              return (
                                <>
                                  <div className="flex justify-between mb-1">
                                    <span>Attendance Percentage:</span>
                                    <span
                                      className={getAttendanceClass(percentage)}
                                    >
                                      {percentage}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                                    <div
                                      className={`h-2.5 rounded-full ${
                                        percentage >= 75
                                          ? "bg-green-600"
                                          : percentage >= 60
                                          ? "bg-yellow-400"
                                          : "bg-red-600"
                                      }`}
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                                      <div className="text-2xl font-bold text-blue-600">
                                        {totalClasses}
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        Total Classes
                                      </div>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg text-center">
                                      <div className="text-2xl font-bold text-green-600">
                                        {presentCount}
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        Classes Attended
                                      </div>
                                    </div>
                                  </div>

                                  {/* Status indicator */}
                                  <div className="p-4 rounded-lg text-center border mt-4">
                                    <div className="text-lg font-medium">
                                      Your attendance is
                                    </div>
                                    <div
                                      className={`text-xl font-bold ${getAttendanceClass(
                                        percentage
                                      )}`}
                                    >
                                      {percentage >= 75
                                        ? "Good"
                                        : percentage >= 60
                                        ? "Adequate"
                                        : "Low - Attendance Warning"}
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">
                            No attendance records found.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Attendance history */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="p-6 bg-gradient-to-r from-amber-50 to-amber-100 border-b border-amber-200">
                      <h2 className="text-xl font-semibold text-gray-800">
                        Attendance History
                      </h2>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {studentAttendance.length > 0 ? (
                            studentAttendance.map((record, index) => (
                              <tr
                                key={index}
                                className={
                                  record.present ? "bg-green-50" : "bg-red-50"
                                }
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {new Date(record.date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {getAttendanceIndicator(record.present)}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="2"
                                className="px-6 py-4 text-center text-sm text-gray-500"
                              >
                                No attendance records found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AttendanceTracker;
