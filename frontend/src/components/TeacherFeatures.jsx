import React, { useState } from "react";
import {
  uploadStudentMarks,
  createAssignment,
  markAttendance,
} from "../utils/teacherUtils";

// Component for uploading student marks
export const MarksUploadComponent = ({ courseId, assignmentId }) => {
  const [students, setStudents] = useState([
    { id: "1", name: "John Doe", marks: "", feedback: "" },
    { id: "2", name: "Jane Smith", marks: "", feedback: "" },
    // Add more students as needed
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleInputChange = (studentId, field, value) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId ? { ...student, [field]: value } : student
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    // Validate all inputs
    const hasEmptyMarks = students.some((student) => student.marks === "");
    if (hasEmptyMarks) {
      setError("Please enter marks for all students");
      setLoading(false);
      return;
    }

    // Format data for API
    const gradesData = students.map((student) => ({
      studentId: student.id,
      marks: parseFloat(student.marks),
      feedback: student.feedback,
    }));

    try {
      const result = await uploadStudentMarks(
        courseId,
        assignmentId,
        gradesData
      );

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "Failed to upload marks");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Upload Student Marks</h2>

      {error && (
        <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">{error}</div>
      )}
      {success && (
        <div className="bg-green-100 text-green-700 p-2 mb-4 rounded">
          Marks uploaded successfully!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-4 text-left">Student Name</th>
                <th className="py-2 px-4 text-left">Marks</th>
                <th className="py-2 px-4 text-left">Feedback</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-b">
                  <td className="py-2 px-4">{student.name}</td>
                  <td className="py-2 px-4">
                    <input
                      type="number"
                      value={student.marks}
                      onChange={(e) =>
                        handleInputChange(student.id, "marks", e.target.value)
                      }
                      className="border rounded p-1 w-24"
                      min="0"
                      max="100"
                      required
                    />
                  </td>
                  <td className="py-2 px-4">
                    <textarea
                      value={student.feedback}
                      onChange={(e) =>
                        handleInputChange(
                          student.id,
                          "feedback",
                          e.target.value
                        )
                      }
                      className="border rounded p-1 w-full"
                      rows="2"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? "Uploading..." : "Upload Marks"}
          </button>
        </div>
      </form>
    </div>
  );
};

// Component for creating assignments
export const AssignmentCreatorComponent = ({ courseId }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    totalMarks: "",
    attachment: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, attachment: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const result = await createAssignment(courseId, formData);

      if (result.success) {
        setSuccess(true);
        setFormData({
          title: "",
          description: "",
          dueDate: "",
          totalMarks: "",
          attachment: null,
        });
      } else {
        setError(result.error || "Failed to create assignment");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Create New Assignment</h2>

      {error && (
        <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">{error}</div>
      )}
      {success && (
        <div className="bg-green-100 text-green-700 p-2 mb-4 rounded">
          Assignment created successfully!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-1">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full border rounded p-2"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full border rounded p-2"
            rows="4"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">Due Date</label>
          <input
            type="datetime-local"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            className="w-full border rounded p-2"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">Total Marks</label>
          <input
            type="number"
            name="totalMarks"
            value={formData.totalMarks}
            onChange={handleChange}
            className="w-full border rounded p-2"
            min="0"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">Attachment (optional)</label>
          <input
            type="file"
            onChange={handleFileChange}
            className="w-full border rounded p-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? "Creating..." : "Create Assignment"}
        </button>
      </form>
    </div>
  );
};

// Component for marking attendance
export const AttendanceComponent = ({ courseId }) => {
  const [date, setDate] = useState("");
  const [students, setStudents] = useState([
    { id: "1", name: "John Doe", present: false },
    { id: "2", name: "Jane Smith", present: false },
    // Add more students as needed
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleDateChange = (e) => {
    setDate(e.target.value);
  };

  const handleAttendanceChange = (studentId, present) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId ? { ...student, present } : student
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    if (!date) {
      setError("Please select a date");
      setLoading(false);
      return;
    }

    const attendanceData = students.map((student) => ({
      studentId: student.id,
      present: student.present,
    }));

    try {
      const result = await markAttendance(courseId, date, attendanceData);

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "Failed to mark attendance");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Mark Attendance</h2>

      {error && (
        <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">{error}</div>
      )}
      {success && (
        <div className="bg-green-100 text-green-700 p-2 mb-4 rounded">
          Attendance marked successfully!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={handleDateChange}
            className="w-full border rounded p-2"
            required
          />
        </div>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Students</h3>

          <div className="space-y-2">
            {students.map((student) => (
              <div key={student.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={student.present}
                  onChange={(e) =>
                    handleAttendanceChange(student.id, e.target.checked)
                  }
                  className="mr-2"
                  id={`attendance-${student.id}`}
                />
                <label htmlFor={`attendance-${student.id}`}>
                  {student.name}
                </label>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? "Saving..." : "Mark Attendance"}
        </button>
      </form>
    </div>
  );
};
