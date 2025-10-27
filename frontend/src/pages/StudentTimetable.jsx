import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiFilter } from "react-icons/fi";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firestore, auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { toast } from "react-toastify";

const StudentTimetable = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState(null);
  const [classes, setClasses] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [filterDivision, setFilterDivision] = useState("");

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const timeSlots = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
  ];

  useEffect(() => {
    fetchStudentInfo();
  }, [user]);

  useEffect(() => {
    if (studentInfo) {
      fetchClasses();
    }
  }, [studentInfo]);

  useEffect(() => {
    applyFilters();
  }, [filterDepartment, filterSemester, filterDivision, allClasses]);

  const fetchStudentInfo = async () => {
    if (!user) {
      navigate("/student-auth");
      return;
    }

    try {
      const studentsRef = collection(firestore, "students");
      const q = query(studentsRef, where("uid", "==", user.uid));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setStudentInfo({
          id: snapshot.docs[0].id,
          ...data,
        });
        // Auto-set filters based on student info
        setFilterDepartment(data.department || "");
        setFilterSemester(data.semester || "");
        setFilterDivision(data.division || "");
      } else {
        // Fallback: check users collection
        const usersRef = collection(firestore, "users");
        const userQuery = query(usersRef, where("uid", "==", user.uid));
        const userSnapshot = await getDocs(userQuery);

        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data();
          setStudentInfo({
            id: userSnapshot.docs[0].id,
            ...userData,
          });
          setFilterDepartment(userData.dept || "");
        } else {
          // Use default info
          setStudentInfo({
            id: user.uid,
            name: user.displayName || "Student",
            email: user.email,
            uid: user.uid,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching student info:", error);
      // Use default info on error
      setStudentInfo({
        id: user.uid,
        name: user.displayName || "Student",
        email: user.email,
        uid: user.uid,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const classesRef = collection(firestore, "timetable");
      const snapshot = await getDocs(classesRef);

      const classList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setAllClasses(classList);
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error("Failed to load timetable");
    }
  };

  const applyFilters = () => {
    let filtered = [...allClasses];

    if (filterDepartment) {
      filtered = filtered.filter(
        (c) => !c.department || c.department === filterDepartment
      );
    }

    if (filterSemester) {
      filtered = filtered.filter(
        (c) => !c.semester || c.semester === filterSemester
      );
    }

    if (filterDivision) {
      filtered = filtered.filter(
        (c) => !c.division || c.division === filterDivision
      );
    }

    setClasses(filtered);
  };

  const getClassesForSlot = (day, timeSlot) => {
    return classes.filter((c) => {
      const classStart = c.startTime;
      const classEnd = c.endTime;
      return c.day === day && classStart <= timeSlot && classEnd > timeSlot;
    });
  };

  const getColorForSubject = (subject) => {
    const colors = [
      "bg-blue-100 border-blue-500 text-blue-800",
      "bg-green-100 border-green-500 text-green-800",
      "bg-purple-100 border-purple-500 text-purple-800",
      "bg-orange-100 border-orange-500 text-orange-800",
      "bg-pink-100 border-pink-500 text-pink-800",
      "bg-indigo-100 border-indigo-500 text-indigo-800",
      "bg-teal-100 border-teal-500 text-teal-800",
    ];
    const index = subject.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <button
        onClick={() => navigate("/student-dashboard")}
        className="flex items-center mb-6 text-blue-600 hover:text-blue-800 transition-colors"
      >
        <FiArrowLeft className="mr-2" />
        Back to Dashboard
      </button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Class Timetable</h1>
        <p className="text-gray-600 mt-1">
          {studentInfo?.department && `${studentInfo.department} - `}
          View your class schedule for the week
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <FiFilter className="text-gray-600" />
          <h3 className="font-semibold">Filter Classes</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Department</label>
            <input
              type="text"
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full p-2 border rounded-lg"
              placeholder="e.g., Computer Engineering"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Semester</label>
            <input
              type="text"
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="w-full p-2 border rounded-lg"
              placeholder="e.g., 3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Division</label>
            <input
              type="text"
              value={filterDivision}
              onChange={(e) => setFilterDivision(e.target.value)}
              className="w-full p-2 border rounded-lg"
              placeholder="e.g., A"
            />
          </div>
        </div>
        <div className="mt-3 text-sm text-gray-600">
          Showing {classes.length} classe(s)
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                <th className="p-3 text-left font-semibold border border-green-500">
                  Time
                </th>
                {days.map((day) => (
                  <th
                    key={day}
                    className="p-3 text-center font-semibold border border-green-500 min-w-[150px]"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((timeSlot) => (
                <tr key={timeSlot} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-700 bg-gray-50 border">
                    {timeSlot}
                  </td>
                  {days.map((day) => {
                    const slotClasses = getClassesForSlot(day, timeSlot);
                    return (
                      <td key={day} className="p-2 border">
                        {slotClasses.map((classItem) => (
                          <div
                            key={classItem.id}
                            className={`${getColorForSubject(
                              classItem.subject
                            )} p-2 rounded-lg mb-1 border-l-4`}
                          >
                            <div className="font-semibold text-sm">
                              {classItem.subject}
                            </div>
                            <div className="text-xs mt-1">
                              {classItem.startTime} - {classItem.endTime}
                            </div>
                            {classItem.room && (
                              <div className="text-xs">
                                📍 Room: {classItem.room}
                              </div>
                            )}
                            {classItem.teacherName && (
                              <div className="text-xs">
                                👨‍🏫 {classItem.teacherName}
                              </div>
                            )}
                            {classItem.division && (
                              <div className="text-xs">
                                Div: {classItem.division}
                              </div>
                            )}
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {classes.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg mt-6">
          <p className="text-gray-600 text-lg">
            No classes found for the selected filters.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Try adjusting your filter criteria.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentTimetable;
