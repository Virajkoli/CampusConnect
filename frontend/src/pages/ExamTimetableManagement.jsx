import React, { useState, useEffect } from "react";
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
  FiClock,
  FiBook,
  FiAlertCircle,
  FiCheck,
  FiEye,
} from "react-icons/fi";
import { getAuth } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const branches = [
  "Computer Engineering",
  "Electronics And TeleCommunication Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Information Technology",
];

const years = ["1st", "2nd", "3rd", "4th"];

const ExamTimetableManagement = () => {
  const [activeTab, setActiveTab] = useState("upload"); // upload, manual, view
  const [selectedYear, setSelectedYear] = useState("4th");
  const [selectedBranch, setSelectedBranch] = useState("Computer Engineering");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [parsedExams, setParsedExams] = useState([]);
  const [existingExams, setExistingExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [manualExam, setManualExam] = useState({
    date: "",
    time: "",
    courseCode: "",
    courseName: "",
    duration: "3 hours",
  });

  // Fetch existing exams on load
  useEffect(() => {
    fetchExistingExams();
  }, [selectedYear, selectedBranch]);

  const fetchExistingExams = async () => {
    setLoading(true);
    try {
      const examsRef = collection(db, "examTimetable");
      const q = query(examsRef, orderBy("date", "asc"));
      const snapshot = await getDocs(q);

      const exams = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(
          (exam) => exam.year === selectedYear && exam.branch === selectedBranch
        );

      setExistingExams(exams);
    } catch (error) {
      console.error("Error fetching exams:", error);
      setMessage({ type: "error", text: "Failed to fetch existing exams" });
    }
    setLoading(false);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setExtractedText("");
      setParsedExams([]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({ type: "error", text: "Please select a file first" });
      return;
    }

    setUploading(true);
    setMessage({ type: "", text: "" });

    try {
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("year", selectedYear);
      formData.append("branch", selectedBranch);

      const response = await fetch(`${API_URL}/api/upload-exam-timetable`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setExtractedText(data.extractedText);
        setMessage({
          type: "success",
          text: "File uploaded and text extracted successfully!",
        });
        // Try to parse the extracted text
        parseExtractedText(data.extractedText);
      } else {
        throw new Error(data.message || "Failed to upload file");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage({ type: "error", text: error.message });
    }
    setUploading(false);
  };

  const parseExtractedText = (text) => {
    // This is a basic parser - you may need to adjust based on your timetable format
    const lines = text.split("\n").filter((line) => line.trim());
    const exams = [];

    // Common date patterns
    const datePattern =
      /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{1,2}\s+\w+\s+\d{4})/;
    const timePattern =
      /(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?(?:\s*-\s*\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)?)/;

    let currentDate = "";
    let currentTime = "";

    lines.forEach((line) => {
      const dateMatch = line.match(datePattern);
      const timeMatch = line.match(timePattern);

      if (dateMatch) {
        currentDate = dateMatch[1];
      }
      if (timeMatch) {
        currentTime = timeMatch[1];
      }

      // Look for course codes (common formats: CS101, COMP-301, etc.)
      const courseCodeMatch = line.match(/([A-Z]{2,4}[-\s]?\d{2,4})/);
      if (courseCodeMatch && currentDate) {
        const courseName = line
          .replace(courseCodeMatch[0], "")
          .replace(datePattern, "")
          .replace(timePattern, "")
          .trim();

        if (courseName) {
          exams.push({
            date: currentDate,
            time: currentTime || "09:00 AM",
            courseCode: courseCodeMatch[1],
            courseName: courseName.substring(0, 100),
            duration: "3 hours",
            year: selectedYear,
            branch: selectedBranch,
          });
        }
      }
    });

    setParsedExams(exams);

    if (exams.length === 0) {
      setMessage({
        type: "warning",
        text: "Could not automatically parse exams. Please add them manually.",
      });
    }
  };

  const handleClearExams = async () => {
    try {
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken();

      const response = await fetch(`${API_URL}/api/clear-exam-timetable`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          year: selectedYear,
          branch: selectedBranch,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: `Cleared ${data.deletedCount} exam entries`,
        });
        setExistingExams([]);
        setShowConfirmClear(false);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const handleRemoveDuplicates = async () => {
    try {
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken();

      const response = await fetch(`${API_URL}/api/remove-duplicate-exams`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: data.message,
        });
        fetchExistingExams();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const handleSaveParsedExams = async () => {
    if (parsedExams.length === 0) {
      setMessage({ type: "error", text: "No exams to save" });
      return;
    }

    try {
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken();

      const response = await fetch(`${API_URL}/api/save-exam-timetable`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          exams: parsedExams,
          year: selectedYear,
          branch: selectedBranch,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: `Saved ${data.savedCount} exam entries successfully!`,
        });
        setParsedExams([]);
        setExtractedText("");
        setFile(null);
        fetchExistingExams();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const handleAddManualExam = async () => {
    if (!manualExam.date || !manualExam.courseCode || !manualExam.courseName) {
      setMessage({ type: "error", text: "Please fill all required fields" });
      return;
    }

    try {
      await addDoc(collection(db, "examTimetable"), {
        ...manualExam,
        year: selectedYear,
        branch: selectedBranch,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setMessage({ type: "success", text: "Exam added successfully!" });
      setManualExam({
        date: "",
        time: "",
        courseCode: "",
        courseName: "",
        duration: "3 hours",
      });
      fetchExistingExams();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const handleUpdateExam = async () => {
    if (!editingExam) return;

    try {
      const examRef = doc(db, "examTimetable", editingExam.id);
      await updateDoc(examRef, {
        ...editingExam,
        updatedAt: serverTimestamp(),
      });

      setMessage({ type: "success", text: "Exam updated successfully!" });
      setEditingExam(null);
      fetchExistingExams();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm("Are you sure you want to delete this exam?")) return;

    try {
      await deleteDoc(doc(db, "examTimetable", examId));
      setMessage({ type: "success", text: "Exam deleted successfully!" });
      fetchExistingExams();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const updateParsedExam = (index, field, value) => {
    const updated = [...parsedExams];
    updated[index] = { ...updated[index], [field]: value };
    setParsedExams(updated);
  };

  const removeParsedExam = (index) => {
    setParsedExams(parsedExams.filter((_, i) => i !== index));
  };

  const addEmptyParsedExam = () => {
    setParsedExams([
      ...parsedExams,
      {
        date: "",
        time: "09:00 AM",
        courseCode: "",
        courseName: "",
        duration: "3 hours",
        year: selectedYear,
        branch: selectedBranch,
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <FiCalendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Exam Timetable Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Upload PDF/Image, use OCR, or manually add exam schedules
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Message Alert */}
        <AnimatePresence>
          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-6 p-4 rounded-xl flex items-center gap-3 shadow-lg ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : message.type === "error"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-yellow-50 text-yellow-700 border border-yellow-200"
              }`}
            >
              {message.type === "success" ? <FiCheck /> : <FiAlertCircle />}
              {message.text}
              <button
                onClick={() => setMessage({ type: "", text: "" })}
                className="ml-auto hover:opacity-70"
              >
                <FiX />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Year and Branch Selection */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2 text-sm font-semibold">
                Select Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year} Year
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-2 text-sm font-semibold">
                Select Branch
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {branches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white p-2 rounded-xl shadow-lg w-fit">
          {[
            { id: "upload", label: "OCR Upload", icon: FiUpload },
            { id: "manual", label: "Manual Entry", icon: FiEdit2 },
            { id: "view", label: "View Exams", icon: FiEye },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* OCR Upload Tab */}
          {activeTab === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Upload Section */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FiUpload className="text-blue-500" />
                  Upload Timetable (PDF/Image)
                </h2>

                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors bg-gray-50">
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <FiFileText className="text-4xl text-gray-400 mb-4" />
                    {file ? (
                      <div className="text-green-600">
                        <p className="font-semibold">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-700 font-medium">
                          Drop your file here or click to browse
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                          Supports PDF and Image files
                        </p>
                      </div>
                    )}
                  </label>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white py-3 px-6 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FiUpload />
                        Upload & Extract Text
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowConfirmClear(true)}
                    className="bg-red-50 hover:bg-red-100 text-red-600 py-3 px-6 rounded-xl font-medium flex items-center gap-2 transition-colors border border-red-200"
                  >
                    <FiTrash2 />
                    Clear Existing
                  </button>
                </div>
              </div>

              {/* Extracted Text Preview */}
              {extractedText && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Extracted Text
                  </h2>
                  <pre className="bg-gray-50 p-4 rounded-xl text-gray-700 text-sm overflow-auto max-h-60 whitespace-pre-wrap border border-gray-200">
                    {extractedText}
                  </pre>
                </div>
              )}

              {/* Parsed Exams Editor */}
              {parsedExams.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800">
                      Parsed Exams ({parsedExams.length})
                    </h2>
                    <button
                      onClick={addEmptyParsedExam}
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium"
                    >
                      <FiPlus /> Add Row
                    </button>
                  </div>

                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {parsedExams.map((exam, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-xl p-4 grid grid-cols-1 md:grid-cols-6 gap-3 border border-gray-200"
                      >
                        <input
                          type="text"
                          value={exam.date}
                          onChange={(e) =>
                            updateParsedExam(index, "date", e.target.value)
                          }
                          placeholder="Date (e.g., 01/12/2025)"
                          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-sm focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={exam.time}
                          onChange={(e) =>
                            updateParsedExam(index, "time", e.target.value)
                          }
                          placeholder="Time"
                          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-sm focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={exam.courseCode}
                          onChange={(e) =>
                            updateParsedExam(
                              index,
                              "courseCode",
                              e.target.value
                            )
                          }
                          placeholder="Course Code"
                          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-sm focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={exam.courseName}
                          onChange={(e) =>
                            updateParsedExam(
                              index,
                              "courseName",
                              e.target.value
                            )
                          }
                          placeholder="Course Name"
                          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-sm md:col-span-2 focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => removeParsedExam(index)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 rounded-lg px-3 py-2 flex items-center justify-center border border-red-200"
                        >
                          <FiX />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleSaveParsedExams}
                    className="w-full mt-4 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white py-3 px-6 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg"
                  >
                    <FiSave />
                    Save All Exams
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Manual Entry Tab */}
          {activeTab === "manual" && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FiEdit2 className="text-blue-500" />
                Add Exam Manually
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2 text-sm font-medium">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={manualExam.date}
                    onChange={(e) =>
                      setManualExam({ ...manualExam, date: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2 text-sm font-medium">
                    Time
                  </label>
                  <input
                    type="time"
                    value={manualExam.time}
                    onChange={(e) =>
                      setManualExam({ ...manualExam, time: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2 text-sm font-medium">
                    Duration
                  </label>
                  <select
                    value={manualExam.duration}
                    onChange={(e) =>
                      setManualExam({ ...manualExam, duration: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1 hour">1 hour</option>
                    <option value="2 hours">2 hours</option>
                    <option value="3 hours">3 hours</option>
                    <option value="4 hours">4 hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2 text-sm font-medium">
                    Course Code *
                  </label>
                  <input
                    type="text"
                    value={manualExam.courseCode}
                    onChange={(e) =>
                      setManualExam({
                        ...manualExam,
                        courseCode: e.target.value,
                      })
                    }
                    placeholder="e.g., CO401 or EE301"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-700 mb-2 text-sm font-medium">
                    Course Name *
                  </label>
                  <input
                    type="text"
                    value={manualExam.courseName}
                    onChange={(e) =>
                      setManualExam({
                        ...manualExam,
                        courseName: e.target.value,
                      })
                    }
                    placeholder="e.g., Machine Learning"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Course Code Info */}
              <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm text-blue-700 font-medium mb-2">
                  📌 Course Code Prefixes:
                </p>
                <p className="text-xs text-blue-600">
                  CO - Computer Engineering | EE - Electrical | ET - Electronics
                  & Telecomm | ME - Mechanical | CE - Civil | IN -
                  Instrumentation
                </p>
              </div>

              <button
                onClick={handleAddManualExam}
                className="mt-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 px-6 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg"
              >
                <FiPlus />
                Add Exam
              </button>
            </motion.div>
          )}

          {/* View Exams Tab */}
          {activeTab === "view" && (
            <motion.div
              key="view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FiEye className="text-blue-500" />
                  Existing Exams for {selectedYear} Year - {selectedBranch}
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRemoveDuplicates}
                    className="text-orange-600 bg-orange-50 hover:bg-orange-100 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors border border-orange-200"
                  >
                    <FiTrash2 />
                    Remove Duplicates
                  </button>
                  <span className="text-gray-500 text-sm bg-gray-100 px-3 py-1 rounded-full">
                    {existingExams.length} exams found
                  </span>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent" />
                </div>
              ) : existingExams.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FiCalendar className="text-5xl mx-auto mb-4 opacity-50" />
                  <p className="text-gray-600">
                    No exams found for this year and branch
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {existingExams.map((exam) => (
                    <div
                      key={exam.id}
                      className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-all border border-gray-100"
                    >
                      {editingExam?.id === exam.id ? (
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-3">
                          <input
                            type="text"
                            value={editingExam.date}
                            onChange={(e) =>
                              setEditingExam({
                                ...editingExam,
                                date: e.target.value,
                              })
                            }
                            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-sm"
                          />
                          <input
                            type="text"
                            value={editingExam.time}
                            onChange={(e) =>
                              setEditingExam({
                                ...editingExam,
                                time: e.target.value,
                              })
                            }
                            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-sm"
                          />
                          <input
                            type="text"
                            value={editingExam.courseCode}
                            onChange={(e) =>
                              setEditingExam({
                                ...editingExam,
                                courseCode: e.target.value,
                              })
                            }
                            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-sm"
                          />
                          <input
                            type="text"
                            value={editingExam.courseName}
                            onChange={(e) =>
                              setEditingExam({
                                ...editingExam,
                                courseName: e.target.value,
                              })
                            }
                            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-sm"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleUpdateExam}
                              className="bg-green-100 text-green-600 rounded-lg px-3 py-2 flex-1 hover:bg-green-200"
                            >
                              <FiCheck />
                            </button>
                            <button
                              onClick={() => setEditingExam(null)}
                              className="bg-red-100 text-red-600 rounded-lg px-3 py-2 flex-1 hover:bg-red-200"
                            >
                              <FiX />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 uppercase font-medium">
                                Date & Time
                              </p>
                              <p className="text-gray-800 font-semibold">
                                {exam.date}
                              </p>
                              <p className="text-gray-500 text-sm">
                                {exam.time || "Not specified"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase font-medium">
                                Course Code
                              </p>
                              <p className="text-blue-600 font-mono font-bold">
                                {exam.courseCode}
                              </p>
                            </div>
                            <div className="md:col-span-2">
                              <p className="text-xs text-gray-500 uppercase font-medium">
                                Course Name
                              </p>
                              <p className="text-gray-700">{exam.courseName}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => setEditingExam(exam)}
                              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                            >
                              <FiEdit2 />
                            </button>
                            <button
                              onClick={() => handleDeleteExam(exam.id)}
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirm Clear Modal */}
        <AnimatePresence>
          {showConfirmClear && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
              onClick={() => setShowConfirmClear(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Clear Exam Timetable?
                </h3>
                <p className="text-gray-600 mb-6">
                  This will delete all exam entries for{" "}
                  <span className="text-gray-800 font-semibold">
                    {selectedYear} Year
                  </span>{" "}
                  -{" "}
                  <span className="text-gray-800 font-semibold">
                    {selectedBranch}
                  </span>
                  . This action cannot be undone.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowConfirmClear(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-xl transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearExams}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-xl transition-colors font-medium"
                  >
                    Clear All
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ExamTimetableManagement;
