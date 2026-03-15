import React, { useMemo, useState } from "react";

const todayISO = () => new Date().toISOString().slice(0, 10);
const getDayFromDate = (dateValue) => {
  const parsed = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", { weekday: "long" });
};

export default function StartAttendanceModal({
  isOpen,
  lectures,
  onClose,
  onStart,
  submitting,
}) {
  const [date, setDate] = useState(todayISO());
  const [lectureId, setLectureId] = useState("");
  const [attendanceWindowSeconds, setAttendanceWindowSeconds] = useState(60);

  const durationOptions = [
    { value: 60, label: "1 minute" },
    { value: 120, label: "2 minutes" },
    { value: 180, label: "3 minutes" },
    { value: 240, label: "4 minutes" },
    { value: 300, label: "5 minutes" },
    { value: 600, label: "10 minutes" },
  ];

  const options = useMemo(() => {
    return (Array.isArray(lectures) ? lectures : []).map((entry) => ({
      key: entry.id,
      label: `${entry.subjectName || entry.subject || "Subject"} | ${entry.day || "-"} | ${entry.startTime || ""}-${entry.endTime || ""}`,
      value: entry,
    }));
  }, [lectures]);

  if (!isOpen) {
    return null;
  }

  const selected = options.find((item) => item.key === lectureId)?.value;
  const selectedDateDay = getDayFromDate(date);
  const timetableDay = String(selected?.day || "").trim();
  const isMatchingDay =
    !timetableDay ||
    !selectedDateDay ||
    timetableDay.toLowerCase() === selectedDateDay.toLowerCase();

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!selected) {
      return;
    }

    if (!isMatchingDay) {
      return;
    }

    onStart({
      lectureId: selected.id,
      date,
      attendanceWindowSeconds,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-gray-900">
          Start Attendance Session
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Select a timetable lecture and date to start live attendance.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Lecture
            </label>
            <select
              value={lectureId}
              onChange={(e) => setLectureId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              required
            >
              <option value="">Select lecture from timetable</option>
              {options.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Attendance Time Slot
            </label>
            <select
              value={attendanceWindowSeconds}
              onChange={(e) =>
                setAttendanceWindowSeconds(Number(e.target.value) || 60)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              {durationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {selected ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <p>
                <span className="font-medium">Subject:</span>{" "}
                {selected.subjectName || selected.subject || "-"}
              </p>
              <p>
                <span className="font-medium">Class:</span>{" "}
                {selected.branch || "-"} {selected.year || ""}
                {selected.semester ? ` / Sem ${selected.semester}` : ""}
              </p>
              <p>
                <span className="font-medium">Timetable Day:</span>{" "}
                {timetableDay || "-"}
              </p>
              <p>
                <span className="font-medium">Selected Date Day:</span>{" "}
                {selectedDateDay || "-"}
              </p>
              {!isMatchingDay ? (
                <p className="mt-1 text-xs text-rose-600">
                  Selected date does not match timetable day for this lecture.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !isMatchingDay}
              className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white disabled:opacity-60"
            >
              {submitting ? "Starting..." : "Start Attendance Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
