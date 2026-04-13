import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, firestore } from "../../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import {
  FiBell,
  FiBook,
  FiCalendar,
  FiCheck,
  FiChevronDown,
  FiChevronRight,
  FiClock,
  FiDownload,
  FiFileText,
  FiGrid,
  FiMapPin,
  FiMessageCircle,
  FiUsers,
} from "react-icons/fi";

const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

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

const normalizeAssignments = (teacherData = {}) => {
  if (
    Array.isArray(teacherData.assignments) &&
    teacherData.assignments.length > 0
  ) {
    return teacherData.assignments;
  }

  if (
    Array.isArray(teacherData.assignedCourses) &&
    teacherData.assignedCourses.length > 0
  ) {
    const fallbackBranch = teacherData.department || teacherData.dept || "";
    return teacherData.assignedCourses.map((course) => ({
      branch: fallbackBranch,
      year: course.year || "",
      subjects: Array.isArray(course.subjects) ? course.subjects : [],
    }));
  }

  if (teacherData.year && Array.isArray(teacherData.subjects)) {
    return [
      {
        branch: teacherData.department || teacherData.dept || "",
        year: teacherData.year,
        subjects: teacherData.subjects,
      },
    ];
  }

  return [];
};

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

const readTeacherTimetable = async (teacherUid) => {
  const collectionNames = ["timetables", "timetable"];
  const list = [];

  for (const name of collectionNames) {
    try {
      const snapshot = await getDocs(collection(firestore, name));
      snapshot.docs.forEach((entry) => {
        const data = entry.data() || {};
        const ownerId = data.teacherId || data.teacherUid || data.uid || "";
        if (String(ownerId) !== String(teacherUid)) return;

        list.push({
          id: entry.id,
          source: name,
          subject: data.subjectName || data.subject || "Subject",
          day: data.day || "",
          startTime: data.startTime || "",
          endTime: data.endTime || "",
          room: data.room || data.classroom || "",
          branch: data.branch || data.department || "",
          year: data.year || "",
          semester: data.semester || "",
        });
      });
    } catch (error) {
      console.error(`Unable to fetch ${name}:`, error);
    }
  }

  return list.sort((a, b) =>
    String(a.startTime || "00:00").localeCompare(
      String(b.startTime || "00:00"),
    ),
  );
};

function TeacherDashboard() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);

  const [loading, setLoading] = useState(true);
  const [teacherName, setTeacherName] = useState("Teacher");
  const [department, setDepartment] = useState("");
  const [teacherAssignments, setTeacherAssignments] = useState([]);

  const [allTimetable, setAllTimetable] = useState([]);
  const [todaysClasses, setTodaysClasses] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [studyMaterials, setStudyMaterials] = useState([]);
  const [examSchedule, setExamSchedule] = useState([]);

  const [announcements, setAnnouncements] = useState([]);
  const [eventsCalendar, setEventsCalendar] = useState([]);
  const [academicCalendar, setAcademicCalendar] = useState([]);

  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedAssignmentIndex, setSelectedAssignmentIndex] = useState(0);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  const todayName = useMemo(() => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[new Date().getDay()];
  }, []);

  const navItems = useMemo(
    () => [
      { id: "overview", label: "Overview", icon: FiGrid },
      { id: "announcements", label: "Announcements", icon: FiBell },
      { id: "calendars", label: "Calendars", icon: FiCalendar },
      { id: "chats", label: "Student Chats", icon: FiMessageCircle },
      { id: "courses", label: "Courses", icon: FiBook },
      { id: "students", label: "Students", icon: FiUsers },
      { id: "study-materials", label: "Study Materials", icon: FiBook },
      { id: "attendance", label: "Attendance", icon: FiCheck },
      { id: "timetable", label: "My Timetable", icon: FiClock },
      { id: "exams", label: "Exam Schedule", icon: FiFileText },
    ],
    [],
  );

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    let unsubAnnouncements = () => {};
    let unsubEvents = () => {};
    let unsubAcademic = () => {};

    const loadDashboard = async () => {
      try {
        setLoading(true);

        const teacherSnap = await getDoc(doc(firestore, "teachers", user.uid));
        let teacherDisplayName = user.displayName || "Teacher";
        let assignments = [];

        if (teacherSnap.exists()) {
          const teacherData = teacherSnap.data() || {};
          assignments = normalizeAssignments(teacherData);
          setTeacherAssignments(assignments);
          setTeacherName(
            teacherData.name ||
              teacherData.displayName ||
              user.displayName ||
              "Teacher",
          );
          teacherDisplayName =
            teacherData.name ||
            teacherData.displayName ||
            user.displayName ||
            "Teacher";
          setDepartment(teacherData.dept || teacherData.department || "");
        } else {
          setTeacherName(user.displayName || "Teacher");
          setTeacherAssignments([]);
        }

        const timetable = await readTeacherTimetable(user.uid);
        setAllTimetable(timetable);
        setTodaysClasses(timetable.filter((item) => item.day === todayName));

        const [studentsSnap, usersSnap] = await Promise.all([
          getDocs(collection(firestore, "students")),
          getDocs(collection(firestore, "users")),
        ]);

        const mergedStudents = new Map();
        const absorbStudent = (record) => {
          const uid = record.uid || record.id;
          if (!uid) return;
          const existing = mergedStudents.get(uid) || {};
          mergedStudents.set(uid, {
            ...existing,
            ...record,
            uid,
          });
        };

        studentsSnap.docs.forEach((entry) =>
          absorbStudent({ id: entry.id, ...entry.data() }),
        );
        usersSnap.docs.forEach((entry) => {
          const data = entry.data() || {};
          if ((data.role || "").toLowerCase() !== "student") return;
          absorbStudent({ id: entry.id, ...data });
        });
        setAllStudents(Array.from(mergedStudents.values()));

        const materialsQuery = query(
          collection(firestore, "studyMaterials"),
          orderBy("createdAt", "desc"),
          limit(24),
        );
        const materialsSnapshot = await getDocs(materialsQuery);
        const ownMaterials = materialsSnapshot.docs
          .map((entry) => ({ id: entry.id, ...entry.data() }))
          .filter(
            (material) =>
              String(material.uploadedBy || "") === String(user.uid) ||
              String(material.uploadedByName || "").toLowerCase() ===
                String(teacherDisplayName || "").toLowerCase(),
          );
        setStudyMaterials(ownMaterials);

        const examsSnapshot = await getDocs(
          collection(firestore, "examTimetable"),
        );
        const filteredExams = examsSnapshot.docs
          .map((entry) => ({ id: entry.id, ...entry.data() }))
          .filter((exam) => {
            if (!assignments.length) return true;
            return assignments.some((assignment) => {
              const sameYear =
                String(exam.year || "")
                  .trim()
                  .toLowerCase() ===
                String(assignment.year || "")
                  .trim()
                  .toLowerCase();
              const sameBranch = branchMatches(
                exam.branch || "",
                assignment.branch || "",
              );
              return sameYear && sameBranch;
            });
          })
          .sort((a, b) => {
            const dateA = parseExamDate(a.date || "");
            const dateB = parseExamDate(b.date || "");
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            return dateA.getTime() - dateB.getTime();
          });
        setExamSchedule(filteredExams);

        const annQuery = query(
          collection(firestore, "announcements"),
          where("active", "==", true),
        );
        unsubAnnouncements = onSnapshot(annQuery, (snapshot) => {
          const rows = snapshot.docs
            .map((entry) => ({ id: entry.id, ...entry.data() }))
            .sort((a, b) => {
              const ta = a.createdAt?.toMillis?.() || 0;
              const tb = b.createdAt?.toMillis?.() || 0;
              return tb - ta;
            });
          setAnnouncements(rows);
        });

        const eventsQuery = query(
          collection(firestore, "events"),
          orderBy("startDate"),
          limit(8),
        );
        unsubEvents = onSnapshot(
          eventsQuery,
          (snapshot) => {
            setEventsCalendar(
              snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })),
            );
          },
          () => setEventsCalendar([]),
        );

        const academicQuery = query(
          collection(firestore, "academicCalendar"),
          orderBy("startDate"),
          limit(8),
        );
        unsubAcademic = onSnapshot(
          academicQuery,
          (snapshot) => {
            setAcademicCalendar(
              snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })),
            );
          },
          () => setAcademicCalendar([]),
        );
      } catch (error) {
        console.error("Failed to load teacher dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      unsubAnnouncements();
      unsubEvents();
      unsubAcademic();
    };
  }, [user, navigate, todayName]);

  const unreadAnnouncements = announcements.length;
  const upcomingClasses = allTimetable.filter(
    (item) => item.day && dayOrder.includes(item.day),
  ).length;

  const assignmentStudentGroups = useMemo(() => {
    if (!teacherAssignments.length) return [];

    return teacherAssignments.map((assignment, index) => {
      const rows = allStudents
        .map((student) => {
          const studentBranch = String(student.dept || student.department || "")
            .trim()
            .toLowerCase();
          const studentYear = String(student.year || "")
            .trim()
            .toLowerCase();
          const studentSubjects = Array.isArray(student.subjects)
            ? student.subjects.map((subject) => String(subject).trim())
            : [];

          const branchOk =
            String(assignment.branch || "")
              .trim()
              .toLowerCase() === studentBranch;
          const yearOk =
            String(assignment.year || "")
              .trim()
              .toLowerCase() === studentYear;

          if (!branchOk || !yearOk) return null;

          const matchedSubjects = (assignment.subjects || []).filter(
            (subject) => studentSubjects.includes(subject),
          );

          if (
            (assignment.subjects || []).length > 0 &&
            !matchedSubjects.length
          ) {
            return null;
          }

          return {
            uid: student.uid,
            name: student.name || "Student",
            prn: student.prn || student.rollNo || student.rollNumber || "-",
            year: student.year || "-",
            matchedSubjects,
            branch: assignment.branch || "-",
          };
        })
        .filter(Boolean);

      return {
        key: `${assignment.branch || "branch"}_${assignment.year || "year"}_${index}`,
        assignment,
        students: rows,
      };
    });
  }, [allStudents, teacherAssignments]);

  const selectedGroup =
    assignmentStudentGroups[selectedAssignmentIndex] || null;

  const filteredSelectedStudents = useMemo(() => {
    if (!selectedGroup) return [];
    const needle = String(studentSearch || "")
      .trim()
      .toLowerCase();
    if (!needle) return selectedGroup.students;

    return selectedGroup.students.filter(
      (student) =>
        String(student.name || "")
          .toLowerCase()
          .includes(needle) ||
        String(student.prn || "")
          .toLowerCase()
          .includes(needle),
    );
  }, [selectedGroup, studentSearch]);

  useEffect(() => {
    setSelectedStudentIds([]);
  }, [selectedAssignmentIndex, studentSearch]);

  useEffect(() => {
    if (selectedAssignmentIndex > assignmentStudentGroups.length - 1) {
      setSelectedAssignmentIndex(0);
    }
  }, [assignmentStudentGroups.length, selectedAssignmentIndex]);

  const toggleSelectStudent = (uid) => {
    setSelectedStudentIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid],
    );
  };

  const toggleSelectAll = () => {
    const ids = filteredSelectedStudents.map((student) => student.uid);
    const allSelected =
      ids.length > 0 && ids.every((id) => selectedStudentIds.includes(id));
    if (allSelected) {
      setSelectedStudentIds((prev) => prev.filter((id) => !ids.includes(id)));
      return;
    }
    setSelectedStudentIds((prev) => [...new Set([...prev, ...ids])]);
  };

  const getStudentCsvContent = (rows) => {
    const header = ["Name", "PRN", "Year", "Branch", "Matched Subjects"];
    const safeRows = Array.isArray(rows) ? rows : [];
    const lines = safeRows.map((student) => [
      student.name || "",
      student.prn || "",
      student.year || "",
      student.branch || "",
      (student.matchedSubjects || []).join("; "),
    ]);

    return [header, ...lines]
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");
  };

  const downloadCsvFile = (fileName, content) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportStudentsPdf = (title, rows) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const tableRows = (Array.isArray(rows) ? rows : [])
      .map(
        (student) => `
        <tr>
          <td>${student.name || "-"}</td>
          <td>${student.prn || "-"}</td>
          <td>${student.year || "-"}</td>
          <td>${student.branch || "-"}</td>
          <td>${(student.matchedSubjects || []).join(", ") || "-"}</td>
        </tr>`,
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 16px; color: #0f172a; }
            h1 { font-size: 18px; margin-bottom: 12px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
            th { background: #e2e8f0; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>PRN</th>
                <th>Year</th>
                <th>Branch</th>
                <th>Matched Subjects</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

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
    allTimetable.filter((item) => {
      const start = String(item.startTime || "");
      const end = String(item.endTime || "");
      return item.day === day && start <= timeSlot && end > timeSlot;
    });

  const renderOverview = () => (
    <>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="rounded-3xl bg-white p-5 text-black xl:col-span-8">
          <p className="text-xs uppercase tracking-[0.2em] text-black">
            Teacher Workspace
          </p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
            {teacherName}
          </h1>
          <p className="mt-2 text-sm text-gray-800">
            {department || "Department"} • {todayName}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 xl:col-span-4">
          <div className="rounded-2xl bg-[#f4f8ff] p-4">
            <p className="text-xs uppercase tracking-wide text-slate-700">
              Today Classes
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-700">
              {todaysClasses.length}
            </p>
          </div>
          <div className="rounded-2xl bg-[#f7fbf1] p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Weekly Classes
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-800">
              {upcomingClasses}
            </p>
          </div>
          <div className="rounded-2xl bg-[#fff8ef] p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Announcements
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-800">
              {unreadAnnouncements}
            </p>
          </div>
          <div className="rounded-2xl bg-[#f4f5ff] p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Chats
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-800">Live</p>
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200/80 bg-white">
        <div className="border-b border-slate-200 bg-[#f8fafc] px-5 py-4 sm:px-6">
          <h2 className="text-xl font-semibold text-slate-800">
            Today's Classes
          </h2>
        </div>
        <div className="space-y-3 p-4 sm:p-6">
          {todaysClasses.length > 0 ? (
            todaysClasses.map((item) => (
              <div
                key={`${item.source}_${item.id}`}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-base font-semibold text-slate-800">
                  {item.subject}
                </p>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-600 sm:text-sm">
                  <span className="inline-flex items-center gap-1">
                    <FiClock className="h-4 w-4" /> {item.startTime || "--:--"}{" "}
                    - {item.endTime || "--:--"}
                  </span>
                  {item.room ? (
                    <span className="inline-flex items-center gap-1">
                      <FiMapPin className="h-4 w-4" /> {item.room}
                    </span>
                  ) : null}
                  {item.year ? <span>{item.year}</span> : null}
                  {item.semester ? <span>Sem {item.semester}</span> : null}
                </div>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-slate-500">
              No classes scheduled for today.
            </p>
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
            Updates relevant for faculty and students.
          </p>
        </div>
      </div>

      {announcements.length > 0 ? (
        <div className="space-y-3">
          {announcements.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-base font-semibold text-slate-800">
                {item.title || "Announcement"}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                {item.message || "No details available."}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-500">No announcements available.</p>
      )}
    </div>
  );

  const renderCalendars = () => (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              Calendar Hub
            </h2>
            <p className="text-sm text-slate-500">
              View full events and academic calendars in dedicated page.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              navigate("/calendars", { state: { fromTeacherDashboard: true } })
            }
            className="inline-flex items-center gap-1 rounded-xl bg-[#2f87d9] px-4 py-2 text-sm font-medium text-white"
          >
            Open Main Calendars <FiChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
          <h3 className="mb-3 text-lg font-semibold text-slate-800">Events</h3>
          {eventsCalendar.length > 0 ? (
            <div className="space-y-3">
              {eventsCalendar.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                >
                  <p className="font-medium text-slate-800">
                    {item.title || "Event"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.startDate || "Date TBA"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">No events available.</p>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
          <h3 className="mb-3 text-lg font-semibold text-slate-800">
            Academic Calendar
          </h3>
          {academicCalendar.length > 0 ? (
            <div className="space-y-3">
              {academicCalendar.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                >
                  <p className="font-medium text-slate-800">
                    {item.activity || item.title || "Academic Event"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.startDate || item.dateSlots || "Date not available"}
                  </p>
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

  const renderCourses = () => (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <FiBook className="h-5 w-5 text-[#2f87d9]" />
        <h2 className="text-xl font-semibold text-slate-800">
          Assigned Courses
        </h2>
      </div>

      {teacherAssignments.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {teacherAssignments.map((assignment, index) => (
            <div
              key={`${assignment.branch}_${assignment.year}_${index}`}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-base font-semibold text-slate-800">
                {assignment.branch || "Branch"} • {assignment.year || "Year"}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(assignment.subjects || []).map((subject) => (
                  <span
                    key={`${assignment.year}_${subject}`}
                    className="rounded-full bg-[#e9f2ff] px-2.5 py-1 text-xs font-medium text-[#1f6fb7]"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-500">No teaching assignments found yet.</p>
      )}
    </div>
  );

  const renderStudents = () => (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FiUsers className="h-5 w-5 text-[#2f87d9]" />
          <h2 className="text-xl font-semibold text-slate-800">Students</h2>
        </div>
        <span className="rounded-full bg-[#f4f8ff] px-3 py-1 text-xs font-semibold text-[#1f6fb7]">
          {assignmentStudentGroups.reduce(
            (acc, group) => acc + group.students.length,
            0,
          )}{" "}
          total
        </span>
      </div>

      {assignmentStudentGroups.length > 0 ? (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {assignmentStudentGroups.map((group, index) => {
              const isActive = selectedAssignmentIndex === index;
              const assignmentLabel = `${group.assignment.branch || "Branch"} • ${group.assignment.year || "Year"}`;
              return (
                <button
                  key={group.key}
                  type="button"
                  onClick={() => setSelectedAssignmentIndex(index)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    isActive
                      ? "bg-[#2f87d9] text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {assignmentLabel} ({group.students.length})
                </button>
              );
            })}
          </div>

          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <input
              type="text"
              value={studentSearch}
              onChange={(event) => setStudentSearch(event.target.value)}
              placeholder="Search by student name or PRN"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 sm:max-w-xs"
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const rows = filteredSelectedStudents.filter((student) =>
                    selectedStudentIds.includes(student.uid),
                  );
                  if (!rows.length) return;
                  const fileName = `${String(
                    selectedGroup?.assignment?.branch || "branch",
                  )
                    .toLowerCase()
                    .replace(
                      /[^a-z0-9]+/g,
                      "_",
                    )}_${String(selectedGroup?.assignment?.year || "year").toLowerCase()}_selected_students.csv`;
                  downloadCsvFile(fileName, getStudentCsvContent(rows));
                }}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                Export Selected CSV
              </button>
              <button
                type="button"
                onClick={() => {
                  const rows = filteredSelectedStudents.filter((student) =>
                    selectedStudentIds.includes(student.uid),
                  );
                  if (!rows.length) return;
                  exportStudentsPdf("Selected Students Report", rows);
                }}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                Export Selected PDF
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!filteredSelectedStudents.length) return;
                  const fileName = `${String(
                    selectedGroup?.assignment?.branch || "branch",
                  )
                    .toLowerCase()
                    .replace(
                      /[^a-z0-9]+/g,
                      "_",
                    )}_${String(selectedGroup?.assignment?.year || "year").toLowerCase()}_all_students.csv`;
                  downloadCsvFile(
                    fileName,
                    getStudentCsvContent(filteredSelectedStudents),
                  );
                }}
                className="rounded-lg bg-[#2f87d9] px-3 py-1.5 text-xs font-medium text-white"
              >
                Export All CSV
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!filteredSelectedStudents.length) return;
                  exportStudentsPdf(
                    "All Students Report",
                    filteredSelectedStudents,
                  );
                }}
                className="rounded-lg bg-[#2f87d9] px-3 py-1.5 text-xs font-medium text-white"
              >
                Export All PDF
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={
                        filteredSelectedStudents.length > 0 &&
                        filteredSelectedStudents.every((student) =>
                          selectedStudentIds.includes(student.uid),
                        )
                      }
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">PRN / Roll</th>
                  <th className="px-3 py-2">Year</th>
                  <th className="px-3 py-2">Branch</th>
                  <th className="px-3 py-2">Matched Subjects</th>
                </tr>
              </thead>
              <tbody>
                {filteredSelectedStudents.map((student) => (
                  <tr key={student.uid} className="border-t border-slate-200">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(student.uid)}
                        onChange={() => toggleSelectStudent(student.uid)}
                      />
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-800">
                      {student.name}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{student.prn}</td>
                    <td className="px-3 py-2 text-slate-700">{student.year}</td>
                    <td className="px-3 py-2 text-slate-700">
                      {student.branch}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {(student.matchedSubjects || []).join(", ") || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="text-slate-500">
          No assigned branch-year student groups found.
        </p>
      )}
    </div>
  );

  const renderStudyMaterials = () => (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FiBook className="h-5 w-5 text-[#2f87d9]" />
          <h2 className="text-xl font-semibold text-slate-800">
            Study Materials
          </h2>
        </div>
        <button
          type="button"
          onClick={() => navigate("/teacher-studymaterial")}
          className="inline-flex items-center gap-1 rounded-xl bg-[#2f87d9] px-3 py-1.5 text-xs font-medium text-white"
        >
          Manage <FiChevronRight className="h-4 w-4" />
        </button>
      </div>

      {studyMaterials.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {studyMaterials.map((material) => (
            <div
              key={material.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-base font-semibold text-slate-800">
                {material.title || "Untitled"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {material.subject || "Subject"} •{" "}
                {material.department || "Department"}
              </p>
              {material.description ? (
                <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                  {material.description}
                </p>
              ) : null}
              {material.fileURL ? (
                <a
                  href={material.fileURL}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#2f87d9]"
                >
                  Download <FiDownload className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-500">No uploaded materials found yet.</p>
      )}
    </div>
  );

  const renderTimetable = () => (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FiClock className="h-5 w-5 text-[#2f87d9]" />
          <h2 className="text-xl font-semibold text-slate-800">My Timetable</h2>
        </div>
        <button
          type="button"
          onClick={() => navigate("/teacher-timetable")}
          className="inline-flex items-center gap-1 rounded-xl bg-[#2f87d9] px-3 py-1.5 text-xs font-medium text-white"
        >
          Full Editor <FiChevronRight className="h-4 w-4" />
        </button>
      </div>

      {allTimetable.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full min-w-[860px] border-collapse text-sm">
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
              {timeSlots.map((slot) => (
                <tr key={slot}>
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
                        {slotClasses.map((classItem) => (
                          <div
                            key={`${classItem.source}_${classItem.id}`}
                            className="mb-1 rounded-lg border border-blue-200 bg-blue-50 p-2"
                          >
                            <p className="text-xs font-semibold text-slate-800">
                              {classItem.subject}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-600">
                              {classItem.startTime} - {classItem.endTime}
                            </p>
                            {classItem.room ? (
                              <p className="text-[11px] text-slate-600">
                                {classItem.room}
                              </p>
                            ) : null}
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
      ) : (
        <p className="text-slate-500">No timetable entries found.</p>
      )}
    </div>
  );

  const renderExams = () => (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FiFileText className="h-5 w-5 text-[#2f87d9]" />
          <h2 className="text-xl font-semibold text-slate-800">
            Exam Schedule
          </h2>
        </div>
        <button
          type="button"
          onClick={() => navigate("/exam-timetable")}
          className="inline-flex items-center gap-1 rounded-xl bg-[#2f87d9] px-3 py-1.5 text-xs font-medium text-white"
        >
          Open Full View <FiChevronRight className="h-4 w-4" />
        </button>
      </div>

      {examSchedule.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Course Code</th>
                <th className="px-3 py-2">Course Name</th>
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
        <p className="text-slate-500">
          No exams available for assigned class groups.
        </p>
      )}
    </div>
  );

  const renderActionPanel = (title, description, route, cta) => (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
      <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <button
        type="button"
        onClick={() => navigate(route)}
        className="mt-4 inline-flex items-center gap-1 rounded-xl bg-[#2f87d9] px-4 py-2 text-sm font-medium text-white"
      >
        {cta} <FiChevronRight className="h-4 w-4" />
      </button>
    </div>
  );

  const renderActivePanel = () => {
    if (activeTab === "overview") return renderOverview();
    if (activeTab === "announcements") return renderAnnouncements();
    if (activeTab === "calendars") return renderCalendars();
    if (activeTab === "chats")
      return renderActionPanel(
        "Student Chats",
        "Manage real-time conversations with students.",
        "/chat",
        "Open Chats",
      );
    if (activeTab === "courses") return renderCourses();
    if (activeTab === "students") return renderStudents();
    if (activeTab === "study-materials") return renderStudyMaterials();
    if (activeTab === "attendance")
      return renderActionPanel(
        "Attendance",
        "Track and manage attendance sessions.",
        "/teacher-attendance",
        "Open Attendance",
      );
    if (activeTab === "timetable") return renderTimetable();
    if (activeTab === "exams") return renderExams();
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
                Teacher Dashboard
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
                  Teacher Menu
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

export default TeacherDashboard;
