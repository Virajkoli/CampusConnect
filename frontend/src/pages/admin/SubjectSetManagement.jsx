import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiSave, FiRefreshCw, FiBookOpen } from "react-icons/fi";
import { auth } from "../../firebase";
import {
  BRANCHES,
  YEARS,
  DEFAULT_SUBJECT_SETS,
} from "../../utils/branchYearSubjects";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function SubjectSetManagement() {
  const navigate = useNavigate();
  const [subjectSets, setSubjectSets] = useState(DEFAULT_SUBJECT_SETS);
  const [selectedBranch, setSelectedBranch] = useState(BRANCHES[0]);
  const [selectedYear, setSelectedYear] = useState(YEARS[0]);
  const [subjectText, setSubjectText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedSubjects = useMemo(() => {
    return subjectSets?.[selectedBranch]?.[selectedYear] || [];
  }, [subjectSets, selectedBranch, selectedYear]);

  useEffect(() => {
    setSubjectText(selectedSubjects.join("\n"));
  }, [selectedSubjects]);

  const fetchSubjectSets = async () => {
    setLoading(true);
    setError("");
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate("/auth/admin");
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/admin/subject-sets`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to load subject sets");
      }
      setSubjectSets(data.subjectSets || DEFAULT_SUBJECT_SETS);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjectSets();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate("/auth/admin");
        return;
      }

      const subjects = subjectText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      if (subjects.length === 0) {
        throw new Error("At least one subject is required");
      }

      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/admin/subject-sets`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          branch: selectedBranch,
          year: selectedYear,
          subjects,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to save subject set");
      }

      setSubjectSets(data.subjectSets || subjectSets);
      setMessage("Subject set saved successfully");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 px-4 sm:px-6 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <button
          onClick={() => navigate("/admin-dashboard")}
          className="flex items-center text-red-600 hover:text-green-900 transition-colors"
        >
          <FiArrowLeft className="mr-2" /> Go Back
        </button>

        <div className="bg-white rounded-xl shadow-md border border-indigo-100 p-5 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-indigo-700 mb-2 flex items-center">
            <FiBookOpen className="mr-3" /> Subject Set Management
          </h1>
          <p className="text-gray-600">
            Manage centralized subjects for each branch and year. These sets are
            used for both student onboarding and teacher course assignment
            consistency.
          </p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded">
            {error}
          </div>
        )}
        {message && (
          <div className="bg-green-100 text-green-700 px-4 py-2 rounded">
            {message}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md border border-indigo-100 p-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Branch
              </label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                {BRANCHES.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year} Year
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={fetchSubjectSets}
                disabled={loading}
                className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg"
              >
                <FiRefreshCw className="mr-2" />{" "}
                {loading ? "Refreshing..." : "Refresh"}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
              >
                <FiSave className="mr-2" /> {saving ? "Saving..." : "Save Set"}
              </button>
            </div>
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subjects for {selectedBranch} - {selectedYear} Year (one per line)
          </label>
          <textarea
            className="w-full min-h-[220px] border rounded-lg px-3 py-2"
            value={subjectText}
            onChange={(e) => setSubjectText(e.target.value)}
            placeholder="Enter one subject per line"
          />
        </div>

        <div className="bg-white rounded-xl shadow-md border border-indigo-100 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-indigo-700 mb-4">
            Current Subject Matrix
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-sm border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 border-b">Branch</th>
                  <th className="text-left p-3 border-b">1st</th>
                  <th className="text-left p-3 border-b">2nd</th>
                  <th className="text-left p-3 border-b">3rd</th>
                  <th className="text-left p-3 border-b">4th</th>
                </tr>
              </thead>
              <tbody>
                {BRANCHES.map((branch) => (
                  <tr key={branch} className="align-top">
                    <td className="p-3 border-b font-medium">{branch}</td>
                    {YEARS.map((year) => (
                      <td
                        key={`${branch}-${year}`}
                        className="p-3 border-b text-xs text-gray-600"
                      >
                        {(subjectSets?.[branch]?.[year] || []).join(", ") ||
                          "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
