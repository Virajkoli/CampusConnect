import React from "react";

const toMinutes = (timeText = "") => {
  const [h, m] = String(timeText || "00:00")
    .split(":")
    .map((part) => Number.parseInt(part, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
};

const getLectureStatus = (lecture) => {
  const now = new Date();
  const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if ((lecture.day || "") !== currentDay) {
    return "Scheduled";
  }

  const start = toMinutes(lecture.startTime || "");
  const end = toMinutes(lecture.endTime || "");

  if (currentMinutes < start) return "Scheduled";
  if (currentMinutes >= start && currentMinutes < end) return "Ongoing";
  return "Completed";
};

const statusStyle = {
  Scheduled: "bg-blue-100 text-blue-700",
  Ongoing: "bg-green-100 text-green-700",
  Completed: "bg-gray-200 text-gray-700",
};

export default function LectureSlotCard({ lecture, isOwnLecture }) {
  const status = getLectureStatus(lecture);

  return (
    <div
      className={`rounded-md border p-2 text-xs shadow-sm ${
        isOwnLecture ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"
      }`}
    >
      <div className="font-semibold text-gray-800">{lecture.subjectName}</div>
      <div className="text-gray-600">{lecture.teacherName}</div>
      <div className="text-gray-600">
        {lecture.startTime} - {lecture.endTime}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span
          className={`rounded px-2 py-0.5 ${statusStyle[status] || statusStyle.Scheduled}`}
        >
          {status}
        </span>
        {isOwnLecture ? (
          <span className="rounded bg-indigo-100 px-2 py-0.5 text-indigo-700">
            Your Lecture
          </span>
        ) : null}
      </div>
    </div>
  );
}
