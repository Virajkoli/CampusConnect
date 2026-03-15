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

export default function AttendancePage() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [teacherLectures, setTeacherLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startOpen, setStartOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [records, setRecords] = useState([]);
  const [heatmapPoints, setHeatmapPoints] = useState([]);
  const [analyticsSubjectId, setAnalyticsSubjectId] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [ending, setEnding] = useState(false);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedSessionRecords, setSelectedSessionRecords] = useState([]);
  const [exportingSessionId, setExportingSessionId] = useState("");

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
            } catch {
              setRecords([]);
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
    };

    const onHeatmap = (point) => {
      setHeatmapPoints((prev) => [point, ...prev].slice(0, 300));
    };

    const onEnded = (payload) => {
      if (payload.sessionId !== roomSessionId) {
        return;
      }
      toast.info("Attendance session ended.");
      setActiveSession(null);
    };

    socket.on("attendance-recorded", onRecorded);
    socket.on("attendance-heatmap-updated", onHeatmap);
    socket.on("attendance-session-ended", onEnded);

    return () => {
      socket.off("attendance-recorded", onRecorded);
      socket.off("attendance-heatmap-updated", onHeatmap);
      socket.off("attendance-session-ended", onEnded);
    };
  }, [socket, activeSession]);

  const availableLectures = useMemo(() => teacherLectures, [teacherLectures]);

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
      if (sessionToEnd.subjectId) {
        setAnalyticsSubjectId(sessionToEnd.subjectId);
      }
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
