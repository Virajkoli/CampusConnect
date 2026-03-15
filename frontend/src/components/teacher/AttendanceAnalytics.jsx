import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function AttendanceAnalytics({ analytics }) {
  if (!analytics) {
    return null;
  }

  const weeklyTrend = Array.isArray(analytics.weeklyTrend)
    ? analytics.weeklyTrend
    : [];
  const atRiskStudents = Array.isArray(analytics.studentsAtRisk)
    ? analytics.studentsAtRisk
    : [];

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs uppercase text-slate-500">Classes Conducted</p>
          <p className="text-2xl font-bold text-slate-800">
            {analytics.totalSessions || 0}
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-3">
          <p className="text-xs uppercase text-emerald-700">Attendance Rate</p>
          <p className="text-2xl font-bold text-emerald-700">
            {Number(analytics.classAttendanceRate || 0).toFixed(1)}%
          </p>
        </div>
        <div className="rounded-xl bg-amber-50 p-3">
          <p className="text-xs uppercase text-amber-700">Students At Risk</p>
          <p className="text-2xl font-bold text-amber-700">
            {atRiskStudents.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-3">
          <h4 className="mb-2 text-sm font-semibold text-slate-700">
            Weekly Attendance Trend
          </h4>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="attendanceRate"
                  stroke="#2563eb"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-3">
          <h4 className="mb-2 text-sm font-semibold text-slate-700">
            Present Students (Weekly)
          </h4>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="presentStudents"
                  fill="#059669"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 p-3">
        <h4 className="mb-2 text-sm font-semibold text-slate-700">
          Students Below 75%
        </h4>
        {atRiskStudents.length === 0 ? (
          <p className="text-sm text-slate-500">
            No at-risk students for this subject.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-slate-600">
                  <th className="px-3 py-2">Student ID</th>
                  <th className="px-3 py-2">Attendance %</th>
                  <th className="px-3 py-2">Attended</th>
                  <th className="px-3 py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {atRiskStudents.map((student) => (
                  <tr key={student.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">{student.studentId}</td>
                    <td className="px-3 py-2">
                      {Number(student.percentage || 0).toFixed(1)}%
                    </td>
                    <td className="px-3 py-2">
                      {student.attendedClasses || 0}
                    </td>
                    <td className="px-3 py-2">{student.totalClasses || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
