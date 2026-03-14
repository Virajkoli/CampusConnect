import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiUpload,
  FiCheckCircle,
  FiAlertTriangle,
} from "react-icons/fi";
import { auth } from "../../firebase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function BulkStudentOnboarding() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [parsedEntries, setParsedEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [precheck, setPrecheck] = useState(null);
  const [isPrechecking, setIsPrechecking] = useState(false);
  const [duplicateStrategy, setDuplicateStrategy] = useState("skip");

  const downloadManualCredentialsCsv = () => {
    const rows = summary?.manualCredentialEntries || [];
    if (!rows.length) return;

    const headers = [
      "name",
      "prn",
      "phone",
      "branch",
      "year",
      "contactEmail",
      "loginId",
      "systemEmail",
      "password",
      "reason",
    ];

    const escapeCsv = (value) => {
      const str = String(value ?? "");
      if (str.includes(",") || str.includes("\n") || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => headers.map((h) => escapeCsv(row[h])).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "manual-credential-delivery.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const validationPreview = useMemo(() => {
    const valid = parsedEntries.filter(
      (e) => !e.validationErrors?.length,
    ).length;
    const invalid = parsedEntries.length - valid;
    return { valid, invalid, total: parsedEntries.length };
  }, [parsedEntries]);

  const parseFile = async () => {
    setError("");
    setSuccess("");
    setSummary(null);
    setPrecheck(null);
    if (!file) {
      setError("Please choose a PDF or image file");
      return;
    }

    setIsParsing(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate("/auth/admin");
        return;
      }

      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_URL}/api/admin/parse-student-onboarding`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to parse file");
      }

      setParsedEntries(data.entries || []);
      setSuccess(
        `Parsed ${data.entries?.length || 0} row(s). Review and continue.`,
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const runPrecheck = async () => {
    setError("");
    setSuccess("");
    setSummary(null);

    if (parsedEntries.length === 0) {
      setError("Parse a file first before pre-check");
      return;
    }

    setIsPrechecking(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate("/auth/admin");
        return;
      }
      const token = await user.getIdToken();

      const response = await fetch(
        `${API_URL}/api/admin/precheck-student-onboarding`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ students: parsedEntries }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Pre-check failed");
      }

      setPrecheck(data.precheck || null);
      setSuccess(
        "Pre-check completed. Review duplicates before creating accounts.",
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setIsPrechecking(false);
    }
  };

  const createAccounts = async () => {
    setError("");
    setSuccess("");
    setSummary(null);

    if (parsedEntries.length === 0) {
      setError("Please parse a file first");
      return;
    }

    setIsCreating(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate("/auth/admin");
        return;
      }
      const token = await user.getIdToken();

      const response = await fetch(
        `${API_URL}/api/admin/bulk-onboard-students`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            students: parsedEntries,
            duplicateStrategy,
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Bulk onboarding failed");
      }

      setSummary(data.summary);
      setSuccess("Bulk onboarding completed. Check summary below.");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 sm:px-6 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <button
          onClick={() => navigate("/admin-dashboard")}
          className="flex items-center text-red-600 hover:text-green-900 transition-colors"
        >
          <FiArrowLeft className="mr-2" /> Go Back
        </button>

        <div className="bg-white rounded-xl shadow-md border border-indigo-100 p-5 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-indigo-700 mb-2">
            Bulk Student Onboarding
          </h1>
          <p className="text-gray-600">
            Upload final admission list (CSV/PDF/image), parse with OCR or CSV
            parser, validate entries, and auto-create student accounts with
            branch/year subject assignment.
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

        <div className="bg-white rounded-xl shadow-md border border-indigo-100 p-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admission List File
              </label>
              <input
                type="file"
                accept=".csv,text/csv,application/pdf,image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full border rounded-lg px-3 py-2"
              />
              <p className="text-xs text-gray-500 mt-2">
                Recommended: CSV with columns Name, PRN, Mobile, Branch, Year,
                Email. PDF/image parsing depends on document clarity.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Existing PRN Strategy
              </label>
              <select
                value={duplicateStrategy}
                onChange={(e) => setDuplicateStrategy(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="skip">
                  Skip existing (mark as already enrolled)
                </option>
                <option value="update">Update existing student profile</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={runPrecheck}
                disabled={isPrechecking || parsedEntries.length === 0}
                className="flex-1 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg"
              >
                {isPrechecking ? "Pre-checking..." : "Pre-check"}
              </button>
              <button
                onClick={parseFile}
                disabled={isParsing}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center justify-center"
              >
                <FiUpload className="mr-2" />{" "}
                {isParsing ? "Parsing..." : "Parse File"}
              </button>
              <button
                onClick={createAccounts}
                disabled={isCreating || parsedEntries.length === 0}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                {isCreating ? "Creating..." : "Create Accounts"}
              </button>
            </div>
          </div>

          {parsedEntries.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-gray-50 text-sm">
              Parsed: <strong>{validationPreview.total}</strong> | Valid:{" "}
              <strong className="text-green-700">
                {validationPreview.valid}
              </strong>{" "}
              | Invalid:{" "}
              <strong className="text-red-700">
                {validationPreview.invalid}
              </strong>
            </div>
          )}
        </div>

        {parsedEntries.length > 0 && (
          <div className="bg-white rounded-xl shadow-md border border-indigo-100 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-indigo-700 mb-3">
              Parsed Entries
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full text-sm border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2 border-b">Name</th>
                    <th className="text-left p-2 border-b">PRN</th>
                    <th className="text-left p-2 border-b">Phone</th>
                    <th className="text-left p-2 border-b">Branch</th>
                    <th className="text-left p-2 border-b">Year</th>
                    <th className="text-left p-2 border-b">Contact Email</th>
                    <th className="text-left p-2 border-b">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedEntries.map((entry, idx) => {
                    const hasErrors = entry.validationErrors?.length > 0;
                    return (
                      <tr
                        key={`${entry.prn || "row"}-${idx}`}
                        className="border-b"
                      >
                        <td className="p-2">{entry.name || "-"}</td>
                        <td className="p-2">{entry.prn || "-"}</td>
                        <td className="p-2">{entry.phone || "-"}</td>
                        <td className="p-2">{entry.branch || "-"}</td>
                        <td className="p-2">{entry.year || "-"}</td>
                        <td className="p-2">{entry.email || "-"}</td>
                        <td className="p-2">
                          {hasErrors ? (
                            <span className="inline-flex items-start text-red-700">
                              <FiAlertTriangle className="mr-1 mt-0.5" />{" "}
                              {entry.validationErrors.join(", ")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-green-700">
                              <FiCheckCircle className="mr-1" /> Valid
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {precheck && (
          <div className="bg-white rounded-xl shadow-md border border-indigo-100 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-indigo-700 mb-3">
              Database Pre-check
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="bg-blue-50 p-3 rounded">
                Rows: <strong>{precheck.totalRows}</strong>
              </div>
              <div className="bg-red-50 p-3 rounded">
                Duplicate in DB: <strong>{precheck.duplicateDbCount}</strong>
              </div>
              <div className="bg-amber-50 p-3 rounded">
                Duplicate in File:{" "}
                <strong>{precheck.duplicateFileCount}</strong>
              </div>
            </div>
            {precheck.duplicateInDb?.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-[820px] w-full text-sm border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2 border-b">PRN</th>
                      <th className="text-left p-2 border-b">Name in Upload</th>
                      <th className="text-left p-2 border-b">Existing UID</th>
                      <th className="text-left p-2 border-b">Existing Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {precheck.duplicateInDb.map((row, idx) => (
                      <tr key={`${row.prn || idx}-${idx}`} className="border-b">
                        <td className="p-2">{row.prn || "-"}</td>
                        <td className="p-2">{row.name || "-"}</td>
                        <td className="p-2">{row.existingUid || "-"}</td>
                        <td className="p-2">{row.existingEmail || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {summary && (
          <div className="bg-white rounded-xl shadow-md border border-indigo-100 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-indigo-700 mb-3">
              Onboarding Summary
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 mb-4">
              <div className="bg-blue-50 p-3 rounded">
                Processed: <strong>{summary.totalProcessed}</strong>
              </div>
              <div className="bg-green-50 p-3 rounded">
                Created: <strong>{summary.createdCount}</strong>
              </div>
              <div className="bg-indigo-50 p-3 rounded">
                Updated: <strong>{summary.updatedCount || 0}</strong>
              </div>
              <div className="bg-slate-100 p-3 rounded">
                Already Enrolled:{" "}
                <strong>{summary.skippedExistingCount || 0}</strong>
              </div>
              <div className="bg-yellow-50 p-3 rounded">
                Email Sent: <strong>{summary.credentialsSentCount}</strong>
              </div>
              <div className="bg-red-50 p-3 rounded">
                Failed: <strong>{summary.failedCount}</strong>
              </div>
            </div>

            <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="bg-amber-50 p-3 rounded text-amber-800 text-sm">
                Manual Credential Delivery Needed:{" "}
                <strong>{summary.manualCredentialCount || 0}</strong>
              </div>
              {summary.manualCredentialEntries?.length > 0 && (
                <button
                  onClick={downloadManualCredentialsCsv}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Export Manual Credentials CSV
                </button>
              )}
            </div>

            {summary.failedEntries?.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-[760px] w-full text-sm border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2 border-b">PRN</th>
                      <th className="text-left p-2 border-b">Name</th>
                      <th className="text-left p-2 border-b">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.failedEntries.map((f, idx) => (
                      <tr key={`${f.prn || idx}-${idx}`} className="border-b">
                        <td className="p-2">{f.prn || "-"}</td>
                        <td className="p-2">{f.name || "-"}</td>
                        <td className="p-2 text-red-700">{f.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {summary.manualCredentialEntries?.length > 0 && (
              <div className="mt-6 overflow-x-auto">
                <h3 className="text-md font-semibold text-amber-700 mb-2">
                  Students Needing Manual Credential Sharing
                </h3>
                <table className="min-w-[980px] w-full text-sm border border-gray-200">
                  <thead className="bg-amber-50">
                    <tr>
                      <th className="text-left p-2 border-b">Name</th>
                      <th className="text-left p-2 border-b">PRN</th>
                      <th className="text-left p-2 border-b">Login ID</th>
                      <th className="text-left p-2 border-b">System Email</th>
                      <th className="text-left p-2 border-b">Password</th>
                      <th className="text-left p-2 border-b">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.manualCredentialEntries.map((entry, idx) => (
                      <tr
                        key={`${entry.prn || idx}-${idx}`}
                        className="border-b"
                      >
                        <td className="p-2">{entry.name || "-"}</td>
                        <td className="p-2">{entry.prn || "-"}</td>
                        <td className="p-2">{entry.loginId || "-"}</td>
                        <td className="p-2">{entry.systemEmail || "-"}</td>
                        <td className="p-2">{entry.password || "-"}</td>
                        <td className="p-2 text-amber-800">
                          {entry.reason || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {summary.skippedExistingEntries?.length > 0 && (
              <div className="mt-6 overflow-x-auto">
                <h3 className="text-md font-semibold text-slate-700 mb-2">
                  Already Enrolled (Skipped)
                </h3>
                <table className="min-w-[760px] w-full text-sm border border-gray-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left p-2 border-b">PRN</th>
                      <th className="text-left p-2 border-b">Name</th>
                      <th className="text-left p-2 border-b">Existing Email</th>
                      <th className="text-left p-2 border-b">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.skippedExistingEntries.map((entry, idx) => (
                      <tr
                        key={`${entry.prn || idx}-${idx}`}
                        className="border-b"
                      >
                        <td className="p-2">{entry.prn || "-"}</td>
                        <td className="p-2">{entry.name || "-"}</td>
                        <td className="p-2">{entry.existingEmail || "-"}</td>
                        <td className="p-2">{entry.reason || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {summary.updatedEntries?.length > 0 && (
              <div className="mt-6 overflow-x-auto">
                <h3 className="text-md font-semibold text-indigo-700 mb-2">
                  Existing Students Updated
                </h3>
                <table className="min-w-[760px] w-full text-sm border border-gray-200">
                  <thead className="bg-indigo-50">
                    <tr>
                      <th className="text-left p-2 border-b">PRN</th>
                      <th className="text-left p-2 border-b">Name</th>
                      <th className="text-left p-2 border-b">Existing UID</th>
                      <th className="text-left p-2 border-b">Existing Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.updatedEntries.map((entry, idx) => (
                      <tr
                        key={`${entry.prn || idx}-${idx}`}
                        className="border-b"
                      >
                        <td className="p-2">{entry.prn || "-"}</td>
                        <td className="p-2">{entry.name || "-"}</td>
                        <td className="p-2">{entry.existingUid || "-"}</td>
                        <td className="p-2">{entry.existingEmail || "-"}</td>
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
