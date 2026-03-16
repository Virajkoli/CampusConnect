import React from "react";

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

export default function PastSessionDetailsModal({
  isOpen,
  onClose,
  session,
  records,
  loading,
  onExport,
}) {
  if (!isOpen || !session) {
    return null;
  }

  const recordsList = Array.isArray(records) ? records : [];
  const presentStudents = Array.isArray(session.presentStudents)
    ? session.presentStudents
    : [];
  const absentStudents = Array.isArray(session.absentStudents)
    ? session.absentStudents
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Session Details
            </h3>
            <p className="text-xs text-slate-600">
              {session.subjectName || "Subject"} | {session.date || "-"} |
              Session: {String(session.sessionId || session.id || "-")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onExport(session, recordsList)}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white"
              disabled={loading}
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              Close
            </button>
          </div>
        </div>

        <div className="space-y-3 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-4">
            <div className="rounded-lg bg-emerald-50 p-3">
              <p className="text-xs uppercase text-emerald-700">Present</p>
              <p className="text-xl font-semibold text-emerald-700">
                {Number(session.presentCount || 0)}
              </p>
            </div>
            <div className="rounded-lg bg-sky-50 p-3">
              <p className="text-xs uppercase text-sky-700">Enrolled</p>
              <p className="text-xl font-semibold text-sky-700">
                {Number(session.enrolledStudentsCount || 0)}
              </p>
            </div>
            <div className="rounded-lg bg-rose-50 p-3">
              <p className="text-xs uppercase text-rose-700">Absent</p>
              <p className="text-xl font-semibold text-rose-700">
                {Number(session.absentCount || 0)}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs uppercase text-slate-600">Ended At</p>
              <p className="text-sm font-medium text-slate-700">
                {formatDateTime(session.endTimeMs || session.endTime)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 text-xs md:grid-cols-2">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="font-semibold text-emerald-800">Present Students</p>
              <div className="mt-1 max-h-32 overflow-y-auto text-emerald-700">
                {presentStudents.length > 0 ? (
                  presentStudents.map((student) => (
                    <p key={`${student.studentId || student.prn}_present`}>
                      {(student.studentName || "Student") +
                        (student.prn ? ` (${student.prn})` : "")}
                    </p>
                  ))
                ) : (
                  <p>No present students listed.</p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
              <p className="font-semibold text-rose-800">Absent Students</p>
              <div className="mt-1 max-h-32 overflow-y-auto text-rose-700">
                {absentStudents.length > 0 ? (
                  absentStudents.map((student) => (
                    <p key={`${student.studentId || student.prn}_absent`}>
                      {(student.studentName || "Student") +
                        (student.prn ? ` (${student.prn})` : "")}
                    </p>
                  ))
                ) : (
                  <p>No absent students listed.</p>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="px-3 py-2">PRN</th>
                  <th className="px-3 py-2">Student</th>
                  <th className="px-3 py-2">Student ID</th>
                  <th className="px-3 py-2">Method</th>
                  <th className="px-3 py-2">Marked At</th>
                </tr>
              </thead>
              <tbody>
                {recordsList.map((record) => (
                  <tr
                    key={record.recordId || record.id}
                    className="border-t border-slate-100"
                  >
                    <td className="px-3 py-2">{record.prn || "-"}</td>
                    <td className="px-3 py-2">{record.studentName || "-"}</td>
                    <td className="px-3 py-2">{record.studentId || "-"}</td>
                    <td className="px-3 py-2">{record.method || "-"}</td>
                    <td className="px-3 py-2">
                      {formatDateTime(record.timestamp)}
                    </td>
                  </tr>
                ))}
                {recordsList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-8 text-center text-slate-500"
                    >
                      {loading
                        ? "Loading session records..."
                        : "No attendance records found for this session."}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {Array.isArray(session.absentStudentIds) &&
          session.absentStudentIds.length > 0 ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <p className="font-semibold">Absent Student IDs</p>
              <p className="mt-1 break-all">
                {session.absentStudentIds.join(", ")}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
