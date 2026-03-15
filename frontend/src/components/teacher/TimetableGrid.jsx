import React from "react";
import LectureSlotCard from "./LectureSlotCard";

const toMinutes = (timeText = "") => {
  const [h, m] = String(timeText || "00:00")
    .split(":")
    .map((part) => Number.parseInt(part, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
};

const overlaps = (aStart, aEnd, bStart, bEnd) => {
  return aStart < bEnd && bStart < aEnd;
};

export default function TimetableGrid({
  lectures,
  days,
  timeSlots,
  currentTeacherId,
}) {
  const getLectureForCell = (day, slot) => {
    const slotStart = toMinutes(slot.start);
    const slotEnd = toMinutes(slot.end);

    return lectures.find((lecture) => {
      if ((lecture.day || "") !== day) return false;
      const lectureStart = toMinutes(lecture.startTime || "");
      const lectureEnd = toMinutes(lecture.endTime || "");
      return overlaps(slotStart, slotEnd, lectureStart, lectureEnd);
    });
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-[920px] w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white">
            <th className="p-3 text-left border border-blue-600">Time</th>
            {days.map((day) => (
              <th key={day} className="p-3 text-center border border-blue-600">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map((slot) => (
            <tr key={slot.label} className="border-b">
              <td className="p-3 border bg-gray-50 font-medium text-gray-700">
                {slot.label}
              </td>
              {days.map((day) => {
                const lecture = getLectureForCell(day, slot);
                return (
                  <td
                    key={`${day}-${slot.label}`}
                    className="p-2 border align-top min-h-[100px]"
                  >
                    {lecture ? (
                      <LectureSlotCard
                        lecture={lecture}
                        isOwnLecture={lecture.teacherId === currentTeacherId}
                      />
                    ) : (
                      <div className="h-[78px] rounded border border-dashed border-gray-200 bg-gray-50" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
