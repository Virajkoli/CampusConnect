import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiCalendar,
  FiDownload,
  FiFileText,
} from "react-icons/fi";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { useNavigate } from "react-router-dom";

const YEARS = ["1st", "2nd", "3rd", "4th"];

const normalizeYearToken = (value = "") =>
  String(value || "").replace(/[^0-9]/g, "");

const parseExamDate = (dateStr = "") => {
  const raw = String(dateStr || "").trim();
  if (!raw) {
    return null;
  }

  const dmyMatch = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]) - 1;
    const year = Number(dmyMatch[3]);
    return new Date(year < 100 ? 2000 + year : year, month, day);
  }

  const isoMatch = raw.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
  if (isoMatch) {
    return new Date(
      Number(isoMatch[1]),
      Number(isoMatch[2]) - 1,
      Number(isoMatch[3]),
    );
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};


const formatExamDate = (dateValue = "") => {
  const parsed = parseExamDate(dateValue);
  if (!parsed) {
    return String(dateValue || "-");
  }

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const resolveExamDay = (exam = {}) => {
  const explicitDay = String(exam.day || "").trim();
  if (explicitDay) {
    return explicitDay;
  }

  const parsed = parseExamDate(exam.date || "");
  if (!parsed) {
    return "-";
  }

  return parsed.toLocaleDateString("en-US", { weekday: "long" });
};

const resolveMillis = (value) => {
  if (!value) {
    return 0;
  }

  if (typeof value?.toMillis === "function") {
    return value.toMillis();
  }

  if (typeof value?.seconds === "number") {
    return value.seconds * 1000;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

const ExamTimetable = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedYear, setSelectedYear] = useState("4th");

  const [allExams, setAllExams] = useState([]);
  const [allPdfFiles, setAllPdfFiles] = useState([]);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async (uid) => {
      try {
        if (!uid) {
          return;
        }

        const sources = [
          { name: "users", fallbackRole: "" },
          { name: "students", fallbackRole: "student" },
          { name: "teachers", fallbackRole: "teacher" },
          { name: "admins", fallbackRole: "admin" },
        ];

        let profile = null;

        for (const source of sources) {
          const profileSnap = await getDoc(doc(db, source.name, uid));
          if (!profileSnap.exists()) {
            continue;
          }

          profile = profileSnap.data() || {};
          break;
        }

        if (!mounted || !profile) {
          return;
        }

        const year = profile.year || "";

        if (year) {
          setSelectedYear(year);
        }
      } catch (profileError) {
        console.error(
          "Failed to load user profile for timetable:",
          profileError,
        );
      }
    };

    const initialUid = auth.currentUser?.uid;
    if (initialUid) {
      loadProfile(initialUid);
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser?.uid) {
        return;
      }
      loadProfile(firebaseUser.uid);
    });

    return () => {
      mounted = false;
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    setLoading(true);

    const unsubscribeExams = onSnapshot(
      collection(db, "examTimetable"),
      (snapshot) => {
        const rows = snapshot.docs.map((entry) => ({
          id: entry.id,
          ...entry.data(),
        }));

        setAllExams(rows);
        setError("");
        setLoading(false);
      },
      (subscriptionError) => {
        console.error("Failed to subscribe exam timetable:", subscriptionError);
        setError("Failed to load exam timetable.");
        setAllExams([]);
        setLoading(false);
      },
    );

    const unsubscribePdfs = onSnapshot(
      collection(db, "exam_timetable_files"),
      (snapshot) => {
        const rows = snapshot.docs.map((entry) => ({
          id: entry.id,
          ...entry.data(),
        }));

        setAllPdfFiles(rows);
      },
      (subscriptionError) => {
        console.error("Failed to subscribe timetable PDFs:", subscriptionError);
      },
    );

    return () => {
      unsubscribeExams();
      unsubscribePdfs();
    };
  }, []);

  const effectiveYear = String(selectedYear);

  const filteredExams = useMemo(() => {
    const yearToken = normalizeYearToken(effectiveYear);

    return allExams
      .filter((exam) => {
        if (exam?.isActive === false) {
          return false;
        }

        const yearMatch =
          !yearToken || normalizeYearToken(exam.year || "") === yearToken;
        return yearMatch;
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
  }, [allExams, effectiveYear]);

  const visiblePdfFiles = useMemo(() => {
    const yearToken = normalizeYearToken(effectiveYear);

    return allPdfFiles
      .filter((file) => {
        if (file?.active === false) {
          return false;
        }

        if (!yearToken) {
          return true;
        }

        return normalizeYearToken(file.year || "") === yearToken;
      })
      .sort((a, b) => {
        const diff =
          resolveMillis(b.updatedAt || b.createdAt) -
          resolveMillis(a.updatedAt || a.createdAt);
        return diff;
      });
  }, [allPdfFiles, effectiveYear]);

  const totalExamDays = useMemo(() => {
    return new Set(
      filteredExams.map((exam) =>
        String(exam.date || "")
          .trim()
          .toLowerCase(),
      ),
    ).size;
  }, [filteredExams]);

  return (
    <div className="min-h-screen bg-[#eef2f6] px-3 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:text-[#2f87d9] sm:px-4 sm:py-2 sm:text-sm"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-8"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2f87d9]">
                <FiCalendar className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
                  Exam Timetable
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Complete year-wise schedule with active updates
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:min-w-[220px]">
              <div className="rounded-xl bg-[#f4f8ff] px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  Exams
                </p>
                <p className="text-lg font-semibold text-slate-800">
                  {filteredExams.length}
                </p>
              </div>
              <div className="rounded-xl bg-[#f7fbf1] px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  Exam Days
                </p>
                <p className="text-lg font-semibold text-slate-800">
                  {totalExamDays}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mb-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Filter Timetable
          </p>

          <div className="mb-3 flex flex-wrap gap-2">
            {YEARS.map((year) => {
              const active = normalizeYearToken(effectiveYear) === normalizeYearToken(year);

              return (
                <button
                  key={year}
                  type="button"
                  onClick={() => setSelectedYear(year)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? "bg-[#2f87d9] text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {year} Year
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Timetable is year-wise. Select any year to view its exam list and official PDF.
          </div>
        </div>

        {error ? (
          <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mb-5 rounded-2xl border border-sky-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <FiFileText className="h-4 w-4 text-[#2f87d9]" />
            <p className="text-sm font-semibold text-slate-800">
              Official Timetable PDF
            </p>
          </div>

          {visiblePdfFiles.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {visiblePdfFiles.map((file) => (
                <a
                  key={file.id}
                  href={file.fileURL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-[#2f87d9] px-3 py-1.5 text-xs font-medium text-white"
                >
                  {(file.year || effectiveYear || "Year").trim()} PDF
                  <FiDownload className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No official timetable PDF uploaded for this year.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-800">
              Exam List ({effectiveYear || "All Years"})
            </h2>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500">
              Loading timetable...
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              No exams available for selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Day</th>
                    <th className="px-3 py-2">Time</th>
                    <th className="px-3 py-2">Course Code</th>
                    <th className="px-3 py-2">Course Name</th>
                    <th className="px-3 py-2">Branch</th>
                    <th className="px-3 py-2">Duration</th>
                    <th className="px-3 py-2">Year</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExams.map((exam) => (
                    <tr key={exam.id} className="border-t border-slate-200">
                      <td className="px-3 py-2 text-slate-700">
                        {formatExamDate(exam.date)}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {resolveExamDay(exam)}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {exam.time || "Time TBA"}
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-700">
                        {exam.courseCode || "-"}
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-800">
                        {exam.courseName || "Course"}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {exam.branch || "-"}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {exam.duration || "-"}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {exam.year || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamTimetable;
