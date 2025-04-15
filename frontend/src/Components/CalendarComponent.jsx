import React, { useState } from "react";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight } from "lucide-react";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarComponent() {
  const [currentDate, setCurrentDate] = useState(dayjs());

  const startOfMonth = currentDate.startOf("month");
  const endOfMonth = currentDate.endOf("month");
  const startDate = startOfMonth.startOf("week");
  const endDate = endOfMonth.endOf("week");

  const calendar = [];
  let date = startDate;

  while (date.isBefore(endDate, "day") || date.isSame(endDate, "day")) {
    calendar.push(date);
    date = date.add(1, "day");
  }

  return (
    <div className="bg-gradient-to-br from-white via-slate-100 to-white p-4 rounded-xl shadow-md">
      {/* Header with Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentDate(currentDate.subtract(1, "month"))}
          className="p-2 rounded hover:bg-gray-200 transition"
        >
          <ChevronLeft className="text-indigo-600" />
        </button>
        <h2 className="text-lg font-semibold text-indigo-700">
          {currentDate.format("MMMM YYYY")}
        </h2>
        <button
          onClick={() => setCurrentDate(currentDate.add(1, "month"))}
          className="p-2 rounded hover:bg-gray-200 transition"
        >
          <ChevronRight className="text-indigo-600" />
        </button>
      </div>

      {/* Days of the Week */}
      <div className="grid grid-cols-7 gap-2 text-center text-gray-600 font-semibold text-xs mb-2">
        {daysOfWeek.map((day) => (
          <div key={day} className="uppercase">{day}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 text-center text-sm">
        {calendar.map((dateObj, index) => {
          const isToday = dateObj.isSame(dayjs(), "day");
          const isCurrentMonth = dateObj.month() === currentDate.month();
          return (
            <div
              key={index}
              className={`rounded-lg p-2 border text-sm transition ${
                isToday
                  ? "bg-indigo-500 text-white font-bold border-indigo-500"
                  : isCurrentMonth
                  ? "text-gray-800 border-gray-200"
                  : "text-gray-400 border-gray-100"
              }`}
            >
              {dateObj.date()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
