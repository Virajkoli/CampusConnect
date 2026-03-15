import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, firestore } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { FiArrowLeft, FiPlus } from "react-icons/fi";
import { toast } from "react-toastify";
import TimetableGrid from "../../components/teacher/TimetableGrid";
import AddLectureModal from "../../components/teacher/AddLectureModal";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIME_SLOTS = [
  { label: "09:00 - 10:00", start: "09:00", end: "10:00" },
  { label: "10:00 - 11:00", start: "10:00", end: "11:00" },
  { label: "11:00 - 12:00", start: "11:00", end: "12:00" },
  { label: "12:00 - 13:00", start: "12:00", end: "13:00" },
  { label: "13:00 - 14:00", start: "13:00", end: "14:00" },
  { label: "14:00 - 15:00", start: "14:00", end: "15:00" },
  { label: "15:00 - 16:00", start: "15:00", end: "16:00" },
  { label: "16:00 - 17:00", start: "16:00", end: "17:00" },
];

const normalizeAssignments = (teacherData) => {
  if (
    Array.isArray(teacherData?.assignments) &&
    teacherData.assignments.length > 0
  ) {
    return teacherData.assignments;
  }

  if (
    Array.isArray(teacherData?.assignedCourses) &&
    teacherData.assignedCourses.length > 0
  ) {
    const defaultBranch = teacherData?.department || teacherData?.dept || "";
    return teacherData.assignedCourses.map((course) => ({
      branch: defaultBranch,
      year: course.year,
      subjects: Array.isArray(course.subjects) ? course.subjects : [],
    }));
  }

  return [];
};

export default function TeacherTimetablePage() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("1");
  const [allowedSubjects, setAllowedSubjects] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const branchOptions = useMemo(() => {
    return [...new Set(assignments.map((item) => item.branch).filter(Boolean))];
  }, [assignments]);

  const yearOptions = useMemo(() => {
    if (!branch) return [];
    return [
      ...new Set(
        assignments
          .filter((item) => item.branch === branch)
          .map((item) => item.year)
          .filter(Boolean),
      ),
    ];
  }, [assignments, branch]);

  useEffect(() => {
    const init = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        const teacherSnap = await getDoc(
          doc(firestore, "teachers", currentUser.uid),
        );
        if (!teacherSnap.exists()) {
          toast.error("Teacher profile not found.");
          setLoading(false);
          return;
        }

        const teacherData = teacherSnap.data() || {};
        const normalized = normalizeAssignments(teacherData).filter(
          (item) => item.branch && item.year,
        );

        setTeacher({ uid: currentUser.uid, ...teacherData });
        setAssignments(normalized);

        const first = normalized[0];
        if (first) {
          setBranch(first.branch);
          setYear(first.year);
        }
      } catch (error) {
        toast.error(
          error.message || "Failed to load teacher timetable profile.",
        );
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [navigate]);

  useEffect(() => {
    if (!branch || !year || !semester) {
      setLectures([]);
      return;
    }

    const fetchClassTimetable = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const response = await fetch(
          `${apiBase}/timetable/${encodeURIComponent(branch)}/${encodeURIComponent(year)}/${encodeURIComponent(semester)}`,
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to load timetable.");
        }
        setLectures(Array.isArray(data.lectures) ? data.lectures : []);
      } catch (error) {
        toast.error(error.message || "Failed to load timetable.");
      }
    };

    fetchClassTimetable();
  }, [branch, year, semester]);

  useEffect(() => {
    if (!branch || !year || !semester) {
      setAllowedSubjects([]);
      return;
    }

    const assignment = assignments.find(
      (item) => item.branch === branch && item.year === year,
    );
    const assignedSubjects = Array.isArray(assignment?.subjects)
      ? assignment.subjects
      : [];

    const loadSemesterSubjects = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const response = await fetch(
          `${apiBase}/api/subjects?department=${encodeURIComponent(branch)}&year=${encodeURIComponent(year)}&semester=${encodeURIComponent(semester)}`,
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to load subjects.");
        }

        const semesterSubjects = Array.isArray(data.subjects)
          ? data.subjects
          : [];
        const filtered = semesterSubjects.filter((subject) =>
          assignedSubjects.includes(subject),
        );
        setAllowedSubjects(filtered);
      } catch (error) {
        toast.error(error.message || "Failed to load semester subjects.");
      }
    };

    loadSemesterSubjects();
  }, [assignments, branch, year, semester]);

  const refreshTimetable = async () => {
    if (!branch || !year || !semester) return;

    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const response = await fetch(
      `${apiBase}/timetable/${encodeURIComponent(branch)}/${encodeURIComponent(year)}/${encodeURIComponent(semester)}`,
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to refresh timetable.");
    }

    setLectures(Array.isArray(data.lectures) ? data.lectures : []);
  };

  const handleAddLecture = async (lectureData) => {
    if (!teacher?.uid) return;

    try {
      setIsSubmitting(true);
      const token = await auth.currentUser.getIdToken();
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";

      const response = await fetch(`${apiBase}/timetable/add-lecture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(lectureData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to add lecture.");
      }

      toast.success("Lecture added successfully.");
      setIsAddOpen(false);
      await refreshTimetable();
    } catch (error) {
      toast.error(error.message || "Failed to add lecture.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading timetable...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-blue-100 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <button
          onClick={() => navigate("/teacher-dashboard")}
          className="mb-4 inline-flex items-center gap-2 text-blue-700 hover:text-blue-900"
        >
          <FiArrowLeft /> Back to Dashboard
        </button>

        <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Timetable</h1>
              <p className="text-sm text-gray-600">
                Shared class timetable with overlap protection and
                attendance-ready lecture IDs.
              </p>
            </div>

            <button
              onClick={() => setIsAddOpen(true)}
              disabled={
                !branch || !year || !semester || allowedSubjects.length === 0
              }
              className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              <FiPlus /> Add Lecture Slot
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <select
              value={branch}
              onChange={(event) => {
                const value = event.target.value;
                setBranch(value);
                const firstYear =
                  assignments.find((item) => item.branch === value)?.year || "";
                setYear(firstYear);
              }}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Select Branch</option>
              {branchOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={(event) => setYear(event.target.value)}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Select Year</option>
              {yearOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <select
              value={semester}
              onChange={(event) => setSemester(event.target.value)}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </select>
          </div>

          <div className="mt-6">
            <TimetableGrid
              lectures={lectures}
              days={DAYS}
              timeSlots={TIME_SLOTS}
              currentTeacherId={teacher?.uid}
            />
          </div>
        </div>
      </div>

      <AddLectureModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleAddLecture}
        branch={branch}
        year={year}
        semester={semester}
        allowedSubjects={allowedSubjects}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
