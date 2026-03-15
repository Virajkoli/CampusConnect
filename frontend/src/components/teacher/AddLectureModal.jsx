import React, { useMemo, useState } from "react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const TIME_SLOTS = [
  { start: "09:00", end: "10:00" },
  { start: "10:00", end: "11:00" },
  { start: "11:00", end: "12:00" },
  { start: "12:00", end: "13:00" },
  { start: "13:00", end: "14:00" },
  { start: "14:00", end: "15:00" },
  { start: "15:00", end: "16:00" },
  { start: "16:00", end: "17:00" },
];

export default function AddLectureModal({
  open,
  onClose,
  onSubmit,
  branch,
  year,
  semester,
  allowedSubjects,
  isSubmitting,
}) {
  const [formData, setFormData] = useState({
    subjectName: "",
    day: "Monday",
    startTime: "09:00",
    endTime: "10:00",
  });

  const slotOptions = useMemo(() => {
    return TIME_SLOTS.map((slot) => ({
      label: `${slot.start} - ${slot.end}`,
      ...slot,
    }));
  }, []);

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit({
      ...formData,
      branch,
      year,
      semester,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-lg font-semibold text-gray-800">
            Add Lecture Slot
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              value={branch}
              readOnly
              className="rounded border border-gray-300 bg-gray-100 px-3 py-2 text-sm"
            />
            <input
              value={year}
              readOnly
              className="rounded border border-gray-300 bg-gray-100 px-3 py-2 text-sm"
            />
            <input
              value={`Semester ${semester}`}
              readOnly
              className="rounded border border-gray-300 bg-gray-100 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Subject
            </label>
            <select
              required
              value={formData.subjectName}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  subjectName: event.target.value,
                }))
              }
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Select Subject</option>
              {allowedSubjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Day
              </label>
              <select
                value={formData.day}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, day: event.target.value }))
                }
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              >
                {DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Start
              </label>
              <select
                value={formData.startTime}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    startTime: event.target.value,
                  }))
                }
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              >
                {slotOptions.map((slot) => (
                  <option key={slot.start} value={slot.start}>
                    {slot.start}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                End
              </label>
              <select
                value={formData.endTime}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    endTime: event.target.value,
                  }))
                }
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              >
                {slotOptions.map((slot) => (
                  <option key={slot.end} value={slot.end}>
                    {slot.end}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Add Lecture"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
