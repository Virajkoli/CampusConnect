import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiFilter } from "react-icons/fi";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { firestore, auth } from "../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { toast } from "react-toastify";

const StudentTimetable = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState(null);
  const [classes, setClasses] = useState([]);
  const [filterBranch, setFilterBranch] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterSemester, setFilterSemester] = useState("");

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
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
    const fetchStudentInfo = async () => {
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        const userDoc = await getDoc(doc(firestore, "users", user.uid));
        let data = null;

        if (userDoc.exists()) {
          data = userDoc.data();
        } else {
          const studentDoc = await getDoc(doc(firestore, "students", user.uid));
          if (studentDoc.exists()) {
            data = studentDoc.data();
          }
        }

        if (!data) {
          toast.error("Student profile not found.");
          setLoading(false);
          return;
        }

        const branch = data.dept || data.department || "";
        const year = data.year || "";
        const semester = data.semester || "";

        setStudentInfo({ uid: user.uid, ...data });
        setFilterBranch(branch);
        setFilterYear(year);
        setFilterSemester(semester);
      } catch (error) {
        console.error("Error fetching student info:", error);
        toast.error("Failed to load student profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentInfo();
  }, [user, navigate]);

  useEffect(() => {
    const fetchTimetable = async () => {
      if (!filterBranch || !filterYear || !filterSemester) {
        setClasses([]);
        return;
      }

      try {
        const q = query(
          collection(firestore, "timetables"),
          where("branch", "==", filterBranch),
          where("year", "==", filterYear),
          where("semester", "==", filterSemester),
        );

        const snapshot = await getDocs(q);
        const classList = snapshot.docs
          .map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }))
          .sort((a, b) =>
            String(a.startTime || "").localeCompare(String(b.startTime || "")),
          );

        setClasses(classList);
      } catch (error) {
        console.error("Error fetching classes:", error);
        toast.error("Failed to load timetable");
      }
    };

    fetchTimetable();
  }, [filterBranch, filterYear, filterSemester]);

  const getClassesForSlot = (day, timeSlot) => {
    return classes.filter((c) => {
      const classStart = c.startTime;
      const classEnd = c.endTime;
      return c.day === day && classStart <= timeSlot && classEnd > timeSlot;
    });
  };

  const getColorForSubject = (subject = "") => {
    const colors = [
      "bg-blue-100 border-blue-500 text-blue-800",
      "bg-green-100 border-green-500 text-green-800",
      "bg-purple-100 border-purple-500 text-purple-800",
      "bg-orange-100 border-orange-500 text-orange-800",
      "bg-pink-100 border-pink-500 text-pink-800",
      "bg-indigo-100 border-indigo-500 text-indigo-800",
      "bg-teal-100 border-teal-500 text-teal-800",
    ];
    const index = subject.length % colors.length;
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
    <div className="container mx-auto px-3 sm:px-4 py-4 max-w-7xl">
      <button
        onClick={() => navigate("/student-dashboard")}
        className="flex items-center mb-6 text-blue-600 hover:text-blue-800 transition-colors"
      >
        <FiArrowLeft className="mr-2" />
        Back to Dashboard
      </button>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Class Timetable</h1>
        <p className="text-gray-600 mt-1">
          View your class schedule for the week
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <FiFilter className="text-gray-600" />
          <h3 className="font-semibold">Applied Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Branch</label>
            <input
              type="text"
              value={filterBranch}
              readOnly
              className="w-full p-2 border rounded-lg bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Year</label>
            <input
              type="text"
              value={filterYear}
              readOnly
              className="w-full p-2 border rounded-lg bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Semester</label>
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">Select semester</option>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          </div>
        </div>

        <div className="mt-3 text-sm text-gray-600">
          Showing {classes.length} class(es)
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse">
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
                            className={`${getColorForSubject(classItem.subjectName || classItem.subject)} p-2 rounded-lg mb-1 border-l-4`}
                          >
                            <div className="font-semibold text-sm">
                              {classItem.subjectName || classItem.subject}
                            </div>
                            <div className="text-xs mt-1">
                              {classItem.startTime} - {classItem.endTime}
                            </div>
                            {classItem.teacherName && (
                              <div className="text-xs">
                                👨‍🏫 {classItem.teacherName}
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
            No classes found for your current profile.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Contact your teachers if timetable slots are not published yet.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentTimetable;
