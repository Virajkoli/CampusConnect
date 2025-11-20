import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCalendar,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSave,
  FiX,
  FiArrowLeft,
  FiBook,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const AdminExamTimetable = () => {
  const [examSchedule, setExamSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [formData, setFormData] = useState({
    date: "",
    branch: "",
    year: "",
    courseCode: "",
    courseName: "",
  });
  const navigate = useNavigate();

  const branches = [
    "Civil",
    "Computer",
    "Electrical",
    "E&TC",
    "Instrumentation",
    "Mechanical",
  ];

  const years = ["1st", "2nd", "3rd", "4th"];

  useEffect(() => {
    const q = query(collection(db, "examTimetable"), orderBy("date", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const exams = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setExamSchedule(exams);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddExam = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "examTimetable"), formData);
      setShowAddModal(false);
      setFormData({
        date: "",
        branch: "",
        year: "",
        courseCode: "",
        courseName: "",
      });
    } catch (error) {
      console.error("Error adding exam:", error);
      alert("Failed to add exam. Please try again.");
    }
  };

  const handleUpdateExam = async (e) => {
    e.preventDefault();
    try {
      const examRef = doc(db, "examTimetable", editingExam.id);
      await updateDoc(examRef, formData);
      setEditingExam(null);
      setFormData({
        date: "",
        branch: "",
        year: "",
        courseCode: "",
        courseName: "",
      });
    } catch (error) {
      console.error("Error updating exam:", error);
      alert("Failed to update exam. Please try again.");
    }
  };

  const handleDeleteExam = async (examId) => {
    if (window.confirm("Are you sure you want to delete this exam?")) {
      try {
        await deleteDoc(doc(db, "examTimetable", examId));
      } catch (error) {
        console.error("Error deleting exam:", error);
        alert("Failed to delete exam. Please try again.");
      }
    }
  };

  const startEdit = (exam) => {
    setEditingExam(exam);
    setFormData({
      date: exam.date,
      branch: exam.branch,
      year: exam.year,
      courseCode: exam.courseCode,
      courseName: exam.courseName,
    });
  };

  const cancelEdit = () => {
    setEditingExam(null);
    setFormData({
      date: "",
      branch: "",
      year: "",
      courseCode: "",
      courseName: "",
    });
  };

  // Group exams by date
  const groupedExams = examSchedule.reduce((acc, exam) => {
    const date = exam.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(exam);
    return acc;
  }, {});

  const formatDate = (dateString) => {
    const [day, date] = dateString.split(",");
    return { day: day.trim(), date: date.trim() };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading exam schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate("/admin-dashboard")}
            className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors font-medium mb-6 group"
          >
            <FiArrowLeft className="group-hover:animate-pulse" />
            Back to Dashboard
          </button>

          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                  <FiCalendar className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Manage Exam Timetable
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Add, edit, or remove exam schedules
                  </p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <FiPlus className="w-5 h-5" />
                Add Exam
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {branches.map((branch, index) => {
            const count = examSchedule.filter(
              (e) => e.branch === branch
            ).length;
            return (
              <motion.div
                key={branch}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl p-4 shadow-lg text-center"
              >
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {count}
                </div>
                <div className="text-sm text-gray-600 mt-1">{branch}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Exam Schedule */}
        {Object.keys(groupedExams).length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-lg p-12 text-center"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCalendar className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              No Exams Scheduled
            </h3>
            <p className="text-gray-600 mb-6">
              Start by adding exam schedules for different branches.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold"
            >
              Add First Exam
            </button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedExams).map(([date, exams], index) => {
              const { day, date: dateStr } = formatDate(date);

              return (
                <motion.div
                  key={date}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-3xl shadow-xl overflow-hidden"
                >
                  {/* Date Header */}
                  <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                        <FiCalendar className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-white">
                        <h2 className="text-3xl font-bold">{day}</h2>
                        <p className="text-lg text-white/90">{dateStr}</p>
                      </div>
                    </div>
                  </div>

                  {/* Exams List */}
                  <div className="p-6">
                    <div className="grid gap-4">
                      {exams.map((exam) => (
                        <div
                          key={exam.id}
                          className="flex items-start gap-4 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl"
                        >
                          {editingExam?.id === exam.id ? (
                            // Edit Form
                            <form
                              onSubmit={handleUpdateExam}
                              className="flex-1 space-y-4"
                            >
                              <div className="grid grid-cols-2 gap-4">
                                <input
                                  type="text"
                                  value={formData.courseCode}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      courseCode: e.target.value,
                                    })
                                  }
                                  placeholder="Course Code"
                                  className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                                  required
                                />
                                <select
                                  value={formData.branch}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      branch: e.target.value,
                                    })
                                  }
                                  className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                                  required
                                >
                                  <option value="">Select Branch</option>
                                  {branches.map((b) => (
                                    <option key={b} value={b}>
                                      {b}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <select
                                value={formData.year}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    year: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                                required
                              >
                                <option value="">Select Year</option>
                                {years.map((y) => (
                                  <option key={y} value={y}>
                                    {y} Year
                                  </option>
                                ))}
                              </select>
                              <input
                                type="text"
                                value={formData.courseName}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    courseName: e.target.value,
                                  })
                                }
                                placeholder="Course Name"
                                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                                required
                              />
                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-600"
                                >
                                  <FiSave className="w-4 h-4" />
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  className="flex items-center gap-2 bg-gray-300 text-gray-700 px-4 py-2 rounded-xl font-semibold hover:bg-gray-400"
                                >
                                  <FiX className="w-4 h-4" />
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            // Display Mode
                            <>
                              <div className="flex-shrink-0">
                                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                                  <span className="text-white font-bold text-sm text-center px-2">
                                    {exam.branch}
                                  </span>
                                </div>
                              </div>

                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-xl font-bold text-gray-800">
                                    {exam.courseCode}
                                  </h3>
                                  {exam.year ? (
                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                                      {exam.year} Year
                                    </span>
                                  ) : (
                                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                                      No Year Set
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-600 font-medium">
                                  {exam.courseName}
                                </p>
                              </div>

                              <div className="flex gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => startEdit(exam)}
                                  className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-200 transition-colors"
                                >
                                  <FiEdit className="w-5 h-5" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleDeleteExam(exam.id)}
                                  className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-200 transition-colors"
                                >
                                  <FiTrash2 className="w-5 h-5" />
                                </motion.button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Exam Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Add New Exam
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddExam} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date & Day
                  </label>
                  <input
                    type="text"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    placeholder="e.g., Friday, 05-12-2025"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Branch
                  </label>
                  <select
                    value={formData.branch}
                    onChange={(e) =>
                      setFormData({ ...formData, branch: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    required
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Year
                  </label>
                  <select
                    value={formData.year}
                    onChange={(e) =>
                      setFormData({ ...formData, year: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    required
                  >
                    <option value="">Select Year</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year} Year
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Course Code
                  </label>
                  <input
                    type="text"
                    value={formData.courseCode}
                    onChange={(e) =>
                      setFormData({ ...formData, courseCode: e.target.value })
                    }
                    placeholder="e.g., CE405UX"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Course Name
                  </label>
                  <input
                    type="text"
                    value={formData.courseName}
                    onChange={(e) =>
                      setFormData({ ...formData, courseName: e.target.value })
                    }
                    placeholder="e.g., Interior Design"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    Add Exam
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminExamTimetable;
