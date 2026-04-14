import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { firestore, auth } from "../../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  doc,
  getDoc,
  orderBy,
  limit,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  FiCalendar,
  FiBook,
  FiBell,
  FiClock,
  FiCheck,
  FiBarChart2,
  FiMapPin,
  FiUser,
  FiChevronRight,
  FiChevronDown,
  FiGrid,
  FiFileText,
  FiUsers,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import {
  getStudentAttendance,
  getActiveAttendanceSessions,
} from "../../services/attendanceService";

const makeSubjectId = (subjectName = "") =>
  String(subjectName || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const formatDateTime = (value) => {
  if (!value) return "";
  if (typeof value?.toDate === "function")
    return value.toDate().toLocaleString();
  if (typeof value?.seconds === "number")
    return new Date(value.seconds * 1000).toLocaleString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toLocaleString();
};

const normalizeYearToken = (value = "") =>
  String(value || "").replace(/[^0-9]/g, "");

const parseExamDate = (dateStr = "") => {
  const raw = String(dateStr || "").trim();
  if (!raw) return null;

  const dmyMatch = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]) - 1;
    const year = Number(dmyMatch[3]);
    return new Date(year < 100 ? 2000 + year : year, month, day);
  }

  const isoMatch = raw.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (isoMatch) {
    return new Date(
      Number(isoMatch[1]),
      Number(isoMatch[2]) - 1,
      Number(isoMatch[3]),
    );
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const branchMappings = {
  "Computer Engineering": ["computer", "comp", "cse", "cs", "co"],
  "Electronics And TeleCommunication Engineering": [
    "electronics",
    "e&tc",
    "entc",
    "ece",
    "etc",
    "et",
  ],
  "Mechanical Engineering": ["mechanical", "mech", "me"],
  "Civil Engineering": ["civil", "ce"],
  "Electrical Engineering": ["electrical", "ee", "eee"],
  "Instrumentation Engineering": ["instrumentation", "inst", "in"],
  "Information Technology": ["information", "it"],
};

const branchMatches = (examBranch = "", targetBranch = "") => {
  const exam = String(examBranch || "")
    .trim()
    .toLowerCase();
  const target = String(targetBranch || "")
    .trim()
    .toLowerCase();
  if (!target) return true;
  if (!exam) return false;
  if (exam === target) return true;
  if (exam.includes(target) || target.includes(exam)) return true;

  const aliases = branchMappings[targetBranch] || [];
  return aliases.some((alias) => exam.includes(alias));
};

const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function StudentDashboard() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [studentName, setStudentName] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [division, setDivision] = useState("");
  const [courses, setCourses] = useState([]);
  const [subjectTeachersMap, setSubjectTeachersMap] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timetable, setTimetable] = useState([]);
  const [todaysClasses, setTodaysClasses] = useState([]);
  const [attendanceStatsBySubject, setAttendanceStatsBySubject] = useState({});
  const [attendanceRefreshing, setAttendanceRefreshing] = useState(false);
  const [studyMaterials, setStudyMaterials] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [activeSessionsRefreshing, setActiveSessionsRefreshing] =
    useState(false);
  const [examSchedule, setExamSchedule] = useState([]);
  const [eventsCalendar, setEventsCalendar] = useState([]);
  const [academicCalendar, setAcademicCalendar] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const today = daysOfWeek[new Date().getDay()];

  const subjectColors = [
    { bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-700" },
    {
      bg: "bg-purple-100",
      border: "border-purple-300",
      text: "text-purple-700",
    },
    { bg: "bg-green-100", border: "border-green-300", text: "text-green-700" },
    {
      bg: "bg-orange-100",
      border: "border-orange-300",
      text: "text-orange-700",
    },
    { bg: "bg-pink-100", border: "border-pink-300", text: "text-pink-700" },
    { bg: "bg-teal-100", border: "border-teal-300", text: "text-teal-700" },
  ];

  const getSubjectColor = (index) =>
    subjectColors[index % subjectColors.length];

  const subjectColorClasses = [
    "bg-blue-100 border-blue-300 text-blue-700",
    "bg-purple-100 border-purple-300 text-purple-700",
    "bg-green-100 border-green-300 text-green-700",
    "bg-orange-100 border-orange-300 text-orange-700",
    "bg-pink-100 border-pink-300 text-pink-700",
    "bg-teal-100 border-teal-300 text-teal-700",
    "bg-indigo-100 border-indigo-300 text-indigo-700",
  ];

  const getSubjectColorByName = (subjectName = "") => {
    const seed = String(subjectName || "")
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return subjectColorClasses[seed % subjectColorClasses.length];
  };

  const refreshAttendanceSummary = async (studentId, options = {}) => {
    const targetStudentId = String(studentId || "").trim();
    if (!targetStudentId) {
      return;
    }

    const silent = Boolean(options?.silent);
    setAttendanceRefreshing(true);
    try {
      const attendanceResult = await getStudentAttendance(targetStudentId);
      const stats = Array.isArray(attendanceResult.attendance)
        ? attendanceResult.attendance
        : [];
      const statsMap = {};
      stats.forEach((entry) => {
        const byId = String(entry.subjectId || "");
        const byName = makeSubjectId(entry.subjectName || "");
        if (byId) statsMap[byId] = entry;
        if (byName) statsMap[byName] = entry;
      });
      setAttendanceStatsBySubject(statsMap);
    } catch (error) {
      if (!silent) {
        console.error("Error refreshing attendance summary:", error);
      }
    } finally {
      setAttendanceRefreshing(false);
    }
  };

  const calculateNeededClassesFor75 = (attended = 0, total = 0) => {
    const attendedNum = Number(attended || 0);
    const totalNum = Number(total || 0);
    if (totalNum <= 0) return 0;
    if (attendedNum / totalNum >= 0.75) return 0;

    const required = Math.ceil((0.75 * totalNum - attendedNum) / 0.25);
    return Math.max(required, 0);
  };

  const navItems = useMemo(
    () => [
      { id: "overview", label: "Overview", icon: FiGrid },
      { id: "announcements", label: "Announcements", icon: FiBell },
      { id: "study-materials", label: "Study Materials", icon: FiBook },
      { id: "calendars", label: "Calendars", icon: FiCalendar },
      { id: "attendance", label: "Attendance", icon: FiCheck },
      { id: "exam", label: "Exam Schedule", icon: FiFileText },
      { id: "timetable", label: "Full Timetable", icon: FiClock },
    ],
    [],
  );

  const refreshActiveSessions = useCallback(
    async ({ silent = false } = {}) => {
      if (!user) {
        return;
      }

      if (!silent) {
        setActiveSessionsRefreshing(true);
      }

      try {
        const response = await getActiveAttendanceSessions();
        setActiveSessions(
          Array.isArray(response.sessions) ? response.sessions : [],
        );
      } catch (error) {
        if (!silent) {
          console.error("Error refreshing active attendance sessions:", error);
        }
        setActiveSessions([]);
      } finally {
        if (!silent) {
          setActiveSessionsRefreshing(false);
        }
      }
    },
    [user],
  );

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchStudentData = async () => {
      try {
        const userDocRef = doc(firestore, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        let studentData = null;
        if (userDocSnap.exists()) {
          studentData = userDocSnap.data();
        } else {
          const q = query(
            collection(firestore, "users"),
            where("uid", "==", user.uid),
          );
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            studentData = querySnapshot.docs[0].data();
          }
        }

        if (studentData) {
          const resolvedDept =
            studentData.dept || studentData.department || "Not assigned";
          const resolvedYear = studentData.year || "";
          const resolvedSemester = studentData.semester || "";

          setStudentName(
            studentData.name || studentData.displayName || "Student",
          );
          setDepartment(resolvedDept);
          setYear(resolvedYear);
          setSemester(resolvedSemester);
          setDivision(studentData.division || "A");

          // Show dashboard shell first, then hydrate heavier sections in background.
          setLoading(false);

          if (resolvedDept && resolvedYear && resolvedSemester) {
            fetchTimetable(resolvedDept, resolvedYear, resolvedSemester);
          }

          const assignedSubjects = Array.isArray(studentData.subjects)
            ? studentData.subjects
            : [];
          setCourses(
            assignedSubjects.map((subject, index) => ({
              id: index + 1,
              name: subject,
            })),
          );

          if (assignedSubjects.length > 0 && resolvedDept && resolvedYear) {
            fetchTeachersForSubjects(
              resolvedDept,
              resolvedYear,
              assignedSubjects,
            );
          } else {
            setSubjectTeachersMap({});
          }

          refreshAttendanceSummary(user.uid, { silent: true });

          fetchExamSchedule(resolvedDept, resolvedYear);
        }
      } catch (error) {
        console.error("Error fetching student data:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchTimetable = async (branch, academicYear, sem) => {
      try {
        const timetableRef = collection(firestore, "timetables");
        const q = query(
          timetableRef,
          where("branch", "==", branch),
          where("year", "==", academicYear),
          where("semester", "==", sem),
        );

        const querySnapshot = await getDocs(q);
        const allClasses = querySnapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .sort((a, b) =>
            String(a.startTime || "00:00").localeCompare(
              String(b.startTime || "00:00"),
            ),
          );

        setTimetable(allClasses);
        setTodaysClasses(
          allClasses.filter((classInfo) => classInfo.day === today),
        );
      } catch (error) {
        console.error("Error fetching timetable:", error);
      }
    };

    const fetchTeachersForSubjects = async (
      studentDept,
      studentYear,
      assignedSubjects,
    ) => {
      try {
        const teacherSnapshot = await getDocs(
          collection(firestore, "teachers"),
        );
        const nextMap = {};

        assignedSubjects.forEach((subject) => {
          nextMap[subject] = [];
        });

        teacherSnapshot.docs.forEach((teacherDoc) => {
          const teacherData = teacherDoc.data() || {};
          const teacherName =
            teacherData.name ||
            teacherData.fullName ||
            teacherData.displayName ||
            "Teacher";
          const teacherId =
            teacherData.teacherId || teacherData.employeeId || "";
          const teacherLabel = teacherId
            ? `${teacherName} (${teacherId})`
            : teacherName;

          const assignments =
            Array.isArray(teacherData.assignments) &&
            teacherData.assignments.length > 0
              ? teacherData.assignments
              : [];

          assignments.forEach((assignment) => {
            const sameBranch =
              String(assignment.branch || "")
                .trim()
                .toLowerCase() ===
              String(studentDept || "")
                .trim()
                .toLowerCase();
            const sameYear =
              String(assignment.year || "")
                .trim()
                .toLowerCase() ===
              String(studentYear || "")
                .trim()
                .toLowerCase();

            if (!sameBranch || !sameYear) return;

            assignedSubjects.forEach((subject) => {
              if ((assignment.subjects || []).includes(subject)) {
                nextMap[subject].push(teacherLabel);
              }
            });
          });
        });

        Object.keys(nextMap).forEach((subject) => {
          nextMap[subject] = [...new Set(nextMap[subject])];
        });

        setSubjectTeachersMap(nextMap);
      } catch (error) {
        console.error("Error fetching teacher-subject associations:", error);
        setSubjectTeachersMap({});
      }
    };

    const fetchExamSchedule = async (resolvedDept, resolvedYear) => {
      try {
        const examSnapshot = await getDocs(
          collection(firestore, "examTimetable"),
        );
        const studentYearToken = normalizeYearToken(resolvedYear);
        const filtered = examSnapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .filter((exam) => {
            const yearMatch =
              !studentYearToken ||
              normalizeYearToken(exam.year || "") === studentYearToken;
            const branchMatch = branchMatches(exam.branch || "", resolvedDept);
            return yearMatch && branchMatch;
          })
          .sort((a, b) => {
            const dateA = parseExamDate(a.date || "");
            const dateB = parseExamDate(b.date || "");
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            return dateA.getTime() - dateB.getTime();
          });

        setExamSchedule(filtered);
      } catch (error) {
        console.error("Error fetching exam schedule:", error);
        setExamSchedule([]);
      }
    };

    const announcementsQuery = query(
      collection(firestore, "announcements"),
      where("active", "==", true),
    );

    const unsubscribeAnnouncements = onSnapshot(
      announcementsQuery,
      (snapshot) => {
        const list = snapshot.docs
          .map((item) => ({
            id: item.id,
            ...item.data(),
            isRead: item.data().readBy?.includes(user.uid) || false,
          }))
          .sort((a, b) => {
            const timeA = a.createdAt?.toMillis?.() || 0;
            const timeB = b.createdAt?.toMillis?.() || 0;
            return timeB - timeA;
          });

        setAnnouncements(list);
      },
    );

    const materialsQuery = query(
      collection(firestore, "studyMaterials"),
      orderBy("createdAt", "desc"),
      limit(20),
    );

    const unsubscribeMaterials = onSnapshot(
      materialsQuery,
      (snapshot) => {
        const list = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));
        setStudyMaterials(list);
      },
      (error) => {
        console.error("Error fetching study materials:", error);
        setStudyMaterials([]);
      },
    );

    const eventsQuery = query(
      collection(firestore, "events"),
      orderBy("startDate"),
      limit(10),
    );
    const unsubscribeEvents = onSnapshot(
      eventsQuery,
      (snapshot) => {
        setEventsCalendar(
          snapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
        );
      },
      () => {
        setEventsCalendar([]);
      },
    );

    const academicQuery = query(
      collection(firestore, "academicCalendar"),
      orderBy("startDate"),
      limit(10),
    );
    const unsubscribeAcademic = onSnapshot(
      academicQuery,
      (snapshot) => {
        setAcademicCalendar(
          snapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
        );
      },
      () => {
        setAcademicCalendar([]);
      },
    );

    fetchStudentData();

    return () => {
      unsubscribeAnnouncements();
      unsubscribeMaterials();
      unsubscribeEvents();
      unsubscribeAcademic();
    };
  }, [user, navigate, today]);

  useEffect(() => {
    if (!user) return;

    refreshActiveSessions({ silent: true });
    const timer = setInterval(
      () => refreshActiveSessions({ silent: true }),
      30000,
    );

    return () => {
      clearInterval(timer);
    };
  }, [user, refreshActiveSessions]);

  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = String(time).split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const unreadAnnouncements = announcements.filter(
    (item) => !item.isRead,
  ).length;

  const attendanceList = Object.values(attendanceStatsBySubject);
  const overallAttendance =
    attendanceList.length > 0
      ? attendanceList.reduce(
          (acc, item) => acc + Number(item?.percentage || 0),
          0,
        ) / attendanceList.length
      : 0;

  const nameInitials = String(studentName || "S")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((token) => token[0]?.toUpperCase())
    .join("");

  const filteredStudyMaterials = useMemo(
    () =>
      studyMaterials.filter((item) => {
        if (!department || !item.department) return true;
        return (
          String(item.department).trim().toLowerCase() ===
          String(department).trim().toLowerCase()
        );
      }),
    [studyMaterials, department],
  );

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

  const getClassesForSlot = (day, timeSlot) =>
    timetable.filter((item) => {
      const start = String(item.startTime || "");
      const end = String(item.endTime || "");
      return item.day === day && start <= timeSlot && end > timeSlot;
    });

  const renderOverview = () => (
    <>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="rounded-3xl bg-white p-5 text-black xl:col-span-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-800">
                  Heyy,
                </p>
                <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
                  {studentName || "Student"}
                </h1>
                <p className="mt-2 text-sm text-gray-800">
                  {department || "Department"} • {year || "-"} Year{" "}
                  {semester ? `• Sem ${semester}` : ""}
                  {division ? ` • Div ${division}` : ""}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-sm">
              <p className="text-gray-500">Today</p>
              <p className="font-semibold text-gray-500">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 xl:col-span-4">
          <div className="rounded-2xl bg-[#f4f8ff] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Classes Today
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-800">
              {todaysClasses.length}
            </p>
          </div>
          <div className="rounded-2xl bg-[#f7fbf1] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Weekly Classes
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-800">
              {timetable.length}
            </p>
          </div>
          <div className="rounded-2xl bg-[#fff8ef] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Attendance
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-800">
              {overallAttendance.toFixed(0)}%
            </p>
          </div>
          <div className="rounded-2xl bg-[#f4f5ff] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              New Alerts
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-800">
              {unreadAnnouncements}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200/80 bg-white">
        <div className="border-b border-slate-200 bg-[#f8fafc] px-5 py-4 sm:px-6">
          <h2 className="text-xl font-semibold text-slate-800">
            Today's Schedule
          </h2>
        </div>

        <div className="space-y-3 p-4 sm:p-6">
          {todaysClasses.length > 0 ? (
            todaysClasses.map((classItem, index) => {
              const colors = subjectColors[index % subjectColors.length];
              return (
                <div
                  key={classItem.id}
                  className={`rounded-2xl border ${colors.border} ${colors.bg} p-4`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <h3 className={`text-lg font-semibold ${colors.text}`}>
                        {classItem.subjectName || classItem.subject}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <FiClock className="w-4 h-4" />
                          {formatTime(classItem.startTime)} -{" "}
                          {formatTime(classItem.endTime)}
                        </span>
                        {classItem.room ? (
                          <span className="flex items-center gap-1">
                            <FiMapPin className="w-4 h-4" />
                            {classItem.room}
                          </span>
                        ) : null}
                        {classItem.teacherName ? (
                          <span className="flex items-center gap-1">
                            <FiUser className="w-4 h-4" />
                            {classItem.teacherName}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-10 text-center text-slate-500">
              No classes today.
            </div>
          )}
        </div>
      </div>
    </>
  );

  const renderAnnouncements = () => (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            Announcements
          </h2>
          <p className="text-sm text-slate-500">
            All active campus updates in one place.
          </p>
        </div>
        <span className="rounded-full bg-[#f4f5ff] px-3 py-1 text-xs font-semibold text-[#5f6ad2]">
          Unread: {unreadAnnouncements}
        </span>
      </div>

      {announcements.length > 0 ? (
        <div className="space-y-3">
          {announcements.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl border p-4 ${item.isRead ? "border-slate-200 bg-slate-50" : "border-indigo-200 bg-indigo-50"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-800">
                    {item.title || "Announcement"}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                    {item.message || "No details available."}
                  </p>
                </div>
                <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-600">
                  {item.type || "general"}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {formatDateTime(item.createdAt)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-500">No announcements yet.</p>
      )}
    </div>
  );

  const renderStudyMaterials = () => (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-800">
          Study Materials
        </h2>
        <p className="text-sm text-slate-500">
          Latest materials from faculty and peers.
        </p>
      </div>

      {filteredStudyMaterials.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filteredStudyMaterials.map((material) => (
            <div
              key={material.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-base font-semibold text-slate-800">
                {material.title || "Untitled"}
              </p>
              {material.subject ? (
                <p className="mt-1 text-xs text-slate-500">
                  Subject: {material.subject}
                </p>
              ) : null}
              {material.description ? (
                <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                  {material.description}
                </p>
              ) : null}
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  By {material.uploadedByName || "Faculty"}
                </p>
                {material.fileURL ? (
                  <a
                    href={material.fileURL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-[#2f87d9]"
                  >
                    View
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-500">
          No study materials found for your department.
        </p>
      )}
    </div>
  );

  const renderCalendars = () => (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              Main Calendar Hub
            </h2>
            <p className="text-sm text-slate-500">
              Open dedicated calendar module with dashboard-aware back
              navigation.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              navigate("/calendars", { state: { fromStudentDashboard: true } })
            }
            className="inline-flex items-center gap-1 rounded-xl bg-[#2f87d9] px-4 py-2 text-sm font-medium text-white"
          >
            Open Main Calendars <FiChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <FiCalendar className="h-5 w-5 text-[#2f87d9]" />
            <h2 className="text-xl font-semibold text-slate-800">
              Events Calendar
            </h2>
          </div>

          {eventsCalendar.length > 0 ? (
            <div className="space-y-3">
              {eventsCalendar.map((event) => (
                <div
                  key={event.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="font-semibold text-slate-800">
                    {event.title || "Event"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {event.startDate || "-"}
                    {event.startTime ? ` • ${event.startTime}` : ""}
                    {event.location ? ` • ${event.location}` : ""}
                  </p>
                  {event.description ? (
                    <p className="mt-2 text-sm text-slate-600 line-clamp-3">
                      {event.description}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">No events available right now.</p>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <FiBook className="h-5 w-5 text-[#2f87d9]" />
            <h2 className="text-xl font-semibold text-slate-800">
              Academic Calendar
            </h2>
          </div>

          {academicCalendar.length > 0 ? (
            <div className="space-y-3">
              {academicCalendar.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="font-semibold text-slate-800">
                    {item.activity || item.title || "Academic Event"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.startDate || item.dateSlots || "Date not available"}
                  </p>
                  {item.responsibility ? (
                    <p className="mt-2 text-sm text-slate-600">
                      {item.responsibility}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">
              No academic calendar items available.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderAttendance = () => (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FiCheck className="h-5 w-5 text-[#2f87d9]" />
            <h2 className="text-xl font-semibold text-slate-800">
              Active Attendance Sessions
            </h2>
          </div>
          <button
            type="button"
            onClick={() => refreshActiveSessions({ silent: false })}
            disabled={activeSessionsRefreshing || !user?.uid}
            className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-700 disabled:opacity-60"
          >
            {activeSessionsRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {activeSessions.length > 0 ? (
          <div className="space-y-3">
            {activeSessions.map((session) => (
              <div
                key={session.sessionId || session.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-800">
                      {session.subjectName || "Subject"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {session.teacherName || "Teacher"} • {session.day || "-"}{" "}
                      • {session.lectureStartTime || "--:--"} -{" "}
                      {session.lectureEndTime || "--:--"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {session.branch || "-"} {session.year || ""}
                      {session.semester ? ` / Sem ${session.semester}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const sessionId = String(
                        session.sessionId || session.id || "",
                      ).trim();
                      if (!sessionId) {
                        return;
                      }
                      navigate(
                        `/student-attendance?sessionId=${encodeURIComponent(sessionId)}`,
                      );
                    }}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white"
                  >
                    Join Session
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500">
            No active attendance sessions currently.
          </p>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FiBarChart2 className="h-5 w-5 text-[#2f87d9]" />
            <h2 className="text-xl font-semibold text-slate-800">
              Subject Attendance Summary
            </h2>
          </div>
          <button
            type="button"
            disabled={attendanceRefreshing || !user?.uid}
            onClick={() => refreshAttendanceSummary(user?.uid)}
            className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-700 disabled:opacity-60"
          >
            {attendanceRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {courses.length > 0 ? (
          <div className="space-y-4">
            {courses.map((course) => {
              const stats =
                attendanceStatsBySubject[makeSubjectId(course.name)] || {};
              const attended = Number(stats.attendedClasses || 0);
              const total = Number(stats.totalClasses || 0);
              const absent = Math.max(total - attended, 0);
              const percentage = Number(stats.percentage || 0);
              const needed = calculateNeededClassesFor75(attended, total);
              const safePercentage = Math.min(Math.max(percentage, 0), 100);

              return (
                <div
                  key={course.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-slate-800">
                        {course.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {subjectTeachersMap[course.name] &&
                        subjectTeachersMap[course.name].length > 0
                          ? subjectTeachersMap[course.name].join(", ")
                          : "Teacher not assigned yet"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        percentage >= 75
                          ? "bg-emerald-100 text-emerald-700"
                          : percentage >= 50
                            ? "bg-amber-100 text-amber-700"
                            : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {percentage.toFixed(1)}%
                    </span>
                  </div>

                  <div className="mb-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full ${
                        percentage >= 75
                          ? "bg-emerald-500"
                          : percentage >= 50
                            ? "bg-amber-500"
                            : "bg-rose-500"
                      }`}
                      style={{ width: `${safePercentage}%` }}
                    />
                  </div>

                  <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl bg-white p-3">
                      <p className="text-[11px] uppercase text-slate-500">
                        Attended
                      </p>
                      <p className="text-sm font-semibold text-slate-800">
                        {attended}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white p-3">
                      <p className="text-[11px] uppercase text-slate-500">
                        Absent
                      </p>
                      <p className="text-sm font-semibold text-slate-800">
                        {absent}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white p-3">
                      <p className="text-[11px] uppercase text-slate-500">
                        Total
                      </p>
                      <p className="text-sm font-semibold text-slate-800">
                        {total}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white p-3">
                      <p className="text-[11px] uppercase text-slate-500">
                        Need For 75%
                      </p>
                      <p className="text-sm font-semibold text-slate-800">
                        {needed > 0 ? `${needed} classes` : "Reached"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="mb-2 text-xs font-medium text-slate-600">
                      Attendance Graph (Present vs Absent)
                    </p>
                    <div className="flex h-28 items-end gap-4">
                      <div className="flex flex-1 flex-col items-center">
                        <div className="flex h-20 w-12 items-end rounded bg-emerald-100 p-1">
                          <div
                            className="w-full rounded bg-emerald-500"
                            style={{
                              height: `${total > 0 ? Math.max((attended / total) * 100, 6) : 6}%`,
                            }}
                          />
                        </div>
                        <p className="mt-2 text-[11px] text-slate-600">
                          Present
                        </p>
                      </div>
                      <div className="flex flex-1 flex-col items-center">
                        <div className="flex h-20 w-12 items-end rounded bg-rose-100 p-1">
                          <div
                            className="w-full rounded bg-rose-500"
                            style={{
                              height: `${total > 0 ? Math.max((absent / total) * 100, 6) : 6}%`,
                            }}
                          />
                        </div>
                        <p className="mt-2 text-[11px] text-slate-600">
                          Absent
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-500">No attendance data available.</p>
        )}
      </div>
    </div>
  );

  const renderExamSchedule = () => (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <FiFileText className="h-5 w-5 text-[#2f87d9]" />
        <h2 className="text-xl font-semibold text-slate-800">Exam Schedule</h2>
      </div>

      {examSchedule.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Course Code</th>
                <th className="px-3 py-2">Course Name</th>
                <th className="px-3 py-2">Duration</th>
                <th className="px-3 py-2">Branch</th>
                <th className="px-3 py-2">Year</th>
              </tr>
            </thead>
            <tbody>
              {examSchedule.map((exam) => (
                <tr key={exam.id} className="border-t border-slate-200">
                  <td className="px-3 py-2 text-slate-700">
                    {exam.date || "Date TBA"}
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {exam.time || "Time TBA"}
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {exam.courseCode || "-"}
                  </td>
                  <td className="px-3 py-2 font-medium text-slate-800">
                    {exam.courseName || "Course"}
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {exam.duration || "-"}
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {exam.branch || "-"}
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {exam.year || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-slate-500">No exams published yet for your class.</p>
      )}
    </div>
  );

  const renderFullTimetable = () => (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <FiClock className="h-5 w-5 text-[#2f87d9]" />
        <h2 className="text-xl font-semibold text-slate-800">Full Timetable</h2>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-[#f4f8ff] p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Department
          </p>
          <p className="mt-1 font-semibold text-slate-800">
            {department || "-"}
          </p>
        </div>
        <div className="rounded-2xl bg-[#f7fbf1] p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Year</p>
          <p className="mt-1 font-semibold text-slate-800">{year || "-"}</p>
        </div>
        <div className="rounded-2xl bg-[#fff8ef] p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Semester
          </p>
          <p className="mt-1 font-semibold text-slate-800">{semester || "-"}</p>
        </div>
      </div>

      {timetable.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full min-w-[880px] border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="border border-slate-200 px-3 py-2 text-left">
                  Time
                </th>
                {dayOrder.map((day) => (
                  <th
                    key={day}
                    className="border border-slate-200 px-3 py-2 text-center"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot) => {
                const isAfterLunch = slot === "14:00";

                return (
                  <React.Fragment key={slot}>
                    {isAfterLunch ? (
                      <tr>
                        <td className="border border-slate-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                          13:30 - 14:15
                        </td>
                        <td
                          colSpan={dayOrder.length}
                          className="border border-slate-200 bg-amber-50 px-3 py-2 text-center text-xs font-semibold text-amber-700"
                        >
                          Recess
                        </td>
                      </tr>
                    ) : null}

                    <tr>
                      <td className="border border-slate-200 bg-slate-50 px-3 py-2 font-medium text-slate-700">
                        {slot}
                      </td>
                      {dayOrder.map((day) => {
                        const slotClasses = getClassesForSlot(day, slot);
                        return (
                          <td
                            key={`${day}_${slot}`}
                            className="border border-slate-200 px-2 py-2 align-top"
                          >
                            {slotClasses.map((classItem) => {
                              const subjectName =
                                classItem.subjectName ||
                                classItem.subject ||
                                "Subject";
                              const colors = getSubjectColorByName(subjectName);
                              return (
                                <div
                                  key={classItem.id}
                                  className={`mb-1 rounded-lg border p-2 ${colors}`}
                                >
                                  <p className="text-xs font-semibold">
                                    {subjectName}
                                  </p>
                                  <p className="mt-1 text-[11px] text-slate-600">
                                    {classItem.startTime} - {classItem.endTime}
                                  </p>
                                  {classItem.teacherName ? (
                                    <p className="text-[11px] text-slate-600">
                                      {classItem.teacherName}
                                    </p>
                                  ) : null}
                                </div>
                              );
                            })}
                          </td>
                        );
                      })}
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-slate-500">
          No classes found for your current profile.
        </p>
      )}
    </div>
  );

  const renderActivePanel = () => {
    if (activeTab === "overview") return renderOverview();
    if (activeTab === "announcements") return renderAnnouncements();
    if (activeTab === "study-materials") return renderStudyMaterials();
    if (activeTab === "calendars") return renderCalendars();
    if (activeTab === "attendance") return renderAttendance();
    if (activeTab === "exam") return renderExamSchedule();
    if (activeTab === "timetable") return renderFullTimetable();
    return renderOverview();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#eef2f6] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl animate-pulse space-y-5">
          <div className="h-24 rounded-3xl bg-white" />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="h-96 rounded-3xl bg-white lg:col-span-3" />
            <div className="h-96 rounded-3xl bg-white lg:col-span-9" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef2f6] pb-6 pt-4 sm:pb-10 sm:pt-7">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
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
                Student Dashboard
              </span>
              <span className="block text-xs font-semibold text-slate-800">
                {navItems.find((item) => item.id === activeTab)?.label ||
                  "Overview"}
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
                      const isActive = activeTab === item.id;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActiveTab(item.id);
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
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">
              <div className="border-b border-slate-200 bg-[#f8fafc] px-4 py-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Student Menu
                </p>
                <p className="text-lg font-semibold text-slate-800">
                  Dashboard
                </p>
              </div>
              <div className="p-3">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
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
              </div>
            </div>
          </aside>

          <main className="lg:col-span-9">{renderActivePanel()}</main>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
