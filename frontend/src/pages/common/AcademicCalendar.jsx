import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { firestore, auth } from "../../firebase";
import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  FiCalendar,
  FiClock,
  FiArrowLeft,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiCheckCircle,
  FiX,
  FiSave,
  FiUpload,
  FiFileText,
  FiDownload,
} from "react-icons/fi";
import {
  FaGraduationCap,
  FaFlask,
  FaCalendarAlt,
  FaClipboardList,
  FaUmbrellaBeach,
  FaUserTie,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const API_URL = String(import.meta.env.VITE_API_URL || "http://localhost:5000")
  .trim()
  .replace(/\/+$/, "");

const GEMINI_API_KEY = String(import.meta.env.VITE_GEMINI_API_KEY || "").trim();

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

// Default Academic Calendar Data for 2025-26
const defaultAcademicCalendarData = [
  {
    activity: "Commencement of Odd Semester (III, V, and VII)",
    dateSlots: "28 July 2025",
    startDate: "2025-07-28",
    endDate: "2025-07-28",
    responsibility: "Dean (Academics) and HoD",
    category: "academic",
    color: "blue",
    icon: "graduation",
  },
  {
    activity:
      "Admission formalities, registration, re-registration in offline mode",
    dateSlots: "28 July 2025",
    startDate: "2025-07-28",
    endDate: "2025-07-28",
    responsibility: "Office and HoD",
    category: "academic",
    color: "blue",
    icon: "book",
  },
  {
    activity:
      "Selection of MDM, OE, PE, Honour and double minor for SY B.Tech. under NEP2020",
    dateSlots: "28 July – 2 Aug, 2025",
    startDate: "2025-07-28",
    endDate: "2025-08-02",
    responsibility: "Dean (Academics) and HoD",
    category: "academic",
    color: "blue",
    icon: "book",
  },
  {
    activity: "Selection of PE, OE and MOOC for Third and Final Year",
    dateSlots: "28 July – 2 Aug, 2025",
    startDate: "2025-07-28",
    endDate: "2025-08-02",
    responsibility: "Dean (Academics) and HoD",
    category: "academic",
    color: "blue",
    icon: "book",
  },
  {
    activity: "MSE based on 50% syllabus",
    dateSlots: "22 – 25 Sept., 2025",
    startDate: "2025-09-22",
    endDate: "2025-09-25",
    responsibility: "HoD",
    category: "exam",
    color: "yellow",
    icon: "clipboard",
  },
  {
    activity: "Technical Events (Co-curricular activities)",
    dateSlots: "3 – 5 Oct, 2025",
    startDate: "2025-10-03",
    endDate: "2025-10-05",
    responsibility: "Dean (S. A.)",
    category: "event",
    color: "cyan",
    icon: "flask",
  },
  {
    activity: "Submission of term work of all courses (Winter 2025)",
    dateSlots: "14 Nov., 2025",
    startDate: "2025-11-14",
    endDate: "2025-11-14",
    responsibility: "Course Teacher and Coordinator",
    category: "academic",
    color: "blue",
    icon: "check",
  },
  {
    activity:
      "Meeting of all faculty members regarding finalizing list of Not Eligible (NE) Students due to lack of attendance",
    dateSlots: "14 Nov., 2025",
    startDate: "2025-11-14",
    endDate: "2025-11-14",
    responsibility: "HoD",
    category: "academic",
    color: "blue",
    icon: "user",
  },
  {
    activity: "End of odd semester",
    dateSlots: "14 Nov., 2025",
    startDate: "2025-11-14",
    endDate: "2025-11-14",
    responsibility: "HoD",
    category: "academic",
    color: "blue",
    icon: "calendar",
  },
  {
    activity: "ESE laboratory exam (PR-ESE Winter 2025)",
    dateSlots: "17 - 24 Nov., 2025",
    startDate: "2025-11-17",
    endDate: "2025-11-24",
    responsibility: "HoD and CoE",
    category: "exam",
    color: "orange",
    icon: "flask",
  },
  {
    activity: "ESE theory exam (TH-ESE Winter 2025)",
    dateSlots: "26 Nov - 11 Dec, 2025",
    startDate: "2025-11-26",
    endDate: "2025-12-11",
    responsibility: "CoE",
    category: "exam",
    color: "red",
    icon: "clipboard",
  },
  {
    activity: "Winter vacation / Internship-slot for students",
    dateSlots: "12 Dec, 2025 – 3 Jan, 2026",
    startDate: "2025-12-12",
    endDate: "2026-01-03",
    responsibility: "--",
    category: "holiday",
    color: "green",
    icon: "umbrella",
  },
  {
    activity: "Commencement of Even Semester for Academic Year 2025-26",
    dateSlots: "5 January, 2026",
    startDate: "2026-01-05",
    endDate: "2026-01-05",
    responsibility: "Dean (Academics) and HoD",
    category: "academic",
    color: "purple",
    icon: "graduation",
  },
];

const iconMap = {
  graduation: FaGraduationCap,
  book: FiCalendar,
  clipboard: FaClipboardList,
  flask: FaFlask,
  check: FiCheckCircle,
  user: FaUserTie,
  calendar: FiCalendar,
  umbrella: FaUmbrellaBeach,
};

function AcademicCalendar() {
  const [user] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [academicEvents, setAcademicEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [ocrFile, setOcrFile] = useState(null);
  const [ocrUploading, setOcrUploading] = useState(false);
  const [savingParsedOcr, setSavingParsedOcr] = useState(false);
  const [savingParsedHolidays, setSavingParsedHolidays] = useState(false);
  const [ocrExtractedText, setOcrExtractedText] = useState("");
  const [parsedOcrEntries, setParsedOcrEntries] = useState([]);
  const [parsedOcrHolidayEntries, setParsedOcrHolidayEntries] = useState([]);
  const [calendarPdfFile, setCalendarPdfFile] = useState(null);
  const [calendarPdfYear, setCalendarPdfYear] = useState("2025-26");
  const [uploadingCalendarPdf, setUploadingCalendarPdf] = useState(false);
  const [academicCalendarPdfs, setAcademicCalendarPdfs] = useState([]);
  const [selectedEventIds, setSelectedEventIds] = useState([]);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    activity: "",
    dateSlots: "",
    startDate: "",
    endDate: "",
    responsibility: "",
    category: "academic",
    color: "blue",
    icon: "calendar",
  });

  const categories = [
    { id: "academic", name: "Academic", color: "blue" },
    { id: "exam", name: "Examination", color: "red" },
    { id: "event", name: "Event", color: "cyan" },
    { id: "holiday", name: "Holiday", color: "green" },
  ];

  const colors = ["blue", "yellow", "orange", "red", "cyan", "green", "purple"];

  const activeAcademicCalendarPdf = useMemo(() => {
    return (
      academicCalendarPdfs.find((item) => item.active !== false) ||
      academicCalendarPdfs[0] ||
      null
    );
  }, [academicCalendarPdfs]);

  const selectedEventIdSet = useMemo(() => {
    return new Set(selectedEventIds);
  }, [selectedEventIds]);

  const deletableAcademicEvents = useMemo(() => {
    return academicEvents.filter(
      (item) => !String(item.id || "").startsWith("default-"),
    );
  }, [academicEvents]);

  const allDeletableSelected =
    deletableAcademicEvents.length > 0 &&
    deletableAcademicEvents.every((item) => selectedEventIdSet.has(item.id));

  const timestampToMillis = (value) => {
    if (!value) return 0;
    if (typeof value === "number") return value;
    if (typeof value.toMillis === "function") return value.toMillis();
    if (typeof value.seconds === "number") return value.seconds * 1000;
    return 0;
  };

  const refreshAcademicEvents = async () => {
    setLoading(true);
    try {
      const eventsQuery = query(
        collection(firestore, "academicCalendar"),
        orderBy("startDate"),
      );
      const snapshot = await getDocs(eventsQuery);

      if (snapshot.empty) {
        setAcademicEvents(
          defaultAcademicCalendarData.map((item, index) => ({
            ...item,
            id: `default-${index}`,
          })),
        );
      } else {
        const events = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setAcademicEvents(events);
      }
    } catch (error) {
      console.error("Error fetching academic calendar:", error);
      setAcademicEvents(
        defaultAcademicCalendarData.map((item, index) => ({
          ...item,
          id: `default-${index}`,
        })),
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademicCalendarPdfs = async () => {
    try {
      const snapshot = await getDocs(
        collection(firestore, "academic_calendar_files"),
      );
      const rows = snapshot.docs
        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        .sort(
          (a, b) =>
            timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt),
        );
      setAcademicCalendarPdfs(rows);
    } catch (error) {
      console.error("Error fetching academic calendar PDFs:", error);
      setAcademicCalendarPdfs([]);
    }
  };

  // Check if user is admin
  useEffect(() => {
    const checkUserRole = async () => {
      if (user) {
        try {
          const tokenResult = await user.getIdTokenResult(true);
          if (tokenResult?.claims?.admin) {
            setIsAdmin(true);
            return;
          }

          const adminDoc = await getDoc(doc(firestore, "admins", user.uid));
          if (adminDoc.exists()) {
            setIsAdmin(true);
            return;
          }

          const adminQuery = query(
            collection(firestore, "admins"),
            where("uid", "==", user.uid),
          );
          const adminSnapshot = await getDocs(adminQuery);
          setIsAdmin(!adminSnapshot.empty);
        } catch {
          setIsAdmin(false);
        }
      }
    };
    checkUserRole();
  }, [user]);

  // Fetch academic calendar events
  useEffect(() => {
    refreshAcademicEvents();
    fetchAcademicCalendarPdfs();
  }, []);

  useEffect(() => {
    setSelectedEventIds((prev) =>
      prev.filter((eventId) =>
        academicEvents.some((eventItem) => eventItem.id === eventId),
      ),
    );
  }, [academicEvents]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        // Update existing event
        if (!editingEvent.id.startsWith("default-")) {
          await updateDoc(
            doc(firestore, "academicCalendar", editingEvent.id),
            formData,
          );
        } else {
          // Convert default to real document
          await addDoc(collection(firestore, "academicCalendar"), formData);
        }
        toast.success("Event updated successfully");
      } else {
        // Add new event
        await addDoc(collection(firestore, "academicCalendar"), formData);
        toast.success("Event added successfully");
      }

      await refreshAcademicEvents();

      resetForm();
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error("Failed to save event");
    }
  };

  const handleDelete = async (eventId) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      if (!eventId.startsWith("default-")) {
        await deleteDoc(doc(firestore, "academicCalendar", eventId));
      }
      setAcademicEvents(academicEvents.filter((e) => e.id !== eventId));
      setSelectedEventIds((prev) => prev.filter((id) => id !== eventId));
      toast.success("Event deleted successfully");
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    }
  };

  const toggleEventSelection = (eventId) => {
    setSelectedEventIds((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId],
    );
  };

  const toggleSelectAllDeletable = () => {
    if (allDeletableSelected) {
      setSelectedEventIds([]);
      return;
    }
    setSelectedEventIds(
      deletableAcademicEvents.map((eventItem) => eventItem.id),
    );
  };

  const clearSelectedEvents = () => {
    setSelectedEventIds([]);
  };

  const handleBulkDeleteSelected = async () => {
    if (selectedEventIds.length === 0) {
      toast.error("Please select at least one event to delete.");
      return;
    }

    if (
      !window.confirm(
        `Delete ${selectedEventIds.length} selected academic calendar event(s)? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const batch = writeBatch(firestore);
      selectedEventIds.forEach((eventId) => {
        if (!String(eventId || "").startsWith("default-")) {
          batch.delete(doc(firestore, "academicCalendar", eventId));
        }
      });
      await batch.commit();
      setSelectedEventIds([]);
      await refreshAcademicEvents();
      toast.success("Selected events deleted successfully.");
    } catch (error) {
      console.error("Error deleting selected events:", error);
      toast.error("Failed to delete selected events.");
    }
  };

  const handleBulkDeleteAll = async () => {
    if (deletableAcademicEvents.length === 0) {
      toast.info(
        "No saved academic calendar events available for bulk delete.",
      );
      return;
    }

    if (
      !window.confirm(
        `Delete all ${deletableAcademicEvents.length} saved academic calendar event(s)? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const batch = writeBatch(firestore);
      deletableAcademicEvents.forEach((eventItem) => {
        batch.delete(doc(firestore, "academicCalendar", eventItem.id));
      });
      await batch.commit();
      setSelectedEventIds([]);
      await refreshAcademicEvents();
      toast.success("All saved events deleted successfully.");
    } catch (error) {
      console.error("Error deleting all events:", error);
      toast.error("Failed to delete all events.");
    }
  };

  const editEvent = (event) => {
    setEditingEvent(event);
    setFormData({
      activity: event.activity,
      dateSlots: event.dateSlots,
      startDate: event.startDate,
      endDate: event.endDate,
      responsibility: event.responsibility,
      category: event.category,
      color: event.color,
      icon: event.icon || "calendar",
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      activity: "",
      dateSlots: "",
      startDate: "",
      endDate: "",
      responsibility: "",
      category: "academic",
      color: "blue",
      icon: "calendar",
    });
    setEditingEvent(null);
    setShowForm(false);
  };

  const handleOcrFileChange = (event) => {
    const selected = event.target.files?.[0] || null;
    if (selected && selected.size > 10 * 1024 * 1024) {
      toast.error(
        "File exceeds 10MB upload limit. Please upload a smaller file.",
      );
      setOcrFile(null);
      setOcrExtractedText("");
      setParsedOcrEntries([]);
      setParsedOcrHolidayEntries([]);
      return;
    }

    setOcrFile(selected);
    setOcrExtractedText("");
    setParsedOcrEntries([]);
    setParsedOcrHolidayEntries([]);
  };

  const handleCalendarPdfFileChange = (event) => {
    const selected = event.target.files?.[0] || null;
    if (!selected) {
      setCalendarPdfFile(null);
      return;
    }

    const isPdfType =
      selected.type === "application/pdf" ||
      /\.pdf$/i.test(selected.name || "");
    if (!isPdfType) {
      toast.error("Only PDF files are supported for academic calendar upload.");
      setCalendarPdfFile(null);
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      toast.error(
        "File exceeds 10MB upload limit. Please upload a smaller PDF.",
      );
      setCalendarPdfFile(null);
      return;
    }

    setCalendarPdfFile(selected);
  };

  const handleUploadAcademicCalendarPdf = async () => {
    if (!calendarPdfFile) {
      toast.error("Please choose a PDF file first.");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast.error("Please login again.");
      return;
    }

    setUploadingCalendarPdf(true);
    try {
      const token = await currentUser.getIdToken();
      const formData = new FormData();
      formData.append("file", calendarPdfFile);
      formData.append(
        "academicYear",
        String(calendarPdfYear || "").trim() || "2025-26",
      );

      const response = await fetchWithNetworkHint(
        `${API_URL}/api/admin/upload-academic-calendar-pdf`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data = await parseJsonResponse(response);
      toast.success(
        data.message || "Academic calendar PDF uploaded successfully.",
      );
      setCalendarPdfFile(null);
      await fetchAcademicCalendarPdfs();
    } catch (error) {
      console.error("Academic calendar PDF upload error:", error);
      toast.error(error.message || "Failed to upload academic calendar PDF.");
    } finally {
      setUploadingCalendarPdf(false);
    }
  };

  const updateParsedOcrEntry = (index, field, value) => {
    setParsedOcrEntries((prev) => {
      const clone = [...prev];
      clone[index] = { ...clone[index], [field]: value };
      return clone;
    });
  };

  const removeParsedOcrEntry = (index) => {
    setParsedOcrEntries((prev) =>
      prev.filter((_, rowIndex) => rowIndex !== index),
    );
  };

  const addParsedOcrEntry = () => {
    setParsedOcrEntries((prev) => [
      ...prev,
      {
        activity: "",
        dateSlots: "",
        startDate: "",
        endDate: "",
        responsibility: "",
        category: "academic",
        color: "blue",
        icon: "calendar",
      },
    ]);
  };

  const updateParsedHolidayEntry = (index, field, value) => {
    setParsedOcrHolidayEntries((prev) => {
      const clone = [...prev];
      clone[index] = { ...clone[index], [field]: value };
      return clone;
    });
  };

  const removeParsedHolidayEntry = (index) => {
    setParsedOcrHolidayEntries((prev) =>
      prev.filter((_, rowIndex) => rowIndex !== index),
    );
  };

  const addParsedHolidayEntry = () => {
    setParsedOcrHolidayEntries((prev) => [
      ...prev,
      {
        activity: "",
        dateSlots: "",
        startDate: "",
        endDate: "",
        rescheduledDateForAcademics: "",
        responsibility: "--",
        category: "holiday",
        color: "green",
        icon: "umbrella",
      },
    ]);
  };

  const handleUploadAndExtractOcr = async () => {
    if (!ocrFile) {
      toast.error("Please choose a CSV, PDF, or image file first.");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast.error("Please login again.");
      return;
    }

    setOcrUploading(true);
    try {
      const token = await currentUser.getIdToken();
      const formData = new FormData();
      formData.append("file", ocrFile);

      const response = await fetchWithNetworkHint(
        `${API_URL}/api/admin/parse-academic-calendar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            ...(GEMINI_API_KEY ? { "x-gemini-api-key": GEMINI_API_KEY } : {}),
          },
          body: formData,
        },
      );

      const data = await parseJsonResponse(response);
      const rows = Array.isArray(data.entries) ? data.entries : [];
      const holidayRows = Array.isArray(data.holidayEntries)
        ? data.holidayEntries
        : [];

      setOcrExtractedText(String(data.extractedText || ""));
      setParsedOcrEntries(rows);
      setParsedOcrHolidayEntries(holidayRows);

      if (rows.length > 0 || holidayRows.length > 0) {
        toast.success(
          `OCR complete. Parsed ${rows.length} activity row(s) and ${holidayRows.length} holiday row(s).`,
        );
      } else {
        toast.info("OCR complete, but no structured rows were parsed.");
      }
    } catch (error) {
      console.error("Academic calendar OCR upload error:", error);
      toast.error(error.message || "OCR upload failed.");
    } finally {
      setOcrUploading(false);
    }
  };

  const handleSaveParsedOcrEntries = async () => {
    if (parsedOcrEntries.length === 0) {
      toast.error("No parsed OCR entries to save.");
      return;
    }

    setSavingParsedOcr(true);
    try {
      const batch = writeBatch(firestore);
      const calendarCollection = collection(firestore, "academicCalendar");
      let savedCount = 0;

      parsedOcrEntries.forEach((entry) => {
        const activity = String(entry.activity || "").trim();
        const dateSlots = String(entry.dateSlots || "").trim();
        const startDate = String(entry.startDate || "").trim();
        const endDate = String(entry.endDate || startDate).trim();

        if (!activity || !startDate) {
          return;
        }

        const responsibility =
          String(entry.responsibility || "").trim() || "--";
        const category =
          String(entry.category || "academic").trim() || "academic";
        const color = String(entry.color || "blue").trim() || "blue";
        const icon = String(entry.icon || "calendar").trim() || "calendar";

        const newRef = doc(calendarCollection);
        batch.set(newRef, {
          activity,
          dateSlots,
          startDate,
          endDate,
          responsibility,
          category,
          color,
          icon,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        savedCount += 1;
      });

      if (savedCount === 0) {
        throw new Error(
          "No valid entries to save. Ensure Activity and Start Date are filled.",
        );
      }

      await batch.commit();
      await refreshAcademicEvents();

      setParsedOcrEntries([]);
      if (parsedOcrHolidayEntries.length === 0) {
        setOcrExtractedText("");
        setOcrFile(null);
      }
      toast.success(`Saved ${savedCount} academic calendar event(s).`);
    } catch (error) {
      console.error("Save parsed academic calendar entries error:", error);
      toast.error(error.message || "Failed to save parsed entries.");
    } finally {
      setSavingParsedOcr(false);
    }
  };

  const handleSaveParsedOcrHolidayEntries = async () => {
    if (parsedOcrHolidayEntries.length === 0) {
      toast.error("No parsed holiday rows to save.");
      return;
    }

    setSavingParsedHolidays(true);
    try {
      const batch = writeBatch(firestore);
      const calendarCollection = collection(firestore, "academicCalendar");
      let savedCount = 0;

      parsedOcrHolidayEntries.forEach((entry) => {
        const activity = String(entry.activity || "").trim();
        const dateSlots = String(entry.dateSlots || "").trim();
        const startDate = String(entry.startDate || "").trim();
        const endDate = String(entry.endDate || startDate).trim();
        const rescheduledDateForAcademics = String(
          entry.rescheduledDateForAcademics || "",
        ).trim();

        if (!activity || !startDate) {
          return;
        }

        const newRef = doc(calendarCollection);
        batch.set(newRef, {
          activity,
          dateSlots: dateSlots || startDate,
          startDate,
          endDate,
          responsibility: rescheduledDateForAcademics
            ? `Rescheduled: ${rescheduledDateForAcademics}`
            : "--",
          rescheduledDateForAcademics,
          category: "holiday",
          color: "green",
          icon: "umbrella",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        savedCount += 1;
      });

      if (savedCount === 0) {
        throw new Error(
          "No valid holiday entries to save. Ensure Holiday Name and Start Date are filled.",
        );
      }

      await batch.commit();
      await refreshAcademicEvents();

      setParsedOcrHolidayEntries([]);
      if (parsedOcrEntries.length === 0) {
        setOcrExtractedText("");
        setOcrFile(null);
      }
      toast.success(`Saved ${savedCount} holiday event(s).`);
    } catch (error) {
      console.error("Save parsed academic calendar holidays error:", error);
      toast.error(error.message || "Failed to save parsed holidays.");
    } finally {
      setSavingParsedHolidays(false);
    }
  };

  const getIconComponent = (iconName) => {
    return iconMap[iconName] || FiCalendar;
  };

  const colorClasses = {
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-400",
      icon: "bg-blue-500",
      text: "text-blue-700",
      badge: "bg-blue-100 text-blue-700",
    },
    yellow: {
      bg: "bg-yellow-50",
      border: "border-yellow-400",
      icon: "bg-yellow-500",
      text: "text-yellow-700",
      badge: "bg-yellow-100 text-yellow-700",
    },
    orange: {
      bg: "bg-orange-50",
      border: "border-orange-400",
      icon: "bg-orange-500",
      text: "text-orange-700",
      badge: "bg-orange-100 text-orange-700",
    },
    red: {
      bg: "bg-red-50",
      border: "border-red-400",
      icon: "bg-red-500",
      text: "text-red-700",
      badge: "bg-red-100 text-red-700",
    },
    cyan: {
      bg: "bg-cyan-50",
      border: "border-cyan-400",
      icon: "bg-cyan-500",
      text: "text-cyan-700",
      badge: "bg-cyan-100 text-cyan-700",
    },
    green: {
      bg: "bg-green-50",
      border: "border-green-400",
      icon: "bg-green-500",
      text: "text-green-700",
      badge: "bg-green-100 text-green-700",
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-400",
      icon: "bg-purple-500",
      text: "text-purple-700",
      badge: "bg-purple-100 text-purple-700",
    },
  };

  const formatShortDate = (isoDate) => {
    const raw = String(isoDate || "").trim();
    if (!raw) return "";

    const dateObj = new Date(`${raw}T00:00:00`);
    if (Number.isNaN(dateObj.getTime())) {
      return raw;
    }

    return dateObj.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getEventDateDisplay = (item) => {
    const slots = String(item?.dateSlots || "").trim();
    if (slots) {
      return slots;
    }

    const start = String(item?.startDate || "").trim();
    const end = String(item?.endDate || "").trim();

    if (start && end && start !== end) {
      return `${formatShortDate(start)} - ${formatShortDate(end)}`;
    }
    if (start) {
      return formatShortDate(start);
    }

    return "--";
  };

  const examinationScheduleRows = useMemo(() => {
    const examPattern = /(mse|ese|exam|pr-ese|th-ese|theory|lab)/i;

    return [...academicEvents]
      .filter((item) => {
        const category = String(item?.category || "").toLowerCase();
        const activity = String(item?.activity || "");
        return category === "exam" || examPattern.test(activity);
      })
      .sort((a, b) => {
        const aMs = Date.parse(`${String(a?.startDate || "")}T00:00:00`);
        const bMs = Date.parse(`${String(b?.startDate || "")}T00:00:00`);

        if (Number.isNaN(aMs) && Number.isNaN(bMs)) return 0;
        if (Number.isNaN(aMs)) return 1;
        if (Number.isNaN(bMs)) return -1;
        return aMs - bMs;
      })
      .slice(0, 3);
  }, [academicEvents]);

  const keyDeadlineRows = useMemo(() => {
    const examPattern = /(mse|ese|exam|pr-ese|th-ese|theory|lab)/i;
    const keyPattern =
      /(selection|submission|term\s*work|vacation|commencement|registration|re-?registration|deadline|starts|start)/i;

    return [...academicEvents]
      .filter((item) => {
        const activity = String(item?.activity || "");
        const category = String(item?.category || "").toLowerCase();

        if (category === "exam" || examPattern.test(activity)) {
          return false;
        }

        return (
          keyPattern.test(activity) ||
          category === "academic" ||
          category === "holiday"
        );
      })
      .sort((a, b) => {
        const aMs = Date.parse(`${String(a?.startDate || "")}T00:00:00`);
        const bMs = Date.parse(`${String(b?.startDate || "")}T00:00:00`);

        if (Number.isNaN(aMs) && Number.isNaN(bMs)) return 0;
        if (Number.isNaN(aMs)) return 1;
        if (Number.isNaN(bMs)) return -1;
        return aMs - bMs;
      })
      .slice(0, 3);
  }, [academicEvents]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 pt-10 pb-10">
      {/* Back Button */}
      <button
        onClick={() => navigate("/calendars")}
        className="flex items-center mx-4 sm:mx-8 my-4 text-indigo-600 hover:text-indigo-800 transition-colors"
      >
        <FiArrowLeft className="mr-2" />
        Back to Calendars
      </button>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FaCalendarAlt className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Academic Calendar 2025-26
              </h1>
              <p className="text-gray-500 mt-1">Odd Semester Schedule</p>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl transition shadow-lg"
            >
              {showForm ? <FiX /> : <FiPlus />}
              {showForm ? "Cancel" : "Add Event"}
            </button>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl border border-indigo-100 bg-white p-5 shadow-lg"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
                Official Academic Calendar PDF
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {activeAcademicCalendarPdf
                  ? `${activeAcademicCalendarPdf.fileName || "academic-calendar.pdf"} (${activeAcademicCalendarPdf.academicYear || "General"})`
                  : "No official PDF uploaded yet."}
              </p>
            </div>
            {activeAcademicCalendarPdf ? (
              <a
                href={activeAcademicCalendarPdf.fileURL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <FiDownload className="w-4 h-4" />
                Open PDF
              </a>
            ) : null}
          </div>
        </motion.div>

        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-6 mb-8"
          >
            <div className="flex items-center gap-2 mb-2">
              <FiFileText className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-gray-800">
                OCR Import Academic Calendar
              </h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Upload CSV, PDF, or image to extract academic calendar rows.
              Review and edit before saving.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="file"
                accept=".csv,text/csv,application/pdf,image/*"
                onChange={handleOcrFileChange}
                className="w-full rounded-xl border-2 border-dashed border-gray-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleUploadAndExtractOcr}
                disabled={!ocrFile || ocrUploading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                <FiUpload className="w-4 h-4" />
                {ocrUploading ? "Extracting..." : "Upload & Extract"}
              </button>
            </div>

            {ocrExtractedText ? (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                  OCR Extracted Text
                </p>
                <pre className="max-h-48 overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 whitespace-pre-wrap">
                  {ocrExtractedText}
                </pre>
              </div>
            ) : null}

            {parsedOcrEntries.length > 0 ? (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-700">
                    Parsed Rows ({parsedOcrEntries.length})
                  </p>
                  <button
                    type="button"
                    onClick={addParsedOcrEntry}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700"
                  >
                    <FiPlus className="inline mr-1" /> Add Row
                  </button>
                </div>

                <div className="max-h-[420px] overflow-auto space-y-3">
                  {parsedOcrEntries.map((entry, index) => (
                    <div
                      key={`${entry.activity || "ocr"}-${index}`}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-3"
                    >
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-6">
                        <input
                          type="text"
                          value={entry.activity || ""}
                          onChange={(e) =>
                            updateParsedOcrEntry(
                              index,
                              "activity",
                              e.target.value,
                            )
                          }
                          placeholder="Activity"
                          className="md:col-span-2 rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
                        />
                        <input
                          type="text"
                          value={entry.dateSlots || ""}
                          onChange={(e) =>
                            updateParsedOcrEntry(
                              index,
                              "dateSlots",
                              e.target.value,
                            )
                          }
                          placeholder="Date slots"
                          className="md:col-span-2 rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
                        />
                        <input
                          type="date"
                          value={entry.startDate || ""}
                          onChange={(e) =>
                            updateParsedOcrEntry(
                              index,
                              "startDate",
                              e.target.value,
                            )
                          }
                          className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
                        />
                        <input
                          type="date"
                          value={entry.endDate || ""}
                          onChange={(e) =>
                            updateParsedOcrEntry(
                              index,
                              "endDate",
                              e.target.value,
                            )
                          }
                          className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
                        />
                        <input
                          type="text"
                          value={entry.responsibility || ""}
                          onChange={(e) =>
                            updateParsedOcrEntry(
                              index,
                              "responsibility",
                              e.target.value,
                            )
                          }
                          placeholder="Responsibility"
                          className="md:col-span-3 rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
                        />
                        <select
                          value={entry.category || "academic"}
                          onChange={(e) =>
                            updateParsedOcrEntry(
                              index,
                              "category",
                              e.target.value,
                            )
                          }
                          className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
                        >
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        <select
                          value={entry.color || "blue"}
                          onChange={(e) =>
                            updateParsedOcrEntry(index, "color", e.target.value)
                          }
                          className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
                        >
                          {colors.map((color) => (
                            <option key={color} value={color}>
                              {color}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeParsedOcrEntry(index)}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs font-medium text-rose-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveParsedOcrEntries}
                    disabled={savingParsedOcr}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  >
                    <FiSave className="w-4 h-4" />
                    {savingParsedOcr ? "Saving..." : "Save Parsed Rows"}
                  </button>
                </div>
              </div>
            ) : null}

            {parsedOcrHolidayEntries.length > 0 ? (
              <div className="mt-5 rounded-2xl border border-green-200 bg-green-50/70 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-green-900">
                    Parsed Public Holidays ({parsedOcrHolidayEntries.length})
                  </p>
                  <button
                    type="button"
                    onClick={addParsedHolidayEntry}
                    className="rounded-lg border border-green-300 bg-white px-3 py-1.5 text-xs font-medium text-green-800"
                  >
                    <FiPlus className="inline mr-1" /> Add Holiday
                  </button>
                </div>

                <div className="max-h-[300px] overflow-auto space-y-3">
                  {parsedOcrHolidayEntries.map((entry, index) => (
                    <div
                      key={`${entry.activity || "holiday"}-${index}`}
                      className="rounded-xl border border-green-200 bg-white p-3"
                    >
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
                        <input
                          type="text"
                          value={entry.activity || ""}
                          onChange={(e) =>
                            updateParsedHolidayEntry(
                              index,
                              "activity",
                              e.target.value,
                            )
                          }
                          placeholder="Holiday name"
                          className="md:col-span-2 rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
                        />
                        <input
                          type="text"
                          value={entry.dateSlots || ""}
                          onChange={(e) =>
                            updateParsedHolidayEntry(
                              index,
                              "dateSlots",
                              e.target.value,
                            )
                          }
                          placeholder="Holiday date display"
                          className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
                        />
                        <input
                          type="date"
                          value={entry.startDate || ""}
                          onChange={(e) =>
                            updateParsedHolidayEntry(
                              index,
                              "startDate",
                              e.target.value,
                            )
                          }
                          className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
                        />
                        <input
                          type="text"
                          value={entry.rescheduledDateForAcademics || ""}
                          onChange={(e) =>
                            updateParsedHolidayEntry(
                              index,
                              "rescheduledDateForAcademics",
                              e.target.value,
                            )
                          }
                          placeholder="Rescheduled date for academics"
                          className="md:col-span-3 rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => removeParsedHolidayEntry(index)}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs font-medium text-rose-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveParsedOcrHolidayEntries}
                    disabled={savingParsedHolidays}
                    className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  >
                    <FiSave className="w-4 h-4" />
                    {savingParsedHolidays ? "Saving..." : "Save Holiday Rows"}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
              <div className="flex items-center gap-2 mb-2">
                <FiFileText className="h-4 w-4 text-indigo-600" />
                <p className="text-sm font-semibold text-indigo-900">
                  Upload Official Academic Calendar PDF
                </p>
              </div>
              <p className="text-xs text-indigo-800/80 mb-3">
                Upload a PDF version for students and teachers. The latest
                active file appears above.
              </p>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <input
                  type="text"
                  value={calendarPdfYear}
                  onChange={(e) => setCalendarPdfYear(e.target.value)}
                  placeholder="Academic year (e.g., 2025-26)"
                  className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm"
                />
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleCalendarPdfFileChange}
                  className="rounded-lg border border-dashed border-indigo-300 bg-white px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={handleUploadAcademicCalendarPdf}
                  disabled={!calendarPdfFile || uploadingCalendarPdf}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  <FiUpload className="h-4 w-4" />
                  {uploadingCalendarPdf ? "Uploading PDF..." : "Upload PDF"}
                </button>
              </div>

              {academicCalendarPdfs.length > 0 ? (
                <div className="mt-3 max-h-44 overflow-auto space-y-2">
                  {academicCalendarPdfs.map((pdf) => (
                    <div
                      key={pdf.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-indigo-100 bg-white px-3 py-2"
                    >
                      <div>
                        <p className="text-xs font-medium text-gray-800">
                          {pdf.fileName || "academic-calendar.pdf"}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {pdf.academicYear || "General"} |{" "}
                          {pdf.active === false ? "Inactive" : "Active"}
                        </p>
                      </div>
                      <a
                        href={pdf.fileURL}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white"
                      >
                        Open
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-indigo-900/80">
                  No academic calendar PDF uploaded yet.
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Add/Edit Form */}
        <AnimatePresence>
          {showForm && isAdmin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-2xl shadow-xl p-6 mb-8 overflow-hidden"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {editingEvent ? "Edit Event" : "Add New Event"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 mb-1 font-medium">
                      Activity*
                    </label>
                    <input
                      type="text"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-indigo-500 focus:outline-none"
                      value={formData.activity}
                      onChange={(e) =>
                        setFormData({ ...formData, activity: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-1 font-medium">
                      Date/Slots Display*
                    </label>
                    <input
                      type="text"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-indigo-500 focus:outline-none"
                      value={formData.dateSlots}
                      onChange={(e) =>
                        setFormData({ ...formData, dateSlots: e.target.value })
                      }
                      placeholder="e.g., 28 July 2025"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-1 font-medium">
                      Responsibility*
                    </label>
                    <input
                      type="text"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-indigo-500 focus:outline-none"
                      value={formData.responsibility}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          responsibility: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-1 font-medium">
                      Start Date*
                    </label>
                    <input
                      type="date"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-indigo-500 focus:outline-none"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-1 font-medium">
                      End Date*
                    </label>
                    <input
                      type="date"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-indigo-500 focus:outline-none"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      min={formData.startDate}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-1 font-medium">
                      Category
                    </label>
                    <select
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-indigo-500 focus:outline-none"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-1 font-medium">
                      Color
                    </label>
                    <select
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-indigo-500 focus:outline-none"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                    >
                      {colors.map((color) => (
                        <option key={color} value={color}>
                          {color.charAt(0).toUpperCase() + color.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-5 py-2.5 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition"
                  >
                    <FiSave />
                    {editingEvent ? "Update" : "Save"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-3 mb-6"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm text-blue-700 font-medium">Academic</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-full">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-sm text-yellow-700 font-medium">
              MSE Exam
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-full">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-sm text-orange-700 font-medium">
              Lab Exam
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-full">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-red-700 font-medium">
              Theory Exam
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-cyan-50 rounded-full">
            <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
            <span className="text-sm text-cyan-700 font-medium">Events</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-green-700 font-medium">Holiday</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-sm text-purple-700 font-medium">
              New Semester
            </span>
          </div>
        </motion.div>

        {/* Timeline */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FiCalendar className="w-5 h-5" />
                Semester Timeline
              </h3>
              <p className="text-white/80 text-sm mt-1">
                July 2025 - January 2026
              </p>
            </div>

            <div className="p-6">
              {isAdmin ? (
                <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="mr-auto text-xs font-semibold uppercase tracking-wide text-amber-800">
                      Bulk Actions
                    </p>
                    <span className="rounded-md bg-white px-2 py-1 text-xs text-amber-800 border border-amber-200">
                      Selected: {selectedEventIds.length}
                    </span>
                    <button
                      type="button"
                      onClick={toggleSelectAllDeletable}
                      className="rounded-md border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-800"
                    >
                      {allDeletableSelected
                        ? "Unselect All"
                        : "Select All Saved"}
                    </button>
                    <button
                      type="button"
                      onClick={clearSelectedEvents}
                      className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkDeleteSelected}
                      disabled={selectedEventIds.length === 0}
                      className="rounded-md border border-rose-300 bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 disabled:opacity-50"
                    >
                      Delete Selected
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkDeleteAll}
                      disabled={deletableAcademicEvents.length === 0}
                      className="rounded-md border border-rose-400 bg-rose-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      Delete All Saved
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="space-y-4">
                <AnimatePresence>
                  {academicEvents.map((item, index) => {
                    const IconComponent = getIconComponent(item.icon);
                    const isPast = new Date(item.endDate) < new Date();
                    const isOngoing =
                      new Date() >= new Date(item.startDate) &&
                      new Date() <= new Date(item.endDate);
                    const isUpcoming = new Date(item.startDate) > new Date();

                    const colors =
                      colorClasses[item.color] || colorClasses.blue;
                    const isDefaultItem = String(item.id || "").startsWith(
                      "default-",
                    );

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`relative flex gap-4 p-5 rounded-xl border-l-4 ${
                          colors.border
                        } ${colors.bg} ${
                          isPast ? "opacity-60" : ""
                        } hover:shadow-md transition-all duration-300`}
                      >
                        {/* Icon */}
                        <div
                          className={`flex-shrink-0 w-12 h-12 ${colors.icon} rounded-xl flex items-center justify-center shadow-lg`}
                        >
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4
                                className={`font-semibold ${colors.text} text-lg leading-tight`}
                              >
                                {item.activity}
                              </h4>
                              <div className="flex flex-wrap items-center gap-3 mt-2">
                                <span className="flex items-center gap-1 text-gray-600 text-sm">
                                  <FiCalendar className="w-4 h-4" />
                                  {item.dateSlots}
                                </span>
                                <span className="flex items-center gap-1 text-gray-500 text-sm">
                                  <FaUserTie className="w-4 h-4" />
                                  {item.responsibility}
                                </span>
                              </div>
                            </div>

                            {/* Status Badge & Actions */}
                            <div className="flex items-center gap-2">
                              {isOngoing && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500 text-white text-xs font-semibold animate-pulse">
                                  <span className="w-2 h-2 bg-white rounded-full"></span>
                                  Ongoing
                                </span>
                              )}
                              {isPast && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-400 text-white text-xs font-semibold">
                                  <FiCheckCircle className="w-3 h-3" />
                                  Completed
                                </span>
                              )}
                              {isUpcoming && !isOngoing && (
                                <span
                                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${colors.badge} text-xs font-semibold`}
                                >
                                  <FiClock className="w-3 h-3" />
                                  Upcoming
                                </span>
                              )}

                              {isAdmin && (
                                <div className="flex gap-1 ml-2">
                                  {!isDefaultItem ? (
                                    <label className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-[11px] text-gray-700">
                                      <input
                                        type="checkbox"
                                        checked={selectedEventIdSet.has(
                                          item.id,
                                        )}
                                        onChange={() =>
                                          toggleEventSelection(item.id)
                                        }
                                        className="h-3.5 w-3.5"
                                      />
                                      Select
                                    </label>
                                  ) : null}
                                  <button
                                    onClick={() => editEvent(item)}
                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                                  >
                                    <FiEdit2 className="w-4 h-4" />
                                  </button>
                                  {!isDefaultItem ? (
                                    <button
                                      onClick={() => handleDelete(item.id)}
                                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                                    >
                                      <FiTrash2 className="w-4 h-4" />
                                    </button>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg"
          >
            <FaGraduationCap className="w-8 h-8 mb-2 opacity-80" />
            <div className="text-3xl font-bold">110</div>
            <div className="text-blue-100 text-sm">Teaching Days</div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 text-white shadow-lg"
          >
            <FaClipboardList className="w-8 h-8 mb-2 opacity-80" />
            <div className="text-3xl font-bold">20</div>
            <div className="text-red-100 text-sm">Exam Days</div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white shadow-lg"
          >
            <FaUmbrellaBeach className="w-8 h-8 mb-2 opacity-80" />
            <div className="text-3xl font-bold">23</div>
            <div className="text-green-100 text-sm">Vacation Days</div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg"
          >
            <FaFlask className="w-8 h-8 mb-2 opacity-80" />
            <div className="text-3xl font-bold">3</div>
            <div className="text-purple-100 text-sm">Tech Events</div>
          </motion.div>
        </div>

        {/* Important Dates Cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                📝
              </span>
              Examination Schedule
            </h3>
            <div className="space-y-3">
              {examinationScheduleRows.length > 0 ? (
                examinationScheduleRows.map((item, index) => {
                  const rowBg =
                    ["bg-yellow-50", "bg-orange-50", "bg-red-50"][index] ||
                    "bg-red-50";
                  const rowText =
                    ["text-yellow-700", "text-orange-700", "text-red-700"][
                      index
                    ] || "text-red-700";

                  return (
                    <div
                      key={`exam-schedule-${item.id || index}`}
                      className={`flex justify-between items-center p-3 ${rowBg} rounded-lg gap-3`}
                    >
                      <span className="text-gray-700">{item.activity}</span>
                      <span className={`${rowText} font-semibold text-right`}>
                        {getEventDateDisplay(item)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-500">
                  No examination schedule available.
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                📅
              </span>
              Key Deadlines
            </h3>
            <div className="space-y-3">
              {keyDeadlineRows.length > 0 ? (
                keyDeadlineRows.map((item, index) => {
                  const rowBg =
                    ["bg-blue-50", "bg-purple-50", "bg-green-50"][index] ||
                    "bg-blue-50";
                  const rowText =
                    ["text-blue-700", "text-purple-700", "text-green-700"][
                      index
                    ] || "text-blue-700";

                  return (
                    <div
                      key={`deadline-${item.id || index}`}
                      className={`flex justify-between items-center p-3 ${rowBg} rounded-lg gap-3`}
                    >
                      <span className="text-gray-700">{item.activity}</span>
                      <span className={`${rowText} font-semibold text-right`}>
                        {getEventDateDisplay(item)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-500">
                  No key deadlines available.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default AcademicCalendar;
