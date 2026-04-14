import React, { useEffect, useMemo, useState } from "react";

const haversineDistanceMeters = (pointA, pointB) => {
  const lat1 = Number(pointA?.lat);
  const lon1 = Number(pointA?.lng);
  const lat2 = Number(pointB?.lat);
  const lon2 = Number(pointB?.lng);

  if ([lat1, lon1, lat2, lon2].some((value) => Number.isNaN(value))) {
    return Number.POSITIVE_INFINITY;
  }

  const R = 6371000;
  const toRad = (degrees) => (degrees * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export default function AttendanceSessionCard({
  session,
  studentLocation,
  onMark,
  marking,
  biometricReady,
  verificationReady,
  verificationLabel = "biometric",
}) {
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const distance = useMemo(() => {
    if (!session?.teacherLocation || !studentLocation) {
      return Number.POSITIVE_INFINITY;
    }
    return haversineDistanceMeters(studentLocation, session.teacherLocation);
  }, [session, studentLocation]);

  const allowedDistance = Number(session?.allowedDistanceMeters || 30);
  const isVerificationReady =
    typeof verificationReady === "boolean" ? verificationReady : biometricReady;
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

  if (!session) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
        Join an active session from the list to continue with attendance
        verification.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
      <h3 className="text-lg font-semibold text-emerald-800">
        Active Attendance Session
      </h3>
      <p className="mt-1 text-sm text-emerald-700">
        {session.subjectName} | {session.date}
      </p>
      <p className="mt-2 text-sm font-semibold text-emerald-800">
        Time remaining: {timerText}
      </p>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-white p-3 text-sm text-slate-700">
          <p className="font-medium">Distance from classroom</p>
          <p className="mt-1">
            {Number.isFinite(distance)
              ? `${distance.toFixed(1)} meters`
              : "Location unavailable"}
          </p>
        </div>
        <div className="rounded-xl bg-white p-3 text-sm text-slate-700">
          <p className="font-medium">Allowed radius</p>
          <p className="mt-1">{allowedDistance} meters</p>
        </div>
      </div>

      <button
        type="button"
        disabled={!isVerificationReady || marking}
        onClick={onMark}
        className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {marking ? "Marking..." : "Mark Attendance"}
      </button>

      <p className="mt-2 text-xs text-slate-500">
        Distance is shown for reference and may vary by network/GPS accuracy.
      </p>
      {!isVerificationReady ? (
        <p className="mt-2 text-xs text-amber-700">
          Complete {verificationLabel} verification before marking attendance.
        </p>
      ) : null}
    </div>
  );
}
