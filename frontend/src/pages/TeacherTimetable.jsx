import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiPlus, FiTrash2, FiEdit2 } from "react-icons/fi";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { firestore, auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { toast } from "react-toastify";

const TeacherTimetable = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [classes, setClasses] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  // Form fields
  const [formData, setFormData] = useState({
    subject: "",
    day: "Monday",
    startTime: "",
    endTime: "",
    room: "",
    department: "",
    semester: "",
    division: "",
  });

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const timeSlots = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
  ];

  useEffect(() => {
    fetchTeacherInfo();
  }, [user]);

  useEffect(() => {
    if (teacherInfo) {
      fetchClasses();
    }
  }, [teacherInfo]);

  const fetchTeacherInfo = async () => {
    if (!user) {
      navigate("/teacher-auth");
      return;
    }

    try {
      const teachersRef = collection(firestore, "teachers");
      const q = query(teachersRef, where("uid", "==", user.uid));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setTeacherInfo({
          id: snapshot.docs[0].id,
          ...data,
        });
        setFormData((prev) => ({
          ...prev,
          department: data.department || "",
        }));
      } else {
        // Use default info if teacher profile doesn't exist
        setTeacherInfo({
          id: user.uid,
          name: user.displayName || "Teacher",
          email: user.email,
          uid: user.uid,
          department: "General",
        });
        setFormData((prev) => ({
          ...prev,
          department: "General",
        }));
      }
    } catch (error) {
      console.error("Error fetching teacher info:", error);
      // Use default info on error
      setTeacherInfo({
        id: user.uid,
        name: user.displayName || "Teacher",
        email: user.email,
        uid: user.uid,
        department: "General",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const classesRef = collection(firestore, "timetable");
      const q = query(classesRef, where("teacherId", "==", user.uid));
      const snapshot = await getDocs(q);

      const classList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setClasses(classList);
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error("Failed to load timetable");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.subject || !formData.startTime || !formData.endTime) {
      toast.error("Please fill all required fields");
      return;
    }

    // Validate time
    if (formData.startTime >= formData.endTime) {
      toast.error("End time must be after start time");
      return;
    }

    try {
      const classData = {
        ...formData,
        teacherId: user.uid,
        teacherName: teacherInfo.name || user.displayName,
        createdAt: Date.now(),
      };

      if (editingClass) {
        // Update existing class
        await updateDoc(
          doc(firestore, "timetable", editingClass.id),
          classData
        );
        toast.success("Class updated successfully");
        setClasses(
          classes.map((c) =>
            c.id === editingClass.id ? { id: c.id, ...classData } : c
          )
        );
      } else {
        // Add new class
        const docRef = await addDoc(
          collection(firestore, "timetable"),
          classData
        );
        setClasses([...classes, { id: docRef.id, ...classData }]);
        toast.success("Class added successfully");
      }

      resetForm();
      setShowAddModal(false);
    } catch (error) {
      console.error("Error saving class:", error);
      toast.error("Failed to save class");
    }
  };

  const handleEdit = (classItem) => {
    setEditingClass(classItem);
    setFormData({
      subject: classItem.subject,
      day: classItem.day,
      startTime: classItem.startTime,
      endTime: classItem.endTime,
      room: classItem.room || "",
      department: classItem.department || "",
      semester: classItem.semester || "",
      division: classItem.division || "",
    });
    setShowAddModal(true);
  };

  const handleDelete = async (classId) => {
    if (!confirm("Are you sure you want to delete this class?")) return;

    try {
      await deleteDoc(doc(firestore, "timetable", classId));
      setClasses(classes.filter((c) => c.id !== classId));
      toast.success("Class deleted successfully");
    } catch (error) {
      console.error("Error deleting class:", error);
      toast.error("Failed to delete class");
    }
  };

  const resetForm = () => {
    setFormData({
      subject: "",
      day: "Monday",
      startTime: "",
      endTime: "",
      room: "",
      department: teacherInfo?.department || "",
      semester: "",
      division: "",
    });
    setEditingClass(null);
  };

  const getClassesForSlot = (day, timeSlot) => {
    return classes.filter((c) => {
      const classStart = c.startTime;
      const classEnd = c.endTime;
      return c.day === day && classStart <= timeSlot && classEnd > timeSlot;
    });
  };

  const getColorForSubject = (subject) => {
    const colors = [
      "bg-blue-100 border-blue-500 text-blue-800",
      "bg-green-100 border-green-500 text-green-800",
      "bg-purple-100 border-purple-500 text-purple-800",
      "bg-orange-100 border-orange-500 text-orange-800",
      "bg-pink-100 border-pink-500 text-pink-800",
      "bg-indigo-100 border-indigo-500 text-indigo-800",
      "bg-teal-100 border-teal-500 text-teal-800",
    ];
    const index = subject.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <button
        onClick={() => navigate("/teacher-dashboard")}
        className="flex items-center mb-6 text-blue-600 hover:text-blue-800 transition-colors"
      >
        <FiArrowLeft className="mr-2" />
        Back to Dashboard
      </button>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Timetable</h1>
          <p className="text-gray-600 mt-1">
            Manage your class schedule - {teacherInfo?.department}
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <FiPlus />
          Add Class
        </button>
      </div>

      {/* Timetable Grid */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <th className="p-3 text-left font-semibold border border-blue-500">
                  Time
                </th>
                {days.map((day) => (
                  <th
                    key={day}
                    className="p-3 text-center font-semibold border border-blue-500 min-w-[150px]"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((timeSlot) => (
                <tr key={timeSlot} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-700 bg-gray-50 border">
                    {timeSlot}
                  </td>
                  {days.map((day) => {
                    const slotClasses = getClassesForSlot(day, timeSlot);
                    return (
                      <td key={day} className="p-2 border relative">
                        {slotClasses.map((classItem) => (
                          <div
                            key={classItem.id}
                            className={`${getColorForSubject(
                              classItem.subject
                            )} p-2 rounded-lg mb-1 border-l-4 group relative`}
                          >
                            <div className="font-semibold text-sm">
                              {classItem.subject}
                            </div>
                            <div className="text-xs mt-1">
                              {classItem.startTime} - {classItem.endTime}
                            </div>
                            {classItem.room && (
                              <div className="text-xs">
                                Room: {classItem.room}
                              </div>
                            )}
                            {classItem.division && (
                              <div className="text-xs">
                                Div: {classItem.division}
                              </div>
                            )}

                            {/* Action buttons on hover */}
                            <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
                              <button
                                onClick={() => handleEdit(classItem)}
                                className="bg-white p-1 rounded shadow hover:bg-blue-50"
                                title="Edit"
                              >
                                <FiEdit2 size={12} className="text-blue-600" />
                              </button>
                              <button
                                onClick={() => handleDelete(classItem.id)}
                                className="bg-white p-1 rounded shadow hover:bg-red-50"
                                title="Delete"
                              >
                                <FiTrash2 size={12} className="text-red-600" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingClass ? "Edit Class" : "Add New Class"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., Data Structures"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Day *
                  </label>
                  <select
                    name="day"
                    value={formData.day}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  >
                    {days.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      End Time *
                    </label>
                    <input
                      type="time"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Room Number
                  </label>
                  <input
                    type="text"
                    name="room"
                    value={formData.room}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., 301"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., Computer Engineering"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Semester
                    </label>
                    <input
                      type="text"
                      name="semester"
                      value={formData.semester}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g., 3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Division
                    </label>
                    <input
                      type="text"
                      name="division"
                      value={formData.division}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g., A"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    {editingClass ? "Update Class" : "Add Class"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherTimetable;
