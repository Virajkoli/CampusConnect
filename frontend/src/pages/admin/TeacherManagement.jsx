import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import Button from "../../components/common/Button";
import { firestore } from "../../firebase";
import { FiRefreshCw, FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import {
  BRANCHES as departments,
  YEARS as years,
} from "../../utils/branchYearSubjects";

const JOB_PROFILES = [
  "Permanent Faculty",
  "Adjunct Faculty",
  "Visiting Faculty",
];

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    employeeId: "",
    jobProfile: "",
    department: "",
    assignments: [],
  });
  const [currentBranch, setCurrentBranch] = useState("");
  const [currentYear, setCurrentYear] = useState("");
  const [currentSubjects, setCurrentSubjects] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchTeachers = async () => {
    try {
      const collectionRef = collection(firestore, "teachers");
      const snapshot = await getDocs(collectionRef);
      const teacherList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTeachers(teacherList);
      setFilteredTeachers(teacherList);
      if (teacherList.length === 0) {
        setError("No teachers found in the database");
      } else {
        setError("");
      }
    } catch (error) {
      setError("Failed to fetch teachers: " + error.message);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    const filtered = teachers.filter(
      (teacher) =>
        teacher.name?.toLowerCase()?.includes(search.toLowerCase()) ||
        teacher.employeeId?.includes(search) ||
        teacher.mobile?.includes(search) ||
        teacher.email?.toLowerCase()?.includes(search.toLowerCase()),
    );
    setFilteredTeachers(filtered);
  }, [search, teachers]);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateMobile = (mobile) => {
    const digits = String(mobile || "").replace(/\D/g, "");
    return digits.length === 10;
  };

  const normalizeLegacyAssignments = (teacher) => {
    if (Array.isArray(teacher.assignments) && teacher.assignments.length > 0) {
      return teacher.assignments;
    }

    if (
      Array.isArray(teacher.assignedCourses) &&
      teacher.assignedCourses.length > 0
    ) {
      const branch = teacher.department || teacher.dept || "";
      return teacher.assignedCourses
        .map((course) => ({
          branch,
          year: course.year,
          subjects: Array.isArray(course.subjects) ? course.subjects : [],
        }))
        .filter(
          (assignment) =>
            assignment.branch &&
            assignment.year &&
            assignment.subjects.length > 0,
        );
    }

    return [];
  };

  const handleEdit = async (teacher) => {
    setFormData({
      name: teacher.name || "",
      email: teacher.email || "",
      mobile: teacher.mobile || teacher.phone || "",
      employeeId: teacher.employeeId || "",
      jobProfile: teacher.jobProfile || "",
      department: teacher.department || teacher.dept || "",
      assignments: normalizeLegacyAssignments(teacher),
    });
    setCurrentBranch("");
    setCurrentYear("");
    setCurrentSubjects([]);
    setAvailableSubjects([]);
    setIsEditing(true);
    setEditId(teacher.id);
    setShowForm(true);
    setError("");
  };

  const loadAvailableSubjects = async (branch, year) => {
    if (!branch || !year) {
      setAvailableSubjects([]);
      return;
    }

    setLoadingSubjects(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/subjects?department=${encodeURIComponent(branch)}&year=${encodeURIComponent(year)}`,
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to load subjects.");
      }
      setAvailableSubjects(Array.isArray(data.subjects) ? data.subjects : []);
    } catch (error) {
      setAvailableSubjects([]);
      setError(error.message);
    } finally {
      setLoadingSubjects(false);
    }
  };

  useEffect(() => {
    loadAvailableSubjects(currentBranch, currentYear);
  }, [currentBranch, currentYear]);

  const handleAddYearSubjects = () => {
    if (!currentBranch || !currentYear || currentSubjects.length === 0) {
      setError("Please select branch, year and at least one subject.");
      return;
    }

    const existingIndex = formData.assignments.findIndex(
      (assignment) =>
        assignment.branch === currentBranch && assignment.year === currentYear,
    );

    let updatedAssignments = [...formData.assignments];
    if (existingIndex >= 0) {
      const mergedSubjects = [
        ...new Set([
          ...updatedAssignments[existingIndex].subjects,
          ...currentSubjects,
        ]),
      ];
      updatedAssignments[existingIndex] = {
        ...updatedAssignments[existingIndex],
        subjects: mergedSubjects,
      };
    } else {
      updatedAssignments = [
        ...updatedAssignments,
        {
          branch: currentBranch,
          year: currentYear,
          subjects: currentSubjects,
        },
      ];
    }

    setFormData({ ...formData, assignments: updatedAssignments });

    setCurrentBranch("");
    setCurrentYear("");
    setCurrentSubjects([]);
    setAvailableSubjects([]);
    setError("");
  };

  const handleRemoveAssignment = (indexToRemove) => {
    const updatedAssignments = formData.assignments.filter(
      (_, index) => index !== indexToRemove,
    );
    setFormData({ ...formData, assignments: updatedAssignments });
  };

  const handleSubjectChange = (subject, isChecked) => {
    if (isChecked) {
      setCurrentSubjects([...currentSubjects, subject]);
    } else {
      setCurrentSubjects(currentSubjects.filter((s) => s !== subject));
    }
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    setIsLoading(true);
    try {
      if (!validateEmail(formData.email)) {
        throw new Error("Invalid email address.");
      }

      if (!validateMobile(formData.mobile)) {
        throw new Error("Mobile number must contain exactly 10 digits.");
      }

      if (
        !formData.name ||
        !formData.jobProfile ||
        !formData.department ||
        formData.assignments.length === 0
      ) {
        throw new Error(
          "Please fill all required fields and assign at least one branch-year with subjects.",
        );
      }

      if (isEditing && editId) {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/teachers/${editId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fullName: formData.name,
              email: formData.email,
              mobile: formData.mobile,
              jobProfile: formData.jobProfile,
              department: formData.department,
              assignments: formData.assignments,
            }),
          },
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to update teacher.");
        }

        setSuccess(
          `Teacher updated successfully${data?.teacher?.teacherId ? ` (ID: ${data.teacher.teacherId})` : ""}!`,
        );
        setFormData((prev) => ({
          ...prev,
          employeeId: data?.teacher?.teacherId || prev.employeeId,
        }));
      } else {
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:5000"
          }/api/createTeacher`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fullName: formData.name,
              email: formData.email,
              mobile: formData.mobile,
              jobProfile: formData.jobProfile,
              department: formData.department,
              assignments: formData.assignments,
            }),
          },
        );

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to create teacher.");
        }

        setSuccess(
          `Teacher created successfully${data?.teacher?.teacherId ? ` (ID: ${data.teacher.teacherId})` : ""}${data?.credentials?.loginId ? ` | Login ID: ${data.credentials.loginId}` : ""}${data?.credentials?.password ? ` | Password: ${data.credentials.password}` : ""}`,
        );
      }

      setFormData({
        name: "",
        email: "",
        mobile: "",
        employeeId: "",
        jobProfile: "",
        department: "",
        assignments: [],
      });
      setCurrentBranch("");
      setCurrentYear("");
      setCurrentSubjects([]);
      setAvailableSubjects([]);
      setEditId(null);
      setIsEditing(false);
      setShowForm(false);
      await fetchTeachers();
    } catch (error) {
      setError("Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this teacher?")) {
      try {
        const docRef = doc(firestore, "teachers", id);
        await deleteDoc(docRef);

        setTeachers((prev) => prev.filter((t) => t.id !== id));
        setFilteredTeachers((prev) => prev.filter((t) => t.id !== id));
        setSuccess("Teacher deleted successfully!");
      } catch (error) {
        setError("Failed to delete teacher: " + error.message);
      }
    }
  };

  const navigate = useNavigate();

  const sortedTeachers = useMemo(() => {
    return [...filteredTeachers].sort((a, b) => {
      const deptA = String(a.department || a.dept || "").toLowerCase();
      const deptB = String(b.department || b.dept || "").toLowerCase();
      if (deptA !== deptB) {
        return deptA.localeCompare(deptB);
      }

      const nameA = String(a.name || "").toLowerCase();
      const nameB = String(b.name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [filteredTeachers]);

  return (
    <div className="min-h-screen bg-[#eef2f6] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 text-slate-800">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate("/admin-dashboard")}
            className="mb-1 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:text-[#2f87d9] sm:px-4 sm:py-2 sm:text-sm"
          >
            <FiArrowLeft className="h-4 w-4" /> Back to Dashboard
          </button>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
          Teacher Management Panel
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 border border-red-300 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 text-green-700 border border-green-300 px-4 py-2 rounded mb-4">
            {success}
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3 mb-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
            <input
              type="text"
              placeholder="🔍 Search teacher by name, email or ID"
              className="flex-grow border border-gray-300 rounded px-4 py-2 shadow-sm focus:outline-none focus:ring focus:border-indigo-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button onClick={fetchTeachers}>
              <FiRefreshCw className="inline mr-2" />
              Refresh
            </Button>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="w-full sm:w-auto lg:ml-4"
          >
            {showForm ? "Close Form" : "Add Teacher"}
          </Button>
        </div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded shadow-lg p-6 mb-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="border px-3 py-2 rounded w-full"
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="border px-3 py-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="Mobile Number"
                value={formData.mobile}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mobile: e.target.value.replace(/[^\d]/g, "").slice(0, 10),
                  })
                }
                className="border px-3 py-2 rounded w-full"
              />
              <select
                value={formData.jobProfile}
                onChange={(e) =>
                  setFormData({ ...formData, jobProfile: e.target.value })
                }
                className="border px-3 py-2 rounded w-full"
              >
                <option value="">Select Job Profile</option>
                {JOB_PROFILES.map((jobProfile) => (
                  <option key={jobProfile} value={jobProfile}>
                    {jobProfile}
                  </option>
                ))}
              </select>
              <select
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                className="border px-3 py-2 rounded w-full"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Teacher ID (Auto Generated)"
                value={formData.employeeId || "Auto-generated after save"}
                readOnly
                className="border px-3 py-2 rounded w-full bg-slate-100 text-slate-600"
              />
            </div>

            {formData.department && (
              <div className="border-t pt-4 mb-6">
                <h3 className="text-lg font-semibold mb-3">
                  Assign Teaching Load
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <select
                    value={currentBranch}
                    onChange={(e) => {
                      setCurrentBranch(e.target.value);
                      setCurrentSubjects([]);
                    }}
                    className="border px-3 py-2 rounded w-full"
                  >
                    <option value="">Select Branch</option>
                    {departments.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>

                  <select
                    value={currentYear}
                    onChange={(e) => {
                      setCurrentYear(e.target.value);
                      setCurrentSubjects([]);
                    }}
                    className="border px-3 py-2 rounded w-full"
                  >
                    <option value="">Select Year</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year} Year
                      </option>
                    ))}
                  </select>

                  <Button
                    variant="outline"
                    onClick={handleAddYearSubjects}
                    disabled={
                      !currentBranch ||
                      !currentYear ||
                      currentSubjects.length === 0
                    }
                  >
                    Add Assignment
                  </Button>
                </div>

                {currentBranch && currentYear && (
                  <div className="mb-4 border p-4 rounded bg-slate-50">
                    <h4 className="font-medium mb-2">
                      Select Subjects for {currentBranch} - {currentYear} Year:
                    </h4>
                    {loadingSubjects ? (
                      <p className="text-sm text-slate-500">
                        Loading subjects...
                      </p>
                    ) : availableSubjects.length === 0 ? (
                      <p className="text-sm text-red-500">
                        No subjects found for the selected branch and year.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {availableSubjects.map((subject) => (
                          <label
                            key={subject}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              value={subject}
                              checked={currentSubjects.includes(subject)}
                              onChange={(e) =>
                                handleSubjectChange(subject, e.target.checked)
                              }
                              className="form-checkbox h-5 w-5 text-[#2f87d9]"
                            />
                            <span>{subject}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {formData.assignments.length > 0 && (
                  <div className="mb-4 border p-4 rounded bg-blue-50">
                    <h4 className="font-medium mb-2">Current Assignments:</h4>
                    <div className="space-y-4">
                      {formData.assignments.map((assignment, idx) => (
                        <label
                          key={`${assignment.branch}-${assignment.year}-${idx}`}
                          className="block border-b pb-2"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold">
                              {assignment.branch} - {assignment.year} Year
                            </span>
                            <button
                              onClick={() => handleRemoveAssignment(idx)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="pl-4">
                            <span className="text-sm">Subjects: </span>
                            <span className="text-sm font-medium">
                              {assignment.subjects.join(", ")}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4">
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading
                  ? "Saving..."
                  : isEditing
                    ? "Update Teacher"
                    : "Add Teacher"}
              </Button>
            </div>
          </motion.div>
        )}

        <motion.div
          className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200/80 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4, type: "spring", stiffness: 120 }}
        >
          <div className="overflow-x-auto rounded-lg border border-slate-200/80">
            <table className="w-full text-sm divide-y divide-gray-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-2 text-left font-semibold text-slate-600">
                    Name
                  </th>
                  <th className="p-2 text-left font-semibold text-slate-600">
                    Mobile
                  </th>
                  <th className="p-2 text-left font-semibold text-slate-600">
                    Email
                  </th>
                  <th className="p-2 text-left font-semibold text-slate-600">
                    Department
                  </th>
                  <th className="p-2 text-left font-semibold text-slate-600">
                    Teacher ID
                  </th>
                  <th className="p-2 text-left font-semibold text-slate-600">
                    Job Profile
                  </th>
                  <th className="p-2 text-center font-semibold text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedTeachers.length > 0 ? (
                  sortedTeachers.map((teacher) => (
                    <tr
                      key={teacher.id}
                      className="border-b hover:bg-slate-50 transition"
                    >
                      <td className="p-2 whitespace-nowrap">{teacher.name}</td>
                      <td className="p-2 whitespace-nowrap">
                        {teacher.mobile || teacher.phone || "-"}
                      </td>
                      <td className="p-2 whitespace-nowrap">{teacher.email}</td>
                      <td className="p-2 whitespace-nowrap">
                        {teacher.department || teacher.dept || "-"}
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        {teacher.teacherId || teacher.employeeId || "-"}
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        {teacher.jobProfile || "-"}
                      </td>
                      <td className="p-2">
                        <div className="flex justify-center items-center gap-2">
                          <Button
                            variant="outline"
                            onClick={() => handleEdit(teacher)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleDelete(teacher.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center p-6 text-slate-500">
                      No teachers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TeacherManagement;
