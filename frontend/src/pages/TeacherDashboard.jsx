// src/pages/TeacherDashboard.jsx
import React, { useState, useEffect } from "react";
import { auth, firestore, db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { FiSearch, FiLogOut, FiBook } from "react-icons/fi";
import {
  FaChalkboardTeacher,
  FaBell,
  FaComments,
  FaBook,
  FaCheckCircle,
  FaClipboardList,
  FaGraduationCap,
  FaCalendarCheck,
} from "react-icons/fa";
import { IoHome } from "react-icons/io5";
import CalendarComponent from "../components/CalendarComponent";

const getTodaysDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function TeacherDashboard() {
  const [students, setStudents] = useState([]);
  const [teacherName, setTeacherName] = useState("John Doe");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [isTeacherVerified, setIsTeacherVerified] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [todaysClasses, setTodaysClasses] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const verifyRole = async () => {
      setIsTeacherVerified(true);
    };

    verifyRole();

    const fetchStudents = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, "students"));
        const studentList = [];
        querySnapshot.forEach((docSnap) => {
          studentList.push({ id: docSnap.id, ...docSnap.data() });
        });
        setStudents(studentList);
      } catch (err) {
        setError("Failed to fetch students: " + err.message);
      }
    };

    const fetchTeacherName = () => {
      const user = auth.currentUser;
      if (user) {
        setTeacherName(user.displayName || "Unknown Teacher");
      }
    };

    fetchStudents();
    fetchTeacherName();
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => {
      clearInterval(timerId);
    };
  }, []);

  useEffect(() => {
    let unsubscribeFromClasses = () => {};

    // Clear previous class-fetching errors specifically before attempting to fetch again
    if (error.includes("Failed to fetch today's classes")) {
      setError("");
    }

    const currentUser = auth.currentUser;

    if (isTeacherVerified) {
      console.log(
        "TeacherDashboard: useEffect for classes - User:",
        currentUser
      );

      if (currentUser && currentUser.uid) {
        const todayString = getTodaysDateString();
        console.log(
          "TeacherDashboard: useEffect for classes - Today's Date String:",
          todayString
        );

        const classesRef = collection(firestore, "classes");
        console.log(
          "TeacherDashboard: useEffect for classes - Attempting to query classes for teacherId:",
          currentUser.uid,
          "on date:",
          todayString
        );

        const q = query(
          classesRef,
          where("teacherId", "==", currentUser.uid),
          where("date", "==", todayString)
        );

        unsubscribeFromClasses = onSnapshot(
          q,
          (querySnapshot) => {
            console.log(
              "TeacherDashboard: useEffect for classes - Snapshot received. Number of docs:",
              querySnapshot.size
            );
            const classesList = [];
            querySnapshot.forEach((doc) => {
              classesList.push({ id: doc.id, ...doc.data() });
            });
            classesList.sort((a, b) => {
              const timeA = a.startTime || "00:00";
              const timeB = b.startTime || "00:00";
              return timeA.localeCompare(timeB);
            });
            setTodaysClasses(classesList);
            if (error.includes("Failed to fetch today's classes")) {
              setError("");
            }
          },
          (err) => {
            console.log(
              "TeacherDashboard: useEffect for classes - Entering onSnapshot error callback."
            );
            console.error(
              "TeacherDashboard: Detailed error fetching today's classes: ",
              err
            );
            setError(
              "Failed to fetch today's classes. Check console for details."
            );
            setTodaysClasses([]);
          }
        );
      } else {
        console.log(
          "TeacherDashboard: useEffect for classes - User not available or user.uid is missing. User:",
          currentUser
        );
        setTodaysClasses([]);
      }
    } else {
      console.log(
        "TeacherDashboard: useEffect for classes - Teacher not verified."
      );
      setTodaysClasses([]);
    }

    return () => {
      console.log(
        "TeacherDashboard: useEffect for classes - Cleaning up snapshot listener."
      );
      unsubscribeFromClasses();
    };
  }, [isTeacherVerified, auth.currentUser]);

  const hasTimePassed = (classItem) => {
    const now = currentTime;
    if (
      !classItem.date ||
      !classItem.endTime ||
      !classItem.endTime.includes(":")
    ) {
      return false;
    }
    const [endHours, endMinutes] = classItem.endTime.split(":").map(Number);
    const classEndDate = new Date(classItem.date);
    classEndDate.setHours(endHours);
    classEndDate.setMinutes(endMinutes);
    classEndDate.setSeconds(0);
    classEndDate.setMilliseconds(0);
    return now > classEndDate;
  };

  const handleMarkAsConducted = async (classId) => {
    setError(""); // Clear previous errors
    try {
      const classDocRef = doc(firestore, "classes", classId);
      await updateDoc(classDocRef, {
        isConducted: true,
      });
      console.log("Class marked as conducted:", classId);
    } catch (err) {
      console.error("Error marking class as conducted:", err);
      setError("Failed to mark class as conducted. Please try again.");
    }
  };

  const handleCreateAssignment = async (assignmentData) => {
    if (!selectedCourse) {
      setError("Please select a course first");
      return;
    }

    const result = await createAssignment(selectedCourse.id, assignmentData);

    if (result.success) {
      alert(`Assignment created successfully! ID: ${result.assignmentId}`);
    } else {
      setError(result.error || "Failed to create assignment");
    }
  };

  const handleUploadMarks = async (assignmentId, gradesData) => {
    if (!selectedCourse) {
      setError("Please select a course first");
      return;
    }

    const result = await uploadStudentMarks(
      selectedCourse.id,
      assignmentId,
      gradesData
    );

    if (result.success) {
      alert("Student marks uploaded successfully!");
    } else {
      setError(result.error || "Failed to upload marks");
    }
  };

  const handleMarkAttendance = async (date, attendanceData) => {
    if (!selectedCourse) {
      setError("Please select a course first");
      return;
    }

    const result = await markAttendance(
      selectedCourse.id,
      date,
      attendanceData
    );

    if (result.success) {
      alert("Attendance marked successfully!");
    } else {
      setError(result.error || "Failed to mark attendance");
    }
  };

  if (error && error.startsWith("You don't have teacher privileges")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 text-xl">{error}</p>
      </div>
    );
  }

  if (!isTeacherVerified && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Verifying teacher status...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#e0eafc] via-[#cfdef3] to-[#dcdfe2] text-gray-800 flex">
      <aside className="w-25 bg-gradient-to-b from-purple-600 via-blue-400 to-purple-600 text-white p-6 flex flex-col space-y-6 relative">
        <h2 className="text-2xl font-bold mb-4">Teacher Portal</h2>
        <nav className="space-y-4 mt-6">
          <SidebarItem
            icon={<IoHome />}
            label="Dashboard"
            path="/teacher-dashboard"
          />
          <SidebarItem
            icon={<FaBook />}
            label="Courses"
            path="/teacher-courses"
          />
          {/* <SidebarItem
            icon={<FiBook />}
            label="Study Materials"
            path="/teacher-studymaterial"
          /> */}
          {/* <SidebarItem
            icon={<FaChalkboardTeacher />}
            label="My Classes"
            path="/teacher-classes"
          /> */}
          <SidebarItem icon={<FiLogOut />} label="Logout" path="/login" />
        </nav>
      </aside>

      <main className="flex-1 p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search here..."
                className="px-4 py-2 border rounded-lg pl-10"
              />
              <FiSearch className="absolute top-2.5 left-3 text-gray-400" />
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-300" />
            {teacherName}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-6">
          <div className="flex-1 bg-white p-6 rounded-xl shadow-lg order-2 lg:order-1">
            <h3 className="text-xl font-semibold mb-4 text-purple-700">
              Today's Classes
            </h3>
            {error &&
              !error.startsWith("You don't have teacher privileges") && (
                <p className="text-red-500 mb-2">{error}</p>
              )}
            {todaysClasses.length > 0 ? (
              <div className="space-y-3">
                {todaysClasses.map((classItem) => {
                  const isConducted = classItem.isConducted === true;
                  const timeHasPassed = hasTimePassed(classItem);
                  const showCompletedBadge = isConducted;
                  const showMarkAsConductedButton =
                    !isConducted && timeHasPassed;

                  return (
                    <div
                      key={classItem.id}
                      className={`p-3 rounded-lg border ${
                        isConducted
                          ? "bg-green-50 border-green-400"
                          : timeHasPassed
                          ? "bg-yellow-50 border-yellow-400"
                          : "bg-purple-50 border-purple-300"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-md text-purple-800">
                            {classItem.subject || "N/A Subject"} -{" "}
                            {classItem.department || "N/A Dept."} (
                            {classItem.year || "N/A Year"})
                          </h4>
                          <p className="text-sm text-gray-600">
                            Time: {classItem.startTime || "--:--"} -{" "}
                            {classItem.endTime || "--:--"}
                          </p>
                          {!isConducted &&
                            timeHasPassed &&
                            !showMarkAsConductedButton && (
                              <p className="text-xs text-yellow-600 mt-1">
                                Scheduled time has passed.
                              </p>
                            )}
                        </div>
                        <div className="flex flex-col items-end">
                          {showCompletedBadge && (
                            <span className="text-green-600 flex items-center text-xs mt-1 whitespace-nowrap">
                              <FaCheckCircle className="mr-1" /> Conducted
                            </span>
                          )}
                          {showMarkAsConductedButton && (
                            <button
                              onClick={() =>
                                handleMarkAsConducted(classItem.id)
                              }
                              className="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                            >
                              Mark as Conducted
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500">
                {isTeacherVerified
                  ? "No classes scheduled for today."
                  : "Loading classes or not verified..."}
              </p>
            )}
          </div>

          <div className="w-full lg:w-1/3 bg-white p-4 rounded-xl shadow-lg order-1 lg:order-2">
            <CalendarComponent />
          </div>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, path }) {
  return (
    <Link
      to={path || "#"}
      className="flex items-center space-x-3 hover:bg-white hover:text-green-600 px-4 py-2 rounded-lg transition"
    >
      <div className="text-lg">{icon}</div>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
