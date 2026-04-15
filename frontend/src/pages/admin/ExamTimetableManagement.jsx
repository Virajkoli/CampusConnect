import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUpload,
  FiTrash2,
  FiSave,
  FiEdit2,
  FiPlus,
  FiX,
  FiFileText,
  FiCalendar,
  FiAlertCircle,
  FiCheck,
  FiEye,
  FiArrowLeft,
  FiRefreshCw,
} from "react-icons/fi";
import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useNavigate } from "react-router-dom";

const API_URL = String(import.meta.env.VITE_API_URL || "http://localhost:5000")
  .trim()
  .replace(/\/+$/, "");

const buildRequestError = (response, rawText = "") => {
  const text = String(rawText || "").trim();
  if (text.startsWith("<")) {
    return `Server returned HTML instead of JSON (HTTP ${response.status}). Check VITE_API_URL and backend deployment.`;
  }

  return (
    text ||
    `Request failed with status ${response.status}${response.statusText ? ` (${response.statusText})` : ""}.`
  );
};

const parseJsonResponse = async (response) => {
  const rawText = await response.text();
  let data = {};

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error(buildRequestError(response, rawText));
    }
  }

  if (!response.ok) {
    throw new Error(data.message || buildRequestError(response, rawText));
  }

  return data;
};

const fetchWithNetworkHint = async (url, options) => {
  try {
    return await fetch(url, options);
  } catch {
    throw new Error(
      `Unable to reach backend at ${API_URL}. Check deployment env VITE_API_URL and backend availability.`,
    );
  }
};

const YEARS = ["1st", "2nd", "3rd", "4th"];
const BRANCH_OPTIONS = [
  "Civil",
  "Computer",
  "Electrical",
  "E&TC",
  "Instrumentation",
  "Mechanical",
  "Information Technology",
];

const DAY_PATTERN =
  /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i;
const DATE_PATTERN = /(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/;
const TIME_PATTERN =
  /(\d{1,2}:\d{2}\s*(?:am|pm)?\s*(?:to|-|–)\s*\d{1,2}:\d{2}\s*(?:am|pm)?)/i;
const COURSE_PATTERN = /^([A-Z]{2,4}\s?\d{3,4}[A-Z]{0,2})\s*[-–—:]\s*(.+)$/i;
const COURSE_SPLIT_PATTERN = /(?=[A-Z]{2,4}\s?\d{3,4}[A-Z]{0,2}\s*[-–—:])/g;
const BRANCH_PREFIX_PATTERN =
  /^(Civil|Computer|Electrical|E\s*&\s*T\s*&\s*C|E&TC|Instrumentation|Mechanical|Information\s+Technology|IT)\b\s*(.*)$/i;

const normalizeYearToken = (value = "") =>
  String(value || "").replace(/[^0-9]/g, "");

const parseExamDate = (dateStr = "") => {
  const raw = String(dateStr || "").trim();
  if (!raw) {
    return null;
  }

  const dmy = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]) - 1;
    const year = Number(dmy[3]);
    return new Date(year < 100 ? 2000 + year : year, month, day);
  }

  const iso = raw.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
  if (iso) {
    return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeDateString = (rawDate = "") => {
  const parsed = parseExamDate(rawDate);
  if (!parsed) {
    return String(rawDate || "").trim();
  }
  const dd = String(parsed.getDate()).padStart(2, "0");
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const yyyy = String(parsed.getFullYear());
  return `${dd}-${mm}-${yyyy}`;
};

const normalizeBranchName = (branchRaw = "") => {
  const value = String(branchRaw || "")
    .trim()
    .toLowerCase();

  if (!value) return "";
  if (value === "it" || value.includes("information"))
    return "Information Technology";
  if (value.includes("civil")) return "Civil";
  if (value.includes("computer")) return "Computer";
  if (value.includes("electrical")) return "Electrical";
  if (value.includes("instrument")) return "Instrumentation";
  if (value.includes("mechanical")) return "Mechanical";
  if (
    value.includes("e&tc") ||
    value.includes("entc") ||
    value.includes("electronics")
  ) {
    return "E&TC";
  }

  return branchRaw;
};

const getWeekdayFromDate = (rawDate = "") => {
  const parsed = parseExamDate(rawDate);
  if (!parsed) {
    return "";
  }
  return parsed.toLocaleDateString("en-US", { weekday: "long" });
};

const parseTimetableText = (text = "", selectedYear = "4th") => {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const exams = [];
  let currentDay = "";
  let currentDate = "";
  let currentTime = "";
  let currentBranch = "";

  lines.forEach((line) => {
    const dayMatch = line.match(DAY_PATTERN);
    const dateMatch = line.match(DATE_PATTERN);
    const timeMatch = line.match(TIME_PATTERN);

    if (dayMatch || dateMatch || timeMatch) {
      if (dayMatch) {
        currentDay = dayMatch[1];
      }
      if (dateMatch) {
        currentDate = normalizeDateString(dateMatch[1]);
      }
      if (timeMatch) {
        currentTime = timeMatch[1].replace(/\s+/g, " ").trim();
      }

      if (dateMatch || timeMatch) {
        currentBranch = "";
      }

      if (!line.match(/[A-Z]{2,4}\s?\d{3,4}[A-Z]{0,2}\s*[-–—:]/)) {
        return;
      }
    }

    let remaining = line;
    const branchMatch = line.match(BRANCH_PREFIX_PATTERN);
    if (branchMatch) {
      currentBranch = normalizeBranchName(branchMatch[1]);
      remaining = String(branchMatch[2] || "").trim();
    }

    if (
      !remaining ||
      !/[A-Z]{2,4}\s?\d{3,4}[A-Z]{0,2}\s*[-–—:]/.test(remaining)
    ) {
      return;
    }

    if (!currentDate || !currentTime) {
      return;
    }

    const courseSegments = remaining
      .split(COURSE_SPLIT_PATTERN)
      .map((segment) => segment.trim())
      .filter(Boolean);

    courseSegments.forEach((segment) => {
      const courseMatch = segment.match(COURSE_PATTERN);
      if (!courseMatch) {
        return;
      }

      const code = String(courseMatch[1] || "")
        .replace(/\s+/g, "")
        .toUpperCase();
      const name = String(courseMatch[2] || "").trim();
      if (!code || !name) {
        return;
      }

      exams.push({
        day: currentDay || getWeekdayFromDate(currentDate),
        date: currentDate,
        time: currentTime,
        branch: currentBranch,
        courseCode: code,
        courseName: name,
        duration: "3 hours",
        year: selectedYear,
      });
    });
  });

  const deduped = [];
  const seen = new Set();

  exams.forEach((exam) => {
    const key = [
      String(exam.date || "").trim(),
      String(exam.time || "").trim(),
      String(exam.branch || "")
        .trim()
        .toLowerCase(),
      String(exam.courseCode || "")
        .trim()
        .toUpperCase(),
    ].join("|");

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    deduped.push(exam);
  });

  return deduped;
};

export default function ExamTimetableManagement() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("upload");
  const [selectedYear, setSelectedYear] = useState("4th");

  const [ocrFile, setOcrFile] = useState(null);
  const [ocrUploading, setOcrUploading] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [parsedExams, setParsedExams] = useState([]);

  const [existingExams, setExistingExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [selectedExamIds, setSelectedExamIds] = useState([]);

  const [editingExam, setEditingExam] = useState(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const [manualExam, setManualExam] = useState({
    day: "",
    date: "",
    time: "",
    branch: "Computer",
    courseCode: "",
    courseName: "",
    duration: "3 hours",
  });

  const [pdfFile, setPdfFile] = useState(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [uploadedPdfs, setUploadedPdfs] = useState([]);

  const [message, setMessage] = useState({ type: "", text: "" });

  const activePdf = useMemo(
    () =>
      uploadedPdfs.find((item) => item.active !== false) ||
      uploadedPdfs[0] ||
      null,
    [uploadedPdfs],
  );

  useEffect(() => {
    fetchExistingExams();
    fetchUploadedPdfs();
  }, [selectedYear]);

  const fetchExistingExams = async () => {
    setLoadingExams(true);
    try {
      const snapshot = await getDocs(collection(db, "examTimetable"));
      const yearToken = normalizeYearToken(selectedYear);

      const rows = snapshot.docs
        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        .filter((exam) => {
          if (exam?.isActive === false) {
            return false;
          }
          return normalizeYearToken(exam?.year) === yearToken;
        })
        .sort((a, b) => {
          const dateA = parseExamDate(a.date || "");
          const dateB = parseExamDate(b.date || "");
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;

          const dateDiff = dateA.getTime() - dateB.getTime();
          if (dateDiff !== 0) return dateDiff;

          return String(a.time || "").localeCompare(String(b.time || ""));
        });

      setExistingExams(rows);
      setSelectedExamIds((prev) =>
        prev.filter((selectedId) => rows.some((row) => row.id === selectedId)),
      );
    } catch (error) {
      console.error("Error fetching exam timetable:", error);
      setMessage({ type: "error", text: "Failed to fetch exam timetable." });
    } finally {
      setLoadingExams(false);
    }
  };

  const fetchUploadedPdfs = async () => {
    try {
      const snapshot = await getDocs(collection(db, "exam_timetable_files"));
      const yearToken = normalizeYearToken(selectedYear);

      const rows = snapshot.docs
        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        .filter((item) => normalizeYearToken(item.year) === yearToken)
        .sort((a, b) => {
          const aMs = Number(a.createdAt?.seconds || 0);
          const bMs = Number(b.createdAt?.seconds || 0);
          return bMs - aMs;
        });

      setUploadedPdfs(rows);
    } catch (error) {
      console.error("Error fetching uploaded timetable PDFs:", error);
    }
  };

  const handleOcrFileChange = (event) => {
    const selected = event.target.files?.[0] || null;
    if (selected && selected.size > 10 * 1024 * 1024) {
      setMessage({
        type: "error",
        text: "File exceeds 10MB upload limit. Please upload a smaller PDF/image.",
      });
      setOcrFile(null);
      setExtractedText("");
      setParsedExams([]);
      return;
    }

    setOcrFile(selected);
    setExtractedText("");
    setParsedExams([]);
  };

  const handleUploadAndExtract = async () => {
    if (!ocrFile) {
      setMessage({
        type: "error",
        text: "Please choose a PDF/image file first.",
      });
      return;
    }

    setOcrUploading(true);
    setMessage({ type: "", text: "" });

    try {
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken();
      const formData = new FormData();
      formData.append("file", ocrFile);
      formData.append("year", selectedYear);

      const response = await fetchWithNetworkHint(
        `${API_URL}/api/upload-exam-timetable`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data = await parseJsonResponse(response);

      const rawText = String(data.extractedText || "");
      setExtractedText(rawText);

      const rows = parseTimetableText(rawText, selectedYear);
      setParsedExams(rows);

      setMessage({
        type: "success",
        text:
          rows.length > 0
            ? `OCR complete. Parsed ${rows.length} exam rows.`
            : "OCR complete. No structured rows parsed automatically; please edit/add rows manually.",
      });
    } catch (error) {
      console.error("OCR upload error:", error);
      setMessage({
        type: "error",
        text: error.message || "OCR upload failed.",
      });
    } finally {
      setOcrUploading(false);
    }
  };

  const updateParsedExam = (index, field, value) => {
    setParsedExams((prev) => {
      const clone = [...prev];
      clone[index] = { ...clone[index], [field]: value };
      return clone;
    });
  };

  const removeParsedExam = (index) => {
    setParsedExams((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
  };

  const addEmptyParsedExam = () => {
    setParsedExams((prev) => [
      ...prev,
      {
        day: "",
        date: "",
        time: "",
        branch: "Computer",
        courseCode: "",
        courseName: "",
        duration: "3 hours",
        year: selectedYear,
      },
    ]);
  };

  const handleSaveParsedExams = async () => {
    if (parsedExams.length === 0) {
      setMessage({ type: "error", text: "No parsed exams to save." });
      return;
    }

    try {
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken();

      const payload = {
        year: selectedYear,
        replaceExisting: true,
        exams: parsedExams.map((exam) => ({
          day: String(exam.day || "").trim() || getWeekdayFromDate(exam.date),
          date: normalizeDateString(exam.date || ""),
          time: String(exam.time || "").trim(),
          branch: normalizeBranchName(exam.branch || ""),
          courseCode: String(exam.courseCode || "")
            .replace(/\s+/g, "")
            .toUpperCase(),
          courseName: String(exam.courseName || "").trim(),
          duration: String(exam.duration || "3 hours").trim(),
          year: selectedYear,
          sourceType: "ocr",
        })),
      };

      const response = await fetchWithNetworkHint(
        `${API_URL}/api/save-exam-timetable`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await parseJsonResponse(response);

      setMessage({
        type: "success",
        text:
          data.message ||
          `Saved ${data.savedCount || 0} exam rows successfully.`,
      });
      setParsedExams([]);
      setExtractedText("");
      setOcrFile(null);
      await fetchExistingExams();
    } catch (error) {
      console.error("Save OCR exams error:", error);
      setMessage({ type: "error", text: error.message || "Save failed." });
    }
  };

  const handleClearYearExams = async () => {
    try {
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken();

      const response = await fetchWithNetworkHint(
        `${API_URL}/api/clear-exam-timetable`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ year: selectedYear }),
        },
      );

      const data = await parseJsonResponse(response);

      setMessage({
        type: "success",
        text: data.message || `Cleared ${data.deletedCount || 0} records.`,
      });
      setShowConfirmClear(false);
      await fetchExistingExams();
    } catch (error) {
      console.error("Clear year timetable error:", error);
      setMessage({ type: "error", text: error.message || "Clear failed." });
    }
  };

  const handleRemoveDuplicates = async () => {
    try {
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken();

      const response = await fetchWithNetworkHint(
        `${API_URL}/api/remove-duplicate-exams`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await parseJsonResponse(response);

      setMessage({
        type: "success",
        text: data.message || "Duplicate cleanup complete.",
      });
      await fetchExistingExams();
    } catch (error) {
      console.error("Remove duplicates error:", error);
      setMessage({
        type: "error",
        text: error.message || "Duplicate cleanup failed.",
      });
    }
  };

  const handleAddManualExam = async () => {
    const required = [
      manualExam.date,
      manualExam.time,
      manualExam.branch,
      manualExam.courseCode,
      manualExam.courseName,
    ].every((field) => String(field || "").trim().length > 0);

    if (!required) {
      setMessage({
        type: "error",
        text: "Please fill all required manual fields.",
      });
      return;
    }

    try {
      await addDoc(collection(db, "examTimetable"), {
        day:
          String(manualExam.day || "").trim() ||
          getWeekdayFromDate(manualExam.date),
        date: normalizeDateString(manualExam.date),
        time: String(manualExam.time || "").trim(),
        branch: normalizeBranchName(manualExam.branch),
        courseCode: String(manualExam.courseCode || "")
          .replace(/\s+/g, "")
          .toUpperCase(),
        courseName: String(manualExam.courseName || "").trim(),
        duration: String(manualExam.duration || "3 hours").trim(),
        year: selectedYear,
        isActive: true,
        sourceType: "manual",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setMessage({
        type: "success",
        text: "Manual exam row added successfully.",
      });
      setManualExam({
        day: "",
        date: "",
        time: "",
        branch: "Computer",
        courseCode: "",
        courseName: "",
        duration: "3 hours",
      });
      await fetchExistingExams();
    } catch (error) {
      console.error("Add manual exam error:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to add manual exam.",
      });
    }
  };

  const handleUpdateExam = async () => {
    if (!editingExam?.id) {
      return;
    }

    try {
      const ref = doc(db, "examTimetable", editingExam.id);
      await updateDoc(ref, {
        day:
          String(editingExam.day || "").trim() ||
          getWeekdayFromDate(editingExam.date),
        date: normalizeDateString(editingExam.date),
        time: String(editingExam.time || "").trim(),
        branch: normalizeBranchName(editingExam.branch || ""),
        courseCode: String(editingExam.courseCode || "")
          .replace(/\s+/g, "")
          .toUpperCase(),
        courseName: String(editingExam.courseName || "").trim(),
        duration: String(editingExam.duration || "3 hours").trim(),
        year: selectedYear,
        isActive: editingExam.isActive === false ? false : true,
        updatedAt: serverTimestamp(),
      });

      setMessage({ type: "success", text: "Exam row updated successfully." });
      setEditingExam(null);
      await fetchExistingExams();
    } catch (error) {
      console.error("Update exam error:", error);
      setMessage({ type: "error", text: error.message || "Update failed." });
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm("Delete this exam row permanently?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "examTimetable", examId));
      setSelectedExamIds((prev) =>
        prev.filter((selectedId) => selectedId !== examId),
      );
      if (editingExam?.id === examId) {
        setEditingExam(null);
      }
      setMessage({ type: "success", text: "Exam row deleted successfully." });
      await fetchExistingExams();
    } catch (error) {
      console.error("Delete exam error:", error);
      setMessage({ type: "error", text: error.message || "Delete failed." });
    }
  };

  const toggleExamSelection = (examId) => {
    setSelectedExamIds((prev) =>
      prev.includes(examId)
        ? prev.filter((selectedId) => selectedId !== examId)
        : [...prev, examId],
    );
  };

  const toggleSelectAllExams = () => {
    const allIds = existingExams.map((exam) => exam.id);
    const areAllSelected =
      allIds.length > 0 &&
      allIds.every((examId) => selectedExamIds.includes(examId));

    if (areAllSelected) {
      setSelectedExamIds([]);
      return;
    }

    setSelectedExamIds(allIds);
  };

  const handleDeleteSelectedExams = async () => {
    if (selectedExamIds.length === 0) {
      setMessage({
        type: "error",
        text: "Please select at least one exam row.",
      });
      return;
    }

    const label = selectedExamIds.length === 1 ? "entry" : "entries";
    if (
      !window.confirm(
        `Delete ${selectedExamIds.length} selected exam ${label}?`,
      )
    ) {
      return;
    }

    try {
      const batch = writeBatch(db);
      selectedExamIds.forEach((examId) => {
        batch.delete(doc(db, "examTimetable", examId));
      });
      await batch.commit();

      if (editingExam?.id && selectedExamIds.includes(editingExam.id)) {
        setEditingExam(null);
      }
      setSelectedExamIds([]);
      setMessage({
        type: "success",
        text: `Deleted ${selectedExamIds.length} exam ${label} successfully.`,
      });
      await fetchExistingExams();
    } catch (error) {
      console.error("Bulk delete exams error:", error);
      setMessage({
        type: "error",
        text: error.message || "Bulk delete failed.",
      });
    }
  };

  const handlePdfFileChange = (event) => {
    const selected = event.target.files?.[0] || null;
    setPdfFile(selected);
  };

  const handleUploadPdf = async () => {
    if (!pdfFile) {
      setMessage({ type: "error", text: "Please select a PDF file first." });
      return;
    }

    setPdfUploading(true);

    try {
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken();
      const formData = new FormData();
      formData.append("file", pdfFile);
      formData.append("year", selectedYear);

      const response = await fetchWithNetworkHint(
        `${API_URL}/api/upload-exam-timetable-pdf`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data = await parseJsonResponse(response);

      setMessage({
        type: "success",
        text: data.message || "Timetable PDF uploaded.",
      });
      setPdfFile(null);
      await fetchUploadedPdfs();
    } catch (error) {
      console.error("Upload exam PDF error:", error);
      setMessage({
        type: "error",
        text: error.message || "PDF upload failed.",
      });
    } finally {
      setPdfUploading(false);
    }
  };

  const selectedExamIdSet = useMemo(
    () => new Set(selectedExamIds),
    [selectedExamIds],
  );

  const allViewRowsSelected =
    existingExams.length > 0 &&
    existingExams.every((exam) => selectedExamIdSet.has(exam.id));

  return (
    <div className="min-h-screen bg-[#eef2f6] px-3 py-6 sm:px-4 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <button
          onClick={() => navigate("/admin-dashboard")}
          className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:text-[#2f87d9] sm:px-4 sm:py-2 sm:text-sm"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-8"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2f87d9]">
              <FiCalendar className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
                Exam Timetable Management
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Year-wise OCR import, manual rows, and official timetable PDF
                upload
              </p>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {message.text ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                message.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : message.type === "error"
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              {message.type === "success" ? <FiCheck /> : <FiAlertCircle />}
              <span>{message.text}</span>
              <button
                onClick={() => setMessage({ type: "", text: "" })}
                className="ml-auto"
              >
                <FiX />
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Select Academic Year Timetable
          </label>
          <select
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 sm:max-w-xs"
          >
            {YEARS.map((year) => (
              <option key={year} value={year}>
                {year} Year
              </option>
            ))}
          </select>
        </div>

        <div className="mb-5 flex w-full gap-2 overflow-x-auto rounded-xl bg-white p-2 shadow-sm sm:w-fit">
          {[
            { id: "upload", label: "OCR Upload", icon: FiUpload },
            { id: "manual", label: "Manual Entry", icon: FiEdit2 },
            { id: "view", label: "View Exams", icon: FiEye },
            { id: "pdf", label: "Upload PDF", icon: FiFileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-[#2f87d9] text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "upload" ? (
            <motion.div
              key="ocr-upload"
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              className="space-y-5"
            >
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <FiUpload className="h-5 w-5 text-[#2f87d9]" />
                  <h2 className="text-lg font-semibold text-slate-800">
                    OCR Upload (Year-Wise Timetable)
                  </h2>
                </div>
                <p className="mb-4 text-sm text-slate-600">
                  Upload the complete year timetable (PDF/image). Parser will
                  split branch rows automatically.
                </p>

                <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleOcrFileChange}
                    className="hidden"
                    id="exam-ocr-file"
                  />
                  <label htmlFor="exam-ocr-file" className="cursor-pointer">
                    <p className="text-sm font-medium text-slate-700">
                      {ocrFile ? ocrFile.name : "Click to select PDF/image"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      OCR supports scanned timetable images and PDFs.
                    </p>
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleUploadAndExtract}
                    disabled={!ocrFile || ocrUploading}
                    className="rounded-lg bg-[#2f87d9] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {ocrUploading ? "Processing..." : "Upload & Extract"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmClear(true)}
                    className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700"
                  >
                    Clear Year Data
                  </button>
                </div>
              </div>

              {extractedText ? (
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold uppercase text-slate-600">
                    OCR Extracted Text Preview
                  </h3>
                  <pre className="max-h-64 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 whitespace-pre-wrap">
                    {extractedText}
                  </pre>
                </div>
              ) : null}

              {parsedExams.length > 0 ? (
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold text-slate-800">
                      Parsed Rows ({parsedExams.length})
                    </h3>
                    <button
                      type="button"
                      onClick={addEmptyParsedExam}
                      className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-700"
                    >
                      <FiPlus className="mr-1 inline" /> Add Row
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[460px] overflow-auto">
                    {parsedExams.map((exam, index) => (
                      <div
                        key={`${exam.courseCode || "row"}_${index}`}
                        className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-12"
                      >
                        <input
                          value={exam.day || ""}
                          onChange={(e) =>
                            updateParsedExam(index, "day", e.target.value)
                          }
                          placeholder="Day"
                          className="rounded-md border border-slate-300 px-2 py-1.5 text-xs md:col-span-2"
                        />
                        <input
                          value={exam.date || ""}
                          onChange={(e) =>
                            updateParsedExam(index, "date", e.target.value)
                          }
                          placeholder="DD-MM-YYYY"
                          className="rounded-md border border-slate-300 px-2 py-1.5 text-xs md:col-span-2"
                        />
                        <input
                          value={exam.time || ""}
                          onChange={(e) =>
                            updateParsedExam(index, "time", e.target.value)
                          }
                          placeholder="2:00 pm to 5:00 pm"
                          className="rounded-md border border-slate-300 px-2 py-1.5 text-xs md:col-span-2"
                        />
                        <select
                          value={exam.branch || ""}
                          onChange={(e) =>
                            updateParsedExam(index, "branch", e.target.value)
                          }
                          className="rounded-md border border-slate-300 px-2 py-1.5 text-xs md:col-span-2"
                        >
                          <option value="">Select branch</option>
                          {BRANCH_OPTIONS.map((branch) => (
                            <option key={branch} value={branch}>
                              {branch}
                            </option>
                          ))}
                        </select>
                        <input
                          value={exam.courseCode || ""}
                          onChange={(e) =>
                            updateParsedExam(
                              index,
                              "courseCode",
                              e.target.value,
                            )
                          }
                          placeholder="Course Code"
                          className="rounded-md border border-slate-300 px-2 py-1.5 text-xs md:col-span-1"
                        />
                        <input
                          value={exam.courseName || ""}
                          onChange={(e) =>
                            updateParsedExam(
                              index,
                              "courseName",
                              e.target.value,
                            )
                          }
                          placeholder="Course Name"
                          className="rounded-md border border-slate-300 px-2 py-1.5 text-xs md:col-span-2"
                        />
                        <button
                          type="button"
                          onClick={() => removeParsedExam(index)}
                          className="rounded-md border border-rose-300 bg-rose-50 px-2 py-1.5 text-xs text-rose-700 md:col-span-1"
                        >
                          <FiX className="mx-auto" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveParsedExams}
                    className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
                  >
                    <FiSave className="mr-2 inline" /> Save Parsed Year
                    Timetable
                  </button>
                </div>
              ) : null}
            </motion.div>
          ) : null}

          {activeTab === "manual" ? (
            <motion.div
              key="manual-entry"
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              className="rounded-2xl bg-white p-5 shadow-sm"
            >
              <h2 className="mb-4 text-lg font-semibold text-slate-800">
                Manual Exam Row Entry ({selectedYear} Year)
              </h2>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <input
                  type="text"
                  placeholder="Day (optional)"
                  value={manualExam.day}
                  onChange={(e) =>
                    setManualExam((prev) => ({ ...prev, day: e.target.value }))
                  }
                  className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-700"
                />
                <input
                  type="date"
                  value={manualExam.date}
                  onChange={(e) =>
                    setManualExam((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-700"
                />
                <input
                  type="text"
                  placeholder="2:00 pm to 5:00 pm"
                  value={manualExam.time}
                  onChange={(e) =>
                    setManualExam((prev) => ({ ...prev, time: e.target.value }))
                  }
                  className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-700"
                />
                <select
                  value={manualExam.branch}
                  onChange={(e) =>
                    setManualExam((prev) => ({
                      ...prev,
                      branch: e.target.value,
                    }))
                  }
                  className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-700"
                >
                  {BRANCH_OPTIONS.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Course Code"
                  value={manualExam.courseCode}
                  onChange={(e) =>
                    setManualExam((prev) => ({
                      ...prev,
                      courseCode: e.target.value,
                    }))
                  }
                  className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-700"
                />
                <input
                  type="text"
                  placeholder="Duration"
                  value={manualExam.duration}
                  onChange={(e) =>
                    setManualExam((prev) => ({
                      ...prev,
                      duration: e.target.value,
                    }))
                  }
                  className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-700"
                />
                <input
                  type="text"
                  placeholder="Course Name"
                  value={manualExam.courseName}
                  onChange={(e) =>
                    setManualExam((prev) => ({
                      ...prev,
                      courseName: e.target.value,
                    }))
                  }
                  className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 md:col-span-3"
                />
              </div>

              <button
                type="button"
                onClick={handleAddManualExam}
                className="mt-4 rounded-lg bg-[#2f87d9] px-4 py-2 text-sm font-medium text-white"
              >
                <FiPlus className="mr-2 inline" /> Add Exam Row
              </button>
            </motion.div>
          ) : null}

          {activeTab === "view" ? (
            <motion.div
              key="view-exams"
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              className="rounded-2xl bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-800">
                  View Exams ({selectedYear} Year)
                </h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={fetchExistingExams}
                    className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-700"
                  >
                    <FiRefreshCw className="mr-1 inline" /> Refresh
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveDuplicates}
                    className="rounded-md border border-amber-300 bg-amber-50 px-3 py-1 text-xs text-amber-700"
                  >
                    Remove Duplicates
                  </button>
                  <button
                    type="button"
                    onClick={toggleSelectAllExams}
                    disabled={existingExams.length === 0}
                    className="rounded-md border border-slate-300 bg-slate-50 px-3 py-1 text-xs text-slate-700 disabled:opacity-50"
                  >
                    {allViewRowsSelected ? "Unselect All" : "Select All"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteSelectedExams}
                    disabled={selectedExamIds.length === 0}
                    className="rounded-md border border-rose-300 bg-rose-50 px-3 py-1 text-xs text-rose-700 disabled:opacity-50"
                  >
                    <FiTrash2 className="mr-1 inline" /> Delete Selected (
                    {selectedExamIds.length})
                  </button>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                    {existingExams.length} rows
                  </span>
                </div>
              </div>

              {loadingExams ? (
                <div className="py-12 text-center text-slate-500">
                  Loading exam rows...
                </div>
              ) : existingExams.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  No exam rows found for this year.
                </div>
              ) : (
                <div className="space-y-3">
                  {existingExams.map((exam) => (
                    <div
                      key={exam.id}
                      className={`rounded-xl border p-3 ${
                        selectedExamIdSet.has(exam.id)
                          ? "border-[#2f87d9]/40 bg-[#2f87d9]/5"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="pt-1">
                          <input
                            type="checkbox"
                            checked={selectedExamIdSet.has(exam.id)}
                            onChange={() => toggleExamSelection(exam.id)}
                            className="h-4 w-4 accent-[#2f87d9]"
                            aria-label={`Select exam ${exam.courseCode || exam.id}`}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          {editingExam?.id === exam.id ? (
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
                              <input
                                value={editingExam.day || ""}
                                onChange={(e) =>
                                  setEditingExam((prev) => ({
                                    ...prev,
                                    day: e.target.value,
                                  }))
                                }
                                className="rounded-md border border-slate-300 px-2 py-1.5 text-xs md:col-span-2"
                                placeholder="Day"
                              />
                              <input
                                value={editingExam.date || ""}
                                onChange={(e) =>
                                  setEditingExam((prev) => ({
                                    ...prev,
                                    date: e.target.value,
                                  }))
                                }
                                className="rounded-md border border-slate-300 px-2 py-1.5 text-xs md:col-span-2"
                                placeholder="Date"
                              />
                              <input
                                value={editingExam.time || ""}
                                onChange={(e) =>
                                  setEditingExam((prev) => ({
                                    ...prev,
                                    time: e.target.value,
                                  }))
                                }
                                className="rounded-md border border-slate-300 px-2 py-1.5 text-xs md:col-span-2"
                                placeholder="Time"
                              />
                              <select
                                value={editingExam.branch || ""}
                                onChange={(e) =>
                                  setEditingExam((prev) => ({
                                    ...prev,
                                    branch: e.target.value,
                                  }))
                                }
                                className="rounded-md border border-slate-300 px-2 py-1.5 text-xs md:col-span-2"
                              >
                                <option value="">Select branch</option>
                                {BRANCH_OPTIONS.map((branch) => (
                                  <option key={branch} value={branch}>
                                    {branch}
                                  </option>
                                ))}
                              </select>
                              <input
                                value={editingExam.courseCode || ""}
                                onChange={(e) =>
                                  setEditingExam((prev) => ({
                                    ...prev,
                                    courseCode: e.target.value,
                                  }))
                                }
                                className="rounded-md border border-slate-300 px-2 py-1.5 text-xs md:col-span-1"
                                placeholder="Code"
                              />
                              <input
                                value={editingExam.courseName || ""}
                                onChange={(e) =>
                                  setEditingExam((prev) => ({
                                    ...prev,
                                    courseName: e.target.value,
                                  }))
                                }
                                className="rounded-md border border-slate-300 px-2 py-1.5 text-xs md:col-span-2"
                                placeholder="Course Name"
                              />
                              <div className="flex gap-1 md:col-span-1">
                                <button
                                  type="button"
                                  onClick={handleUpdateExam}
                                  className="flex-1 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1.5 text-xs text-emerald-700"
                                >
                                  <FiCheck className="mx-auto" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingExam(null)}
                                  className="flex-1 rounded-md border border-rose-300 bg-rose-50 px-2 py-1.5 text-xs text-rose-700"
                                >
                                  <FiX className="mx-auto" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 md:grid-cols-6">
                                <p className="text-xs text-slate-700">
                                  <span className="font-semibold">Day:</span>{" "}
                                  {exam.day || "-"}
                                </p>
                                <p className="text-xs text-slate-700">
                                  <span className="font-semibold">Date:</span>{" "}
                                  {exam.date || "-"}
                                </p>
                                <p className="text-xs text-slate-700">
                                  <span className="font-semibold">Time:</span>{" "}
                                  {exam.time || "-"}
                                </p>
                                <p className="text-xs text-slate-700">
                                  <span className="font-semibold">Branch:</span>{" "}
                                  {exam.branch || "-"}
                                </p>
                                <p className="text-xs text-slate-700">
                                  <span className="font-semibold">Code:</span>{" "}
                                  {exam.courseCode || "-"}
                                </p>
                                <p className="text-xs text-slate-800 md:col-span-2">
                                  <span className="font-semibold">Course:</span>{" "}
                                  {exam.courseName || "-"}
                                </p>
                              </div>

                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingExam(exam)}
                                  className="rounded-md border border-sky-300 bg-sky-50 px-2 py-1.5 text-xs text-sky-700"
                                >
                                  <FiEdit2 />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteExam(exam.id)}
                                  className="rounded-md border border-rose-300 bg-rose-50 px-2 py-1.5 text-xs text-rose-700"
                                >
                                  <FiTrash2 />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : null}

          {activeTab === "pdf" ? (
            <motion.div
              key="upload-pdf"
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              className="space-y-5"
            >
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-lg font-semibold text-slate-800">
                  Upload Official Timetable PDF ({selectedYear} Year)
                </h2>
                <p className="mb-4 text-sm text-slate-600">
                  This PDF will be visible to students and teachers in their
                  exam sections for this year.
                </p>

                <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handlePdfFileChange}
                    className="hidden"
                    id="exam-pdf-file"
                  />
                  <label htmlFor="exam-pdf-file" className="cursor-pointer">
                    <p className="text-sm font-medium text-slate-700">
                      {pdfFile ? pdfFile.name : "Click to select timetable PDF"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Only PDF format is accepted for this tab.
                    </p>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleUploadPdf}
                  disabled={!pdfFile || pdfUploading}
                  className="mt-4 rounded-lg bg-[#2f87d9] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {pdfUploading ? "Uploading PDF..." : "Upload PDF"}
                </button>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold uppercase text-slate-600">
                    Uploaded PDFs ({selectedYear} Year)
                  </h3>
                  <button
                    type="button"
                    onClick={fetchUploadedPdfs}
                    className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-700"
                  >
                    <FiRefreshCw className="mr-1 inline" /> Refresh
                  </button>
                </div>

                {uploadedPdfs.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No timetable PDF uploaded yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {uploadedPdfs.map((pdf) => (
                      <div
                        key={pdf.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {pdf.fileName || "exam-timetable.pdf"}
                          </p>
                          <p className="text-xs text-slate-500">
                            Status:{" "}
                            {pdf.active === false ? "Inactive" : "Active"}
                          </p>
                        </div>
                        <a
                          href={pdf.fileURL}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md bg-[#2f87d9] px-3 py-1.5 text-xs font-medium text-white"
                        >
                          Open PDF
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                {activePdf ? (
                  <p className="mt-3 text-xs text-emerald-700">
                    Active PDF is visible in student and teacher exam sections.
                  </p>
                ) : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {showConfirmClear ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
              onClick={() => setShowConfirmClear(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mx-4 w-full max-w-md rounded-2xl bg-white p-6"
                onClick={(event) => event.stopPropagation()}
              >
                <h3 className="text-lg font-semibold text-slate-800">
                  Clear Year Timetable?
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  This will remove all exam rows for {selectedYear} year.
                </p>

                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmClear(false)}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleClearYearExams}
                    className="flex-1 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white"
                  >
                    Clear
                  </button>
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
