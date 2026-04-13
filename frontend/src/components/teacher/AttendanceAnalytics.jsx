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
    </section>
  );
}
