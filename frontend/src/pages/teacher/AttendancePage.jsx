import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, firestore } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { useSocket } from "../../context/SocketContext";
import StartAttendanceModal from "../../components/teacher/StartAttendanceModal";
import AttendanceSessionDashboard from "../../components/teacher/AttendanceSessionDashboard";
import AttendanceAnalytics from "../../components/teacher/AttendanceAnalytics";
import PastSessionDetailsModal from "../../components/teacher/PastSessionDetailsModal";
import {
  endAttendanceSession,
  getActiveAttendanceSessions,
  getAttendanceAnalytics,
  getAttendanceSessionRecords,
  getTeacherSubjectAttendanceStudents,
  getTeacherAttendanceSessionHistory,
  getTeacherAttendanceLectures,
  markAttendanceByTeacher,
  startAttendanceSession,
} from "../../services/attendanceService";

const getBrowserLocation = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported in this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) =>
        reject(new Error(error.message || "Unable to access location.")),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });

const getIpBasedLocation = async () => {
  const response = await fetch("https://ipapi.co/json/");
  if (!response.ok) {
    throw new Error("Unable to resolve network location.");
  }

  const data = await response.json();
  const lat = Number(data?.latitude);
  const lng = Number(data?.longitude);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    throw new Error("Unable to resolve network location.");
  }

  return { lat, lng };
};

const getLocation = async () => {
  try {
    return await getBrowserLocation();
  } catch (geoError) {
    try {
      return await getIpBasedLocation();
    } catch {
      throw geoError;
    }
  }
};

const toDateValue = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === "function") {
    return value.toDate();
  }
  if (typeof value?.seconds === "number") {
    return new Date(value.seconds * 1000);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateTime = (value) => {
  const dateValue = toDateValue(value);
  return dateValue ? dateValue.toLocaleString() : "-";
};

const toCsv = (session, records) => {
  const header = [
    "PRN",
    "Student Name",
    "Student ID",
    "Subject",
    "Date",
    "Method",
    "Marked At",
  ];

  const rows = (Array.isArray(records) ? records : []).map((record) => [
    record.prn || "",
    record.studentName || "",
    record.studentId || "",
    session.subjectName || "",
    session.date || "",
    record.method || "",
    formatDateTime(record.timestamp),
  ]);

  return [header, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
    )
    .join("\n");
};

const downloadCsv = (fileName, content) => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const toPercentLabel = (value) => `${Number(value || 0).toFixed(2)}%`;

const toSubjectAttendanceCsv = (subjectName, rows) => {
  const header = [
    "Subject Name",
    "Student Name",
    "Roll Number",
    "Attendance Percentage",
    "Total Classes",
    "Classes Attended",
  ];

  const csvRows = (Array.isArray(rows) ? rows : []).map((row) => [
    subjectName || "",
    row.studentName || "",
    row.prn || row.studentId || "",
    Number(row.attendancePercentage || 0).toFixed(2),
    Number(row.totalClasses || 0),
    Number(row.attendedClasses || 0),
  ]);

  return [header, ...csvRows]
    .map((line) =>
      line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
    )
    .join("\n");
};

const exportSubjectAttendancePdf = (subjectName, rows) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    return;
  }

  const safeRows = Array.isArray(rows) ? rows : [];
  const tableRows = safeRows
    .map(
      (row) => `
        <tr>
          <td>${row.studentName || "-"}</td>
          <td>${row.prn || row.studentId || "-"}</td>
          <td>${toPercentLabel(row.attendancePercentage)}</td>
          <td>${Number(row.totalClasses || 0)}</td>
          <td>${Number(row.attendedClasses || 0)}</td>
        </tr>`,
    )
    .join("");

  printWindow.document.write(`
    <html>
      <head>
        <title>${subjectName || "Subject"} Attendance Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 16px; color: #0f172a; }
          h1 { font-size: 18px; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
          th { background: #e2e8f0; }
        </style>
      </head>
      <body>
        <h1>Attendance Report - ${subjectName || "Subject"}</h1>
        <table>
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Roll Number</th>
              <th>Attendance Percentage</th>
              <th>Total Classes</th>
              <th>Classes Attended</th>
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

export default function AttendancePage() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [teacherLectures, setTeacherLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startOpen, setStartOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [records, setRecords] = useState([]);
  const [joinedStudents, setJoinedStudents] = useState([]);
  const [heatmapPoints, setHeatmapPoints] = useState([]);
  const [analyticsSubjectId, setAnalyticsSubjectId] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [ending, setEnding] = useState(false);
  const [endedSessionSummary, setEndedSessionSummary] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedSessionRecords, setSelectedSessionRecords] = useState([]);
  const [exportingSessionId, setExportingSessionId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedSubjectName, setSelectedSubjectName] = useState("");
  const [subjectStudents, setSubjectStudents] = useState([]);
  const [subjectStudentsCount, setSubjectStudentsCount] = useState(0);
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [subjectSearch, setSubjectSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");

  const refreshSessionHistory = async () => {
    setHistoryLoading(true);
    try {
      const historyResult = await getTeacherAttendanceSessionHistory(30);
      setSessionHistory(
        Array.isArray(historyResult.sessions) ? historyResult.sessions : [],
      );
    } catch (error) {
      toast.error(error.message || "Failed to load past attendance sessions.");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        const teacherDoc = await getDoc(doc(firestore, "teachers", user.uid));
        if (!teacherDoc.exists()) {
          throw new Error("Teacher profile not found.");
        }

        const [lecturesResult, activeSessionsResult, historyResult] =
          await Promise.all([
            getTeacherAttendanceLectures(),
            getActiveAttendanceSessions(),
            getTeacherAttendanceSessionHistory(30),
          ]);

        setTeacherLectures(
          Array.isArray(lecturesResult.lectures) ? lecturesResult.lectures : [],
        );

        const uniqueSubjects = new Map();
        (Array.isArray(lecturesResult.lectures)
          ? lecturesResult.lectures
          : []
        ).forEach((lecture) => {
          const lectureSubjectId = String(lecture.subjectId || "").trim();
          if (!lectureSubjectId || uniqueSubjects.has(lectureSubjectId)) {
            return;
          }

          uniqueSubjects.set(lectureSubjectId, {
            subjectId: lectureSubjectId,
            subjectName:
              lecture.subjectName || lecture.subject || lectureSubjectId,
          });
        });

        const firstSubject = Array.from(uniqueSubjects.values())[0] || null;
        if (firstSubject) {
          setSelectedSubjectId(firstSubject.subjectId);
          setSelectedSubjectName(firstSubject.subjectName);
          setAnalyticsSubjectId((prev) => prev || firstSubject.subjectId);
        }

        const allActiveSessions = Array.isArray(activeSessionsResult.sessions)
          ? activeSessionsResult.sessions
          : [];
        const teacherActiveSessions = allActiveSessions
          .filter(
            (session) => String(session.teacherId || "") === String(user.uid),
          )
          .sort(
            (a, b) => Number(b.startTimeMs || 0) - Number(a.startTimeMs || 0),
          );

        if (teacherActiveSessions.length > 0) {
          const restoredSession = teacherActiveSessions[0];
          const restoredSessionId = String(
            restoredSession.sessionId || restoredSession.id || "",
          );

          setActiveSession(restoredSession);
          if (restoredSession.subjectId) {
            setAnalyticsSubjectId(restoredSession.subjectId);
          }

          if (restoredSessionId) {
            try {
              const recordsResult =
                await getAttendanceSessionRecords(restoredSessionId);
              setRecords(
                Array.isArray(recordsResult.records)
                  ? recordsResult.records
                  : [],
              );
              setJoinedStudents(
                Array.isArray(recordsResult?.session?.presentStudents)
                  ? recordsResult.session.presentStudents.map((entry) => ({
                      ...entry,
                      joinTimestamp: entry.joinTimestamp || null,
                    }))
                  : [],
              );
            } catch {
              setRecords([]);
              setJoinedStudents([]);
            }
          }
        }

        setSessionHistory(
          Array.isArray(historyResult.sessions) ? historyResult.sessions : [],
        );
      } catch (error) {
        toast.error(error.message || "Failed to load timetable lectures.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [navigate]);

  useEffect(() => {
    if (!socket || !activeSession?.sessionId) {
      return;
    }

    const roomSessionId = activeSession.sessionId;
    socket.emit("join_attendance_session", roomSessionId);

    const mergeJoinedStudent = (payload) => {
      const incomingStudentId = String(payload?.studentId || "").trim();
      if (!incomingStudentId) {
        return;
      }

      setJoinedStudents((prev) => {
        if (
          prev.some(
            (entry) => String(entry.studentId || "") === incomingStudentId,
          )
        ) {
          return prev;
        }

        return [
          {
            studentId: incomingStudentId,
            studentName: payload.studentName || "Student",
            prn: payload.prn || "",
            joinTimestamp: payload.joinTimestamp || new Date().toISOString(),
          },
          ...prev,
        ];
      });
    };

    const onRecorded = (payload) => {
      if (payload.sessionId !== roomSessionId) {
        return;
      }

      setRecords((prev) => {
        if (prev.some((record) => record.recordId === payload.recordId)) {
          return prev;
        }
        return [payload, ...prev];
      });

      mergeJoinedStudent({
        studentId: payload.studentId,
        studentName: payload.studentName,
        prn: payload.prn,
        joinTimestamp: payload.timestamp,
      });
    };

    const onStudentJoined = (payload) => {
      if (payload.sessionId !== roomSessionId) {
        return;
      }
      mergeJoinedStudent(payload);
    };

    const onJoinedSnapshot = (payload) => {
      if (payload.sessionId !== roomSessionId) {
        return;
      }

      const students = Array.isArray(payload.students) ? payload.students : [];
      setJoinedStudents(
        students.map((entry) => ({
          studentId: entry.studentId,
          studentName: entry.studentName || "Student",
          prn: entry.prn || "",
          joinTimestamp: entry.joinTimestamp || null,
        })),
      );
    };

    const onHeatmap = (point) => {
      setHeatmapPoints((prev) => [point, ...prev].slice(0, 300));
    };

    const onEnded = (payload) => {
      if (payload.sessionId !== roomSessionId) {
        return;
      }
      toast.info("Attendance session ended.");
      setEndedSessionSummary(payload);
      setActiveSession(null);
      setJoinedStudents([]);
    };

    socket.on("attendance-recorded", onRecorded);
    socket.on("attendance-student-joined", onStudentJoined);
    socket.on("attendance-joined-students-snapshot", onJoinedSnapshot);
    socket.on("attendance-heatmap-updated", onHeatmap);
    socket.on("attendance-session-ended", onEnded);

    return () => {
      socket.off("attendance-recorded", onRecorded);
      socket.off("attendance-student-joined", onStudentJoined);
      socket.off("attendance-joined-students-snapshot", onJoinedSnapshot);
      socket.off("attendance-heatmap-updated", onHeatmap);
      socket.off("attendance-session-ended", onEnded);
    };
  }, [socket, activeSession]);

  useEffect(() => {
    if (!activeSession?.sessionId) {
      return;
    }

    const sessionId = String(activeSession.sessionId || activeSession.id || "");
    if (!sessionId) {
      return;
    }

    const timer = setInterval(async () => {
      try {
        const result = await getAttendanceSessionRecords(sessionId);
        setRecords(Array.isArray(result.records) ? result.records : []);
      } catch {
        // no-op; websocket remains primary source of truth
      }
    }, 8000);

    return () => clearInterval(timer);
  }, [activeSession]);

  const availableLectures = useMemo(() => teacherLectures, [teacherLectures]);

  const assignedSubjects = useMemo(() => {
    const subjectMap = new Map();
    availableLectures.forEach((lecture) => {
      const subjectId = String(lecture.subjectId || "").trim();
      if (!subjectId || subjectMap.has(subjectId)) {
        return;
      }
      subjectMap.set(subjectId, {
        subjectId,
        subjectName: lecture.subjectName || lecture.subject || subjectId,
      });
    });
    return Array.from(subjectMap.values());
  }, [availableLectures]);

  const filteredSubjectStudents = useMemo(() => {
    const needle = String(subjectSearch || "")
      .trim()
      .toLowerCase();

    return subjectStudents.filter((student) => {
      const percentage = Number(student.attendancePercentage || 0);
      const matchesSearch =
        !needle ||
        String(student.studentName || "")
          .toLowerCase()
          .includes(needle) ||
        String(student.prn || student.studentId || "")
          .toLowerCase()
          .includes(needle);

      if (!matchesSearch) {
        return false;
      }

      if (subjectFilter === "below75") {
        return percentage < 75;
      }
      if (subjectFilter === "aboveOrEqual75") {
        return percentage >= 75;
      }

      return true;
    });
  }, [subjectStudents, subjectSearch, subjectFilter]);

  useEffect(() => {
    if (!selectedSubjectId) {
      setSubjectStudents([]);
      setSubjectStudentsCount(0);
      return;
    }

    const loadSubjectStudents = async () => {
      setSubjectLoading(true);
      try {
        const result = await getTeacherSubjectAttendanceStudents(
          selectedSubjectId,
          selectedSubjectName,
        );
        const list = Array.isArray(result.students) ? result.students : [];
        setSubjectStudents(list);
        setSubjectStudentsCount(
          Number(result.totalStudents || list.length || 0),
        );
        if (result?.subject?.subjectName) {
          setSelectedSubjectName(result.subject.subjectName);
        }
      } catch (error) {
        setSubjectStudents([]);
        setSubjectStudentsCount(0);
        toast.error(error.message || "Failed to load subject attendance data.");
      } finally {
        setSubjectLoading(false);
      }
    };

    loadSubjectStudents();
  }, [selectedSubjectId, selectedSubjectName]);

  const openSessionDetails = async (session) => {
    const sessionId = String(session?.sessionId || session?.id || "");
    if (!sessionId) {
      toast.error("Invalid session selected.");
      return;
    }

    setSelectedSession(session);
    setSelectedSessionRecords(
      Array.isArray(session.records) ? session.records : [],
    );
    setDetailsOpen(true);
    setDetailsLoading(true);

    try {
      const result = await getAttendanceSessionRecords(sessionId);
      const recordsList = Array.isArray(result.records) ? result.records : [];
      setSelectedSessionRecords(recordsList);
      setSelectedSession((prev) => {
        const base = prev || session;
        return {
          ...base,
          ...result.session,
          sessionId,
        };
      });
    } catch (error) {
      toast.error(error.message || "Failed to load session details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleExportSessionCsv = async (session, existingRecords) => {
    const sessionId = String(session?.sessionId || session?.id || "");
    if (!sessionId) {
      toast.error("Invalid session selected.");
      return;
    }

    setExportingSessionId(sessionId);
    try {
      let recordsList = Array.isArray(existingRecords) ? existingRecords : [];
      if (recordsList.length === 0) {
        const result = await getAttendanceSessionRecords(sessionId);
        recordsList = Array.isArray(result.records) ? result.records : [];
      }

      const csv = toCsv(session, recordsList);
      const safeSubject = String(
        session.subjectId || session.subjectName || "subject",
      )
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
      const safeDate = String(session.date || "session").replace(
        /[^0-9a-zA-Z-]+/g,
        "_",
      );

      downloadCsv(
        `${safeSubject || "subject"}_${safeDate || "session"}_${sessionId}.csv`,
        csv,
      );
      toast.success("Session report downloaded.");
    } catch (error) {
      toast.error(error.message || "Failed to export session report.");
    } finally {
      setExportingSessionId("");
    }
  };

  const handleStart = async (payload) => {
    setStarting(true);
    try {
      const teacherLocation = await getLocation();
      if (!window.isSecureContext) {
        toast.info(
          "Using network-based location fallback because this page is not running on HTTPS.",
        );
      }
      const result = await startAttendanceSession({
        ...payload,
        teacherLocation,
      });
      setActiveSession(result.session);
      setRecords([]);
      setJoinedStudents([]);
      setHeatmapPoints([]);
      setStartOpen(false);
      setAnalyticsSubjectId(result?.session?.subjectId || "");
      toast.success("Attendance session started.");
      await refreshSessionHistory();
    } catch (error) {
      toast.error(error.message || "Unable to start attendance session.");
    } finally {
      setStarting(false);
    }
  };

  const handleScan = async (qrPayload) => {
    if (!activeSession?.sessionId) return;

    try {
      const result = await markAttendanceByTeacher({
        sessionId: activeSession.sessionId,
        studentId: qrPayload.studentId,
        prn: qrPayload.prn,
      });
      toast.success(result.message || "Attendance marked by teacher scan.");
    } catch (error) {
      toast.error(error.message || "QR attendance failed.");
    }
  };

  const handleEnd = async () => {
    if (!activeSession?.sessionId) return;

    const sessionToEnd = activeSession;
    setEnding(true);
    setActiveSession(null);

    try {
      const result = await endAttendanceSession(sessionToEnd.sessionId);
      toast.success(result.message || "Attendance session ended.");
      setEndedSessionSummary(result.session || null);
      if (sessionToEnd.subjectId) {
        setAnalyticsSubjectId(sessionToEnd.subjectId);
      }
      setJoinedStudents([]);
      await refreshSessionHistory();
    } catch (error) {
      setActiveSession(sessionToEnd);
      toast.error(error.message || "Failed to end session.");
    } finally {
      setEnding(false);
    }
  };

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!analyticsSubjectId) {
        setAnalytics(null);
        return;
      }

      try {
        const result = await getAttendanceAnalytics(analyticsSubjectId);
        setAnalytics(result.analytics || null);
      } catch (error) {
        toast.error(error.message || "Failed to load attendance analytics.");
      }
    };

    loadAnalytics();
  }, [analyticsSubjectId]);

  const handleExportSubjectCsv = () => {
    if (!selectedSubjectId) {
      return;
    }

    const csv = toSubjectAttendanceCsv(
      selectedSubjectName,
      filteredSubjectStudents,
    );
    const safeSubject = String(selectedSubjectName || selectedSubjectId)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    downloadCsv(`${safeSubject || "subject"}_attendance_report.csv`, csv);
    toast.success("Subject attendance exported as CSV.");
  };

  const handleExportSubjectPdf = () => {
    if (!selectedSubjectId) {
      return;
    }

    exportSubjectAttendancePdf(selectedSubjectName, filteredSubjectStudents);
    toast.success("Subject attendance PDF opened for download/print.");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-600">
        Loading attendance workspace...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Smart Attendance
            </h1>
            <p className="text-sm text-slate-600">
              Real-time biometric attendance with anti-proxy validation and
              analytics.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate("/teacher-dashboard")}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700"
            >
              Back to Dashboard
            </button>
            <button
              type="button"
              onClick={() => setStartOpen(true)}
              disabled={
                Boolean(activeSession) || availableLectures.length === 0
              }
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              Mark Attendance
            </button>
          </div>
        </div>

        {activeSession ? (
          <AttendanceSessionDashboard
            session={activeSession}
            records={records}
            joinedStudents={joinedStudents}
            heatmapPoints={heatmapPoints}
            onScanStudent={handleScan}
            onEndSession={handleEnd}
            ending={ending}
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            {availableLectures.length > 0
              ? "No active attendance session. Click Mark Attendance to start."
              : "No timetable lectures found. Add lectures in timetable before starting attendance."}
          </div>
        )}

        <AttendanceAnalytics analytics={analytics} />

        {endedSessionSummary ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-900">
                Last Ended Session Summary
              </h2>
              <button
                type="button"
                onClick={() => setEndedSessionSummary(null)}
                className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-700"
              >
                Dismiss
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-lg bg-sky-50 p-3 text-sky-700">
                Total Students:{" "}
                {Number(endedSessionSummary.enrolledStudentsCount || 0)}
              </div>
              <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700">
                Present: {Number(endedSessionSummary.presentCount || 0)}
              </div>
              <div className="rounded-lg bg-rose-50 p-3 text-rose-700">
                Absent: {Number(endedSessionSummary.absentCount || 0)}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-sm font-semibold text-emerald-800">
                  Present Students
                </p>
                <div className="mt-2 max-h-44 overflow-y-auto text-xs text-emerald-700">
                  {(Array.isArray(endedSessionSummary.presentStudents)
                    ? endedSessionSummary.presentStudents
                    : []
                  ).map((student) => (
                    <p key={`${student.studentId}_present`}>
                      {(student.studentName || "Student") +
                        (student.prn ? ` (${student.prn})` : "")}
                    </p>
                  ))}
                  {!(
                    Array.isArray(endedSessionSummary.presentStudents) &&
                    endedSessionSummary.presentStudents.length > 0
                  ) ? (
                    <p>No present students in this session.</p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                <p className="text-sm font-semibold text-rose-800">
                  Absent Students
                </p>
                <div className="mt-2 max-h-44 overflow-y-auto text-xs text-rose-700">
                  {(Array.isArray(endedSessionSummary.absentStudents)
                    ? endedSessionSummary.absentStudents
                    : []
                  ).map((student) => (
                    <p key={`${student.studentId}_absent`}>
                      {(student.studentName || "Student") +
                        (student.prn ? ` (${student.prn})` : "")}
                    </p>
                  ))}
                  {!(
                    Array.isArray(endedSessionSummary.absentStudents) &&
                    endedSessionSummary.absentStudents.length > 0
                  ) ? (
                    <p>No absent students in this session.</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Subject Attendance Management
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportSubjectCsv}
                disabled={filteredSubjectStudents.length === 0}
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={handleExportSubjectPdf}
                disabled={filteredSubjectStudents.length === 0}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
              >
                Export PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase text-slate-500">
                Assigned Subject
              </label>
              <select
                value={selectedSubjectId}
                onChange={(event) => {
                  const nextSubjectId = event.target.value;
                  const nextSubject = assignedSubjects.find(
                    (subject) => subject.subjectId === nextSubjectId,
                  );
                  setSelectedSubjectId(nextSubjectId);
                  setSelectedSubjectName(nextSubject?.subjectName || "");
                  setAnalyticsSubjectId(nextSubjectId);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
              >
                <option value="">Select subject</option>
                {assignedSubjects.map((subject) => (
                  <option key={subject.subjectId} value={subject.subjectId}>
                    {subject.subjectName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase text-slate-500">
                Search Student
              </label>
              <input
                value={subjectSearch}
                onChange={(event) => setSubjectSearch(event.target.value)}
                placeholder="Search by name or roll number"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase text-slate-500">
                Filter
              </label>
              <select
                value={subjectFilter}
                onChange={(event) => setSubjectFilter(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
              >
                <option value="all">All Students</option>
                <option value="below75">Below 75%</option>
                <option value="aboveOrEqual75">75% and Above</option>
              </select>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            Total enrolled students in selected subject: {subjectStudentsCount}
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2">Student Name</th>
                  <th className="px-3 py-2">Roll Number / ID</th>
                  <th className="px-3 py-2">Attendance %</th>
                  <th className="px-3 py-2">Total Classes</th>
                  <th className="px-3 py-2">Classes Attended</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubjectStudents.map((student) => (
                  <tr
                    key={student.studentId}
                    className="border-t border-slate-100"
                  >
                    <td className="px-3 py-2">{student.studentName || "-"}</td>
                    <td className="px-3 py-2">
                      {student.prn || student.studentId || "-"}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded px-2 py-1 text-xs font-medium ${
                          Number(student.attendancePercentage || 0) < 75
                            ? "bg-rose-100 text-rose-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {toPercentLabel(student.attendancePercentage)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {Number(student.totalClasses || 0)}
                    </td>
                    <td className="px-3 py-2">
                      {Number(student.attendedClasses || 0)}
                    </td>
                  </tr>
                ))}
                {filteredSubjectStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-8 text-center text-slate-500"
                    >
                      {subjectLoading
                        ? "Loading subject attendance..."
                        : "No students found for selected filters."}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">
              Past Attendance Sessions
            </h2>
            <button
              type="button"
              onClick={refreshSessionHistory}
              className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-700"
              disabled={historyLoading}
            >
              {historyLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {sessionHistory.length === 0 ? (
            <p className="text-sm text-slate-500">
              No ended sessions found yet.
            </p>
          ) : (
            <div className="space-y-3">
              {sessionHistory.map((session) => {
                const sessionId = String(session.sessionId || session.id || "");

                return (
                  <div
                    key={sessionId}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {session.subjectName || "Subject"}
                        </p>
                        <p className="text-xs text-slate-600">
                          Session: {sessionId || "-"}
                        </p>
                        <p className="text-xs text-slate-600">
                          Date: {session.date || "-"} | Ended:{" "}
                          {formatDateTime(session.endTimeMs || session.endTime)}
                        </p>
                      </div>
                      <div className="text-right text-xs text-slate-700">
                        <p>Present: {Number(session.presentCount || 0)}</p>
                        <p>
                          Enrolled: {Number(session.enrolledStudentsCount || 0)}
                        </p>
                        <p>Absent: {Number(session.absentCount || 0)}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openSessionDetails(session)}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
                      >
                        View Details
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleExportSessionCsv(
                            session,
                            Array.isArray(session.records)
                              ? session.records
                              : [],
                          )
                        }
                        disabled={exportingSessionId === sessionId}
                        className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                      >
                        {exportingSessionId === sessionId
                          ? "Exporting..."
                          : "Export CSV"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <PastSessionDetailsModal
        isOpen={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedSession(null);
          setSelectedSessionRecords([]);
        }}
        session={selectedSession}
        records={selectedSessionRecords}
        loading={detailsLoading}
        onExport={handleExportSessionCsv}
      />

      <StartAttendanceModal
        isOpen={startOpen}
        lectures={availableLectures}
        onClose={() => setStartOpen(false)}
        onStart={handleStart}
        submitting={starting}
      />
    </div>
  );
}
