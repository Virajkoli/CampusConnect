import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiRefreshCw } from "react-icons/fi";
import { collection, getDocs } from "firebase/firestore";
import { auth, firestore } from "../../firebase";
import { BRANCHES, YEARS, SEMESTERS } from "../../utils/branchYearSubjects";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getStudentPrn = (student) => {
  return String(student.prn || student.rollNo || student.rollNumber || "")
    .trim()
    .toUpperCase();
};

export default function BulkAcademicUpdate() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedPrns, setSelectedPrns] = useState(new Set());
  const [bulkBranch, setBulkBranch] = useState("");
  const [bulkYear, setBulkYear] = useState("");
  const [bulkSemester, setBulkSemester] = useState("");
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [summary, setSummary] = useState(null);

  const filteredStudents = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return students;

    return students.filter((student) => {
      const name = String(student.name || "").toLowerCase();
      const email = String(student.email || "").toLowerCase();
      const dept = String(
        student.dept || student.department || "",
      ).toLowerCase();
      const prn = getStudentPrn(student).toLowerCase();

      return (
        name.includes(needle) ||
        email.includes(needle) ||
        dept.includes(needle) ||
        prn.includes(needle)
      );
    });
  }, [students, search]);

  const loadStudents = async () => {
    setError("");
    setIsLoadingStudents(true);
    try {
      const usersSnapshot = await getDocs(collection(firestore, "users"));
      const studentUsers = usersSnapshot.docs
        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        .filter((user) => String(user.role || "").toLowerCase() === "student")
        .filter((user) => getStudentPrn(user));

      setStudents(studentUsers);
      setSuccess(`Loaded ${studentUsers.length} student records.`);
    } catch (err) {
      setError(err.message || "Failed to load students");
    } finally {
      setIsLoadingStudents(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const allFilteredSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((student) =>
      selectedPrns.has(getStudentPrn(student)),
    );

  const toggleSelectAllFiltered = () => {
    setSelectedPrns((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredStudents.forEach((student) =>
          next.delete(getStudentPrn(student)),
        );
      } else {
        filteredStudents.forEach((student) => next.add(getStudentPrn(student)));
      }
      return next;
    });
  };

  const toggleSelectPrn = (prn) => {
    setSelectedPrns((prev) => {
      const next = new Set(prev);
      if (next.has(prn)) {
        next.delete(prn);
      } else {
        next.add(prn);
      }
      return next;
    });
  };

  const handleApply = async () => {
    setError("");
    setSuccess("");
    setSummary(null);

    if (selectedPrns.size === 0) {
      setError("Select at least one student for bulk update");
      return;
    }

    if (!bulkBranch && !bulkYear && !bulkSemester) {
      setError(
        "Select at least one field to update (branch, year, or semester)",
      );
      return;
    }

    setIsUpdating(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate("/auth/admin");
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch(
        `${API_URL}/api/admin/bulk-update-student-academics`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            updates: Array.from(selectedPrns).map((prn) => ({
              prn,
              branch: bulkBranch || undefined,
              year: bulkYear || undefined,
              semester: bulkSemester || undefined,
            })),
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Bulk academic update failed");
      }

      setSummary(data.summary || null);
      setSuccess("Bulk academic update completed for selected students.");
      await loadStudents();
    } catch (err) {
      setError(err.message || "Bulk academic update failed");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef2f6] px-4 sm:px-6 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <button
          onClick={() => navigate("/admin-dashboard")}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:text-[#2f87d9] sm:px-4 sm:py-2 sm:text-sm"
        >
          <FiArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
            Bulk Academic Update
          </h1>
          <p className="text-slate-600">
            Update existing students in bulk by selecting records from the list.
            Apply branch, year, and semester in one action instead of editing
            each student individually.
          </p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 text-green-700 px-4 py-2 rounded">
            {success}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Search Students
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by PRN, name, email, or branch"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                New Branch
              </label>
              <select
                value={bulkBranch}
                onChange={(e) => setBulkBranch(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">No Change</option>
                {BRANCHES.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                New Year
              </label>
              <select
                value={bulkYear}
                onChange={(e) => setBulkYear(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">No Change</option>
                {YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year} Year
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                New Semester
              </label>
              <select
                value={bulkSemester}
                onChange={(e) => setBulkSemester(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">No Change</option>
                {SEMESTERS.map((semester) => (
                  <option key={semester} value={semester}>
                    Semester {semester}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadStudents}
                disabled={isLoadingStudents}
                className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center justify-center"
              >
                <FiRefreshCw className="mr-2" />
                {isLoadingStudents ? "Loading..." : "Refresh"}
              </button>
              <button
                onClick={handleApply}
                disabled={isUpdating || selectedPrns.size === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg"
              >
                {isUpdating ? "Updating..." : "Apply"}
              </button>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-slate-50 text-sm">
            Total Students: <strong>{students.length}</strong> | Filtered:{" "}
            <strong>{filteredStudents.length}</strong> | Selected:{" "}
            <strong>{selectedPrns.size}</strong>
          </div>
        </div>

        {filteredStudents.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-3">
              Existing Students
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full text-sm border border-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-2 border-b">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleSelectAllFiltered}
                      />
                    </th>
                    <th className="text-left p-2 border-b">PRN</th>
                    <th className="text-left p-2 border-b">Name</th>
                    <th className="text-left p-2 border-b">Email</th>
                    <th className="text-left p-2 border-b">Branch</th>
                    <th className="text-left p-2 border-b">Year</th>
                    <th className="text-left p-2 border-b">Semester</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => {
                    const prn = getStudentPrn(student);
                    return (
                      <tr key={`${student.id}-${prn}`} className="border-b">
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={selectedPrns.has(prn)}
                            onChange={() => toggleSelectPrn(prn)}
                          />
                        </td>
                        <td className="p-2">{prn || "-"}</td>
                        <td className="p-2">{student.name || "-"}</td>
                        <td className="p-2">{student.email || "-"}</td>
                        <td className="p-2">
                          {student.dept || student.department || "-"}
                        </td>
                        <td className="p-2">{student.year || "-"}</td>
                        <td className="p-2">{student.semester || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredStudents.length === 0 && !isLoadingStudents && (
          <div className="bg-white rounded-xl shadow-md border border-cyan-100 p-5 sm:p-6">
            <p className="text-slate-600">No matching students found.</p>
          </div>
        )}

        {summary && (
          <div className="bg-white rounded-xl shadow-md border border-cyan-100 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-cyan-700">
                Update Summary
              </h2>
              <button
                onClick={() => setSummary(null)}
                className="text-sm text-slate-600 hover:text-gray-900 flex items-center"
              >
                <FiRefreshCw className="mr-1" /> Clear
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
              <div className="bg-blue-50 p-3 rounded">
                Total: <strong>{summary.totalRows}</strong>
              </div>
              <div className="bg-green-50 p-3 rounded">
                Updated: <strong>{summary.updatedCount}</strong>
              </div>
              <div className="bg-amber-50 p-3 rounded">
                Not Found: <strong>{summary.notFoundCount}</strong>
              </div>
              <div className="bg-red-50 p-3 rounded">
                Failed: <strong>{summary.failedCount}</strong>
              </div>
            </div>

            {summary.updatedEntries?.length > 0 && (
              <div className="mb-4 overflow-x-auto">
                <h3 className="text-sm font-semibold text-green-700 mb-2">
                  Updated Students
                </h3>
                <table className="min-w-[760px] w-full text-sm border border-slate-200">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="text-left p-2 border-b">PRN</th>
                      <th className="text-left p-2 border-b">Branch</th>
                      <th className="text-left p-2 border-b">Year</th>
                      <th className="text-left p-2 border-b">Semester</th>
                      <th className="text-left p-2 border-b">
                        Subjects Assigned
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.updatedEntries.map((entry, idx) => (
                      <tr key={`${entry.prn}-${idx}`} className="border-b">
                        <td className="p-2">{entry.prn}</td>
                        <td className="p-2">{entry.branch}</td>
                        <td className="p-2">{entry.year}</td>
                        <td className="p-2">{entry.semester}</td>
                        <td className="p-2">{entry.subjectCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {summary.notFoundEntries?.length > 0 && (
              <div className="mb-4 overflow-x-auto">
                <h3 className="text-sm font-semibold text-amber-700 mb-2">
                  Not Found
                </h3>
                <table className="min-w-[520px] w-full text-sm border border-slate-200">
                  <thead className="bg-amber-50">
                    <tr>
                      <th className="text-left p-2 border-b">PRN</th>
                      <th className="text-left p-2 border-b">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.notFoundEntries.map((entry, idx) => (
                      <tr key={`${entry.prn}-${idx}`} className="border-b">
                        <td className="p-2">{entry.prn || "-"}</td>
                        <td className="p-2">{entry.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {summary.failedEntries?.length > 0 && (
              <div className="overflow-x-auto">
                <h3 className="text-sm font-semibold text-red-700 mb-2">
                  Failed Updates
                </h3>
                <table className="min-w-[520px] w-full text-sm border border-slate-200">
                  <thead className="bg-red-50">
                    <tr>
                      <th className="text-left p-2 border-b">PRN</th>
                      <th className="text-left p-2 border-b">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.failedEntries.map((entry, idx) => (
                      <tr
                        key={`${entry.prn || idx}-${idx}`}
                        className="border-b"
                      >
                        <td className="p-2">{entry.prn || "-"}</td>
                        <td className="p-2">{entry.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
