import React, { useState, useMemo } from "react";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarComponent({ events: propEvents = [] }) {
  const [currentDate, setCurrentDate] = useState(dayjs());

  // ✅ Process events only when propEvents change
  const events = useMemo(() => {
    const initializeEvents = () => {
      if (propEvents && propEvents.length > 0) {
        const formattedEvents = {};
        propEvents.forEach((event) => {
          const startDate = dayjs(event.startDate);
          const endDate = event.endDate ? dayjs(event.endDate) : startDate;
          let currentDate = startDate;

          while (
            currentDate.isBefore(endDate, "day") ||
            currentDate.isSame(endDate, "day")
          ) {
            const dateStr = currentDate.format("YYYY-MM-DD");

            if (!formattedEvents[dateStr]) {
              formattedEvents[dateStr] = [];
            }

            const colorMap = {
              academic: "bg-blue-500",
              exam: "bg-red-500",
              holiday: "bg-green-500",
              event: "bg-purple-500",
            };

            formattedEvents[dateStr].push({
              title: event.title,
              color: colorMap[event.category] || "bg-gray-500",
              id: event.id,
            });

            currentDate = currentDate.add(1, "day");
          }
        });

        return formattedEvents;
      } else {
        const today = dayjs().format("YYYY-MM-DD");
        const tomorrow = dayjs().add(1, "day").format("YYYY-MM-DD");
        const nextWeek = dayjs().add(5, "day").format("YYYY-MM-DD");

        return {
          [today]: [{ title: "Faculty Meeting", color: "bg-blue-500" }],
          [tomorrow]: [{ title: "Admission Review", color: "bg-green-500" }],
          [nextWeek]: [{ title: "Budget Planning", color: "bg-purple-500" }],
        };
      }
    };

    return initializeEvents();
  }, [propEvents]);

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

  const calendarVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.03,
      },
    },
  };

  const dayVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 200, damping: 12 },
    },
  };

  const monthNavVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
  };

  return (
    <motion.div
      className="bg-white p-4 rounded-xl shadow-lg border border-gray-200"
      initial="hidden"
      animate="visible"
      variants={calendarVariants}
    >
      {/* Header with Month Navigation */}
      <motion.div
        className="flex items-center justify-between mb-4"
        variants={monthNavVariants}
      >
        <motion.button
          onClick={() => setCurrentDate(currentDate.subtract(1, "month"))}
          className="p-2 rounded-full hover:bg-gray-100 transition flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft className="text-blue-600 w-5 h-5" />
        </motion.button>
        <h2 className="text-lg font-bold text-gray-800">
          {currentDate.format("MMMM YYYY")}
        </h2>
        <motion.button
          onClick={() => setCurrentDate(currentDate.add(1, "month"))}
          className="p-2 rounded-full hover:bg-gray-100 transition flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronRight className="text-blue-600 w-5 h-5" />
        </motion.button>
      </motion.div>

      {/* Days of the Week */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {daysOfWeek.map((day) => (
          <div key={day} className="text-xs font-semibold text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {calendar.map((dateObj, index) => {
          const isToday = dateObj.isSame(dayjs(), "day");
          const isCurrentMonth = dateObj.month() === currentDate.month();
          const dateStr = dateObj.format("YYYY-MM-DD");
          const hasEvents = events[dateStr]?.length > 0;

          return (
            <motion.div
              key={index}
              variants={dayVariants}
              whileHover={{ scale: 1.1, zIndex: 10 }}
              className={`relative rounded-lg py-2 transition-all duration-200 cursor-pointer
                ${isCurrentMonth ? "hover:shadow-md" : "opacity-50"}
                ${
                  isToday
                    ? "bg-blue-600 text-white font-bold"
                    : isCurrentMonth
                    ? "text-gray-700 hover:bg-gray-50"
                    : "text-gray-400"
                }
              `}
            >
              <span className="inline-block">{dateObj.date()}</span>

              {/* Event indicators */}
              {hasEvents && (
                <div className="absolute bottom-1 left-0 right-0 flex justify-center space-x-1">
                  {events[dateStr].map((event, i) => (
                    <motion.span
                      key={i}
                      className={`${event.color} w-1.5 h-1.5 rounded-full inline-block`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Upcoming events */}
      <div className="mt-4 border-t pt-3">
        <h3 className="text-sm font-bold text-gray-700 mb-2">
          Upcoming Events
        </h3>
        <div className="space-y-2">
          {Object.entries(events)
            .sort()
            .slice(0, 3)
            .map(([date, eventList]) => (
              <motion.div
                key={date}
                className="flex items-center text-sm"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  className={`${eventList[0].color} w-2 h-8 rounded-full mr-2`}
                ></div>
                <div>
                  <div className="font-medium">{eventList[0].title}</div>
                  <div className="text-xs text-gray-500">
                    {dayjs(date).format("MMM D, YYYY")}
                  </div>
                </div>
              </motion.div>
            ))}
        </div>
      </div>
    </motion.div>
  );
}
