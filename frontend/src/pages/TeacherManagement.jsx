import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../components/Button";
import { firestore } from "../firebase";
import { FiRefreshCw } from "react-icons/fi";

const departments = [
  "Computer Engineering",
  "Electronics And TeleCommunication Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Instrumentation Engineering",
];

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    employeeId: "",
    dept: "",
  });
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
        teacher.email?.toLowerCase()?.includes(search.toLowerCase())
    );
    setFilteredTeachers(filtered);
  }, [search, teachers]);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleEdit = async (teacher) => {
    setFormData(teacher);
    setIsEditing(true);
    setEditId(teacher.id);
    setShowForm(true);
    setError("");

    const teacherDocRef = doc(firestore, "teachers", teacher.id);
    const docSnap = await getDoc(teacherDocRef);
    if (!docSnap.exists()) {
      setError("Teacher not found in database. Please refresh the page.");
      setIsEditing(false);
      setShowForm(false);
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
      if (!formData.name || !formData.employeeId || !formData.dept) {
        throw new Error("Please fill all required fields.");
      }

      if (isEditing && editId) {
        const docRef = doc(firestore, "teachers", editId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          throw new Error("Teacher not found in database.");
        }

        await updateDoc(docRef, {
          ...formData,
          updatedAt: new Date().toISOString(),
        });

        setSuccess("Teacher updated successfully!");
      } else {
        const response = await fetch("http://localhost:5000/api/createTeacher", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to create teacher.");
        }

        setSuccess("Teacher created successfully!");
      }

      setFormData({ name: "", email: "", employeeId: "", dept: "" });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-blue-100 p-8 text-gray-800">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-indigo-600">
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

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3 w-full">
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
          <Button onClick={() => setShowForm(!showForm)} className="ml-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border px-3 py-2 rounded w-full"
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="border px-3 py-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="Employee ID"
                value={formData.employeeId}
                onChange={(e) =>
                  setFormData({ ...formData, employeeId: e.target.value })
                }
                className="border px-3 py-2 rounded w-full"
              />
              <select
                value={formData.dept}
                onChange={(e) => setFormData({ ...formData, dept: e.target.value })}
                className="border px-3 py-2 rounded w-full"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-4">
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? "Saving..." : isEditing ? "Update Teacher" : "Add Teacher"}
              </Button>
            </div>
          </motion.div>
        )}

        <div className="overflow-x-auto shadow rounded bg-white">
          <table className="min-w-full table-auto">
            <thead className="bg-indigo-50">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Employee ID</th>
                <th className="p-3 text-left">Department</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredTeachers.map((teacher) => (
                  <motion.tr
                    key={teacher.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-3">{teacher.name}</td>
                    <td className="p-3">{teacher.email}</td>
                    <td className="p-3">{teacher.employeeId}</td>
                    <td className="p-3">{teacher.dept}</td>
                    <td className="p-3 space-x-2">
                      <Button variant="outline" onClick={() => handleEdit(teacher)}>
                        Edit
                      </Button>
                      <Button variant="destructive" onClick={() => handleDelete(teacher.id)}>
                        Delete
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeacherManagement;
