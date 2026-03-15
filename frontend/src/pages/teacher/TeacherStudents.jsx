import React, { useEffect, useMemo, useState } from "react";
import { auth, firestore } from "../../firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import {
  FiArrowLeft,
  FiUsers,
  FiBookOpen,
  FiSearch,
  FiDownload,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const normalizeAssignments = (teacherData) => {
  if (
    Array.isArray(teacherData?.assignments) &&
    teacherData.assignments.length
  ) {
    return teacherData.assignments;
  }

  if (
    Array.isArray(teacherData?.assignedCourses) &&
    teacherData.assignedCourses.length
  ) {
    const fallbackBranch = teacherData?.department || teacherData?.dept || "";
    return teacherData.assignedCourses.map((course) => ({
      branch: fallbackBranch,
      year: course.year,
      subjects: Array.isArray(course.subjects) ? course.subjects : [],
    }));
  }

  return [];
};

export default function TeacherStudents() {
  const navigate = useNavigate();
  const [teacherName, setTeacherName] = useState("Teacher");
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignmentIndex, setSelectedAssignmentIndex] = useState(0);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        const teacherDoc = await getDoc(
          doc(firestore, "teachers", currentUser.uid),
        );
        if (!teacherDoc.exists()) {
          setError("Teacher profile not found.");
          setLoading(false);
          return;
        }

        const teacherData = teacherDoc.data() || {};
        setTeacherName(
          teacherData.displayName ||
            teacherData.fullName ||
            teacherData.name ||
            "Teacher",
        );

        const normalized = normalizeAssignments(teacherData).filter(
          (assignment) =>
            assignment.branch &&
            assignment.year &&
            Array.isArray(assignment.subjects) &&
            assignment.subjects.length > 0,
        );

        if (!normalized.length) {
          setAssignments([]);
          setStudents([]);
          setLoading(false);
          return;
        }

        setAssignments(normalized);
        setSelectedAssignmentIndex(0);

        const [studentsSnap, usersSnap] = await Promise.all([
          getDocs(collection(firestore, "students")),
          getDocs(collection(firestore, "users")),
        ]);

        const mergedStudents = new Map();
        const absorbStudent = (record) => {
          const uid = record.uid || record.id;
          if (!uid) return;
          const existing = mergedStudents.get(uid) || {};
          mergedStudents.set(uid, {
            ...existing,
            ...record,
            uid,
          });
        };

        studentsSnap.docs.forEach((snap) =>
          absorbStudent({ id: snap.id, ...snap.data() }),
        );
        usersSnap.docs.forEach((snap) => {
          const data = snap.data() || {};
          if ((data.role || "").toLowerCase() !== "student") return;
          absorbStudent({ id: snap.id, ...data });
        });

        setStudents(Array.from(mergedStudents.values()));
      } catch (err) {
        setError("Failed to load teacher students: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const selectedAssignment = assignments[selectedAssignmentIndex] || null;

  const matchedStudents = useMemo(() => {
    if (!selectedAssignment) return [];

    const targetBranch = String(selectedAssignment.branch || "")
      .trim()
      .toLowerCase();
    const targetYear = String(selectedAssignment.year || "")
      .trim()
      .toLowerCase();

    return students
      .map((student) => {
        const studentBranch = String(student.dept || student.department || "")
          .trim()
          .toLowerCase();
        const studentYear = String(student.year || "")
          .trim()
          .toLowerCase();
        const studentSubjects = Array.isArray(student.subjects)
          ? student.subjects.map((subject) => String(subject).trim())
          : [];

        if (studentBranch !== targetBranch || studentYear !== targetYear) {
          return null;
        }

        const matchedSubjects = selectedAssignment.subjects.filter((subject) =>
          studentSubjects.includes(subject),
        );

        if (!matchedSubjects.length) {
          return null;
        }

        return {
          uid: student.uid,
          name: student.name || "Unknown Student",
          prn: student.prn || student.rollNo || student.rollNumber || "-",
          rollNo: student.rollNo || student.rollNumber || student.prn || "-",
          email: student.email || "-",
          contactEmail: student.contactEmail || "-",
          mobile: student.mobile || student.phone || "-",
          department: student.dept || student.department || "-",
          year: student.year || "-",
          semester: student.semester || "-",
          division: student.division || "-",
          subjects: Array.isArray(student.subjects) ? student.subjects : [],
          matchedSubjects,
        };
      })
      .filter(Boolean)
      .filter((student) => {
        const needle = search.toLowerCase().trim();
        if (!needle) return true;
        return (
          String(student.name).toLowerCase().includes(needle) ||
          String(student.prn).toLowerCase().includes(needle)
        );
      });
  }, [selectedAssignment, students, search]);

  useEffect(() => {
    setSelectedStudentIds([]);
  }, [selectedAssignmentIndex, search]);

  const toggleSelectStudent = (uid) => {
    setSelectedStudentIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid],
    );
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === matchedStudents.length) {
      setSelectedStudentIds([]);
      return;
    }

    setSelectedStudentIds(matchedStudents.map((student) => student.uid));
  };

  const getCsvContent = (rows) => {
    const headers = [
      "Name",
      "PRN",
      "Roll No",
      "Login Email",
      "Contact Email",
      "Mobile",
      "Department",
      "Year",
      "Semester",
      "Division",
      "All Subjects",
      "Matched Subjects",
    ];

    const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

    const lines = rows.map((student) => {
      return [
        student.name,
        student.prn,
        student.rollNo,
        student.email,
        student.contactEmail,
        student.mobile,
        student.department,
        student.year,
        student.semester,
        student.division,
        (student.subjects || []).join("; "),
        (student.matchedSubjects || []).join("; "),
      ]
        .map(escapeCsv)
        .join(",");
    });

    return `${headers.join(",")}\n${lines.join("\n")}`;
  };

  const downloadCsv = (rows, fileName) => {
    if (!rows.length) return;
    const csv = getCsvContent(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const openPdfPrint = (rows, title) => {
    if (!rows.length) return;

    const tableRows = rows
      .map(
        (student) => `
        <tr>
          <td>${student.name}</td>
          <td>${student.prn}</td>
          <td>${student.rollNo}</td>
          <td>${student.email}</td>
          <td>${student.contactEmail}</td>
          <td>${student.mobile}</td>
          <td>${student.department}</td>
          <td>${student.year}</td>
          <td>${student.semester}</td>
          <td>${student.division}</td>
          <td>${(student.subjects || []).join(", ")}</td>
          <td>${(student.matchedSubjects || []).join(", ")}</td>
        </tr>`,
      )
      .join("");

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 16px; }
            h1 { font-size: 18px; margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { border: 1px solid #999; padding: 6px; text-align: left; vertical-align: top; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>PRN</th>
                <th>Roll No</th>
                <th>Login Email</th>
                <th>Contact Email</th>
                <th>Mobile</th>
                <th>Department</th>
                <th>Year</th>
                <th>Semester</th>
                <th>Division</th>
                <th>All Subjects</th>
                <th>Matched Subjects</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const exportSelectedCsv = () => {
    const rows = matchedStudents.filter((student) =>
      selectedStudentIds.includes(student.uid),
    );
    downloadCsv(rows, "selected_students.csv");
  };

  const exportSelectedPdf = () => {
    const rows = matchedStudents.filter((student) =>
      selectedStudentIds.includes(student.uid),
    );
    openPdfPrint(rows, "Selected Students Report");
  };

  const exportSingleCsv = (student) => {
    downloadCsv([student], `${student.prn || student.uid}_student.csv`);
  };

  const exportSinglePdf = (student) => {
    openPdfPrint([student], `${student.name} Student Report`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-blue-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate("/teacher-dashboard")}
          className="mb-4 inline-flex items-center gap-2 text-blue-700 hover:text-blue-900"
        >
          <FiArrowLeft /> Back to Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-5 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">
            Students by Assigned Subject
          </h1>
          <p className="text-gray-600 mt-1">
            {teacherName}, select an assigned branch-year-subject load to view
            matching students.
          </p>

          {error && <p className="mt-4 text-red-600">{error}</p>}

          {loading ? (
            <p className="mt-6 text-gray-600">Loading assigned students...</p>
          ) : assignments.length === 0 ? (
            <p className="mt-6 text-gray-600">
              No teaching assignments found on your profile.
            </p>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {assignments.map((assignment, index) => {
                  const isActive = index === selectedAssignmentIndex;
                  return (
                    <button
                      key={`${assignment.branch}-${assignment.year}-${index}`}
                      onClick={() => setSelectedAssignmentIndex(index)}
                      className={`text-left rounded-lg border p-3 transition ${
                        isActive
                          ? "border-blue-500 bg-blue-50 shadow"
                          : "border-gray-200 bg-white hover:border-blue-300"
                      }`}
                    >
                      <div className="font-semibold text-gray-800">
                        {assignment.branch} - {assignment.year} Year
                      </div>
                      <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {assignment.subjects.join(", ")}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <FiBookOpen />
                  {selectedAssignment?.branch} - {selectedAssignment?.year} Year
                </div>
                <div className="relative w-full sm:w-80">
                  <FiSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or PRN"
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2"
                  />
                </div>
              </div>

              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 inline-flex items-center gap-2">
                <FiUsers /> {matchedStudents.length} students found for selected
                assignment
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={exportSelectedCsv}
                  disabled={selectedStudentIds.length === 0}
                  className="inline-flex items-center gap-2 bg-emerald-600 text-white px-3 py-2 rounded disabled:opacity-50"
                >
                  <FiDownload /> Export Selected CSV
                </button>
                <button
                  type="button"
                  onClick={exportSelectedPdf}
                  disabled={selectedStudentIds.length === 0}
                  className="inline-flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded disabled:opacity-50"
                >
                  <FiDownload /> Export Selected PDF
                </button>
              </div>

              <div className="mt-4 overflow-x-auto border rounded-lg bg-white">
                <table className="w-full min-w-[1500px] text-sm">
                  <thead className="bg-blue-50 text-gray-700">
                    <tr>
                      <th className="p-3 text-left">
                        <input
                          type="checkbox"
                          checked={
                            matchedStudents.length > 0 &&
                            selectedStudentIds.length === matchedStudents.length
                          }
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th className="p-3 text-left">Student Name</th>
                      <th className="p-3 text-left">PRN</th>
                      <th className="p-3 text-left">Roll No</th>
                      <th className="p-3 text-left">Login Email</th>
                      <th className="p-3 text-left">Contact Email</th>
                      <th className="p-3 text-left">Mobile</th>
                      <th className="p-3 text-left">Department</th>
                      <th className="p-3 text-left">Year</th>
                      <th className="p-3 text-left">Semester</th>
                      <th className="p-3 text-left">Division</th>
                      <th className="p-3 text-left">All Subjects</th>
                      <th className="p-3 text-left">Matched Subjects</th>
                      <th className="p-3 text-left">Export</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchedStudents.length > 0 ? (
                      matchedStudents.map((student) => (
                        <tr key={student.uid} className="border-t">
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selectedStudentIds.includes(student.uid)}
                              onChange={() => toggleSelectStudent(student.uid)}
                            />
                          </td>
                          <td className="p-3">{student.name}</td>
                          <td className="p-3">{student.prn}</td>
                          <td className="p-3">{student.rollNo}</td>
                          <td className="p-3">{student.email}</td>
                          <td className="p-3">{student.contactEmail}</td>
                          <td className="p-3">{student.mobile}</td>
                          <td className="p-3">{student.department}</td>
                          <td className="p-3">{student.year}</td>
                          <td className="p-3">{student.semester}</td>
                          <td className="p-3">{student.division}</td>
                          <td className="p-3">{student.subjects.join(", ")}</td>
                          <td className="p-3">
                            {student.matchedSubjects.join(", ")}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => exportSingleCsv(student)}
                                className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded"
                              >
                                CSV
                              </button>
                              <button
                                type="button"
                                onClick={() => exportSinglePdf(student)}
                                className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded"
                              >
                                PDF
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          className="p-6 text-center text-gray-500"
                          colSpan={14}
                        >
                          No students match the selected subject assignment.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
