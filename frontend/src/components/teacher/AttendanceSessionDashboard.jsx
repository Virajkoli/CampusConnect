import React, { useEffect, useMemo, useState } from "react";
import QRScanner from "./QRScanner";
import ClassroomHeatmap from "./ClassroomHeatmap";

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

const formatTime = (value) => {
  const dateValue = toDateValue(value);
  return dateValue ? dateValue.toLocaleTimeString() : "-";
};

const toCsv = (session, records) => {
  const header = [
    "PRN",
    "Student Name",
    "Subject",
    "Date",
    "Status",
    "Timestamp",
  ];
  const rows = records.map((record) => [
    record.prn || "",
    record.studentName || "",
    session.subjectName || "",
    session.date || "",
    "Present",
    record.timestamp || "",
  ]);

  return [header, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
    )
    .join("\n");
};

const formatMethod = (method) => {
  const value = String(method || "")
    .trim()
    .toLowerCase();
  if (value === "biometric") return "Fingerprint";
  if (value === "face_recognition") return "Face";
  if (value === "teacher_scan") return "Teacher QR";
  return method || "-";
};

export default function AttendanceSessionDashboard({
  session,
  records,
  joinedStudents,
  heatmapPoints,
  onScanStudent,
  onRefresh,
  refreshing = false,
  onEndSession,
  ending = false,
}) {
  const [showScanner, setShowScanner] = useState(false);
  const safeRecords = Array.isArray(records) ? records : [];
  const safeJoinedStudents = Array.isArray(joinedStudents)
    ? joinedStudents
    : [];
  const enrolled = Number(session?.enrolledStudentsCount || 0);
  const present = safeRecords.length;
  const joined = safeJoinedStudents.length;
  const pending = Math.max(enrolled - present, 0);

  const sortedRecords = useMemo(() => {
    return [...safeRecords].sort((a, b) =>
      String(a.studentName || "").localeCompare(String(b.studentName || "")),
    );
  }, [safeRecords]);

  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const startMs =
    Number(session?.startTimeMs) || Date.parse(session?.startTime || "") || 0;
  const windowMs = Number(session?.attendanceWindowSeconds || 60) * 1000;
  const endMs = startMs + windowMs;
  const remainingMs = Math.max(endMs - nowMs, 0);
  const remainingTotalSeconds = Math.ceil(remainingMs / 1000);
  const remainingMinutes = Math.floor(remainingTotalSeconds / 60);
  const remainingSeconds = remainingTotalSeconds % 60;
  const timerText = `${String(remainingMinutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;

  const exportCsv = () => {
    const csv = toCsv(session, sortedRecords);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${session.subjectId || "subject"}_${session.date || "attendance"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs uppercase text-emerald-700">Present</p>
          <p className="text-3xl font-bold text-emerald-700">{present}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs uppercase text-blue-700">Joined</p>
          <p className="text-3xl font-bold text-blue-700">{joined}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs uppercase text-amber-700">Pending</p>
          <p className="text-3xl font-bold text-amber-700">{pending}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 md:col-span-3">
          <p className="text-xs uppercase text-slate-600">Subject</p>
          <p className="text-lg font-semibold text-slate-800">
            {session.subjectName}
          </p>
        </div>
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 md:col-span-3">
          <p className="text-xs uppercase text-sky-700">Time Remaining</p>
          <p className="text-2xl font-bold text-sky-700">{timerText}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setShowScanner((prev) => !prev)}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white"
        >
          {showScanner ? "Hide QR Scanner" : "Scan Student QR"}
        </button>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
        >
          {refreshing ? "Refreshing..." : "Refresh Session Data"}
        </button>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
        >
          Export CSV (Google Sheets)
        </button>
        <button
          type="button"
          disabled={ending}
          onClick={onEndSession}
          className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {ending ? "Ending..." : "End Session"}
        </button>
      </div>

      {showScanner ? <QRScanner onDetected={onScanStudent} /> : null}

      <ClassroomHeatmap
        teacherLocation={session.teacherLocation}
        points={heatmapPoints}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
          <span className="text-sm font-semibold text-slate-700">
            Students Joined Session
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 disabled:opacity-60"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-white text-slate-500">
              <tr>
                <th className="px-4 py-2">Student</th>
                <th className="px-4 py-2">Roll Number / ID</th>
                <th className="px-4 py-2">Joined At</th>
              </tr>
            </thead>
            <tbody>
              {safeJoinedStudents.map((student) => (
                <tr
                  key={`${student.studentId || student.prn || "student"}_joined`}
                  className="border-t border-slate-100"
                >
                  <td className="px-4 py-2">
                    {student.studentName || "Student"}
                  </td>
                  <td className="px-4 py-2">
                    {student.prn || student.studentId || "-"}
                  </td>
                  <td className="px-4 py-2">
                    {formatTime(student.joinTimestamp)}
                  </td>
                </tr>
              ))}
              {safeJoinedStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    No students have joined the session yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
          <span className="text-sm font-semibold text-slate-700">
            Live Attendance List
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 disabled:opacity-60"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-white text-slate-500">
              <tr>
                <th className="px-4 py-2">PRN</th>
                <th className="px-4 py-2">Student</th>
                <th className="px-4 py-2">Method</th>
                <th className="px-4 py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {sortedRecords.map((record) => (
                <tr key={record.recordId} className="border-t border-slate-100">
                  <td className="px-4 py-2">{record.prn || "-"}</td>
                  <td className="px-4 py-2">
                    {record.studentName || record.studentId}
                  </td>
                  <td className="px-4 py-2">{formatMethod(record.method)}</td>
                  <td className="px-4 py-2">{formatTime(record.timestamp)}</td>
                </tr>
              ))}
              {sortedRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    No attendance records yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
