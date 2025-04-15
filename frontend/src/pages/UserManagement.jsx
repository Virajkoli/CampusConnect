import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../components/button";
import { firestore } from "../firebase";

const roles = ["Student", "Teacher", "Staff"];
const departments = [
  "Computer Engineering",
  "Electronics And TeleCommunication Engiinering",
  "Mechanical Enginerring ",
  "Civil Enginerring",
  "Electrical Enginerring",
  "Intrumentation Enginerring",
];

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    rollNo: "",
    role: "Student",
    dept: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

 

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, "users"));
      const userList = [];
      querySnapshot.forEach((docSnap) => {
        userList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setUsers(userList);
    } catch (error) {
      console.error("Error fetching users from Firestore:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter((user) =>
      (user.name?.toLowerCase()?.includes(search.toLowerCase()) ||
       user.rollNo?.includes(search) ||
       user.email?.toLowerCase()?.includes(search.toLowerCase()))
    );
    setFilteredUsers(filtered);
  }, [search, users]);

  const handleSubmit = async () => {
    try {
      // Generate random password
      const password = Math.random().toString(36).slice(-8); // Simple 8-char password
  
      // Call your backend API to create Firebase Auth user and send email
      const response = await fetch("http://192.168.1.11:5000/api/createUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, password }),
      });
  
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "User creation failed");
  
      // Store in Firestore (excluding password)
      await addDoc(collection(firestore, "users"), formData);
  
      setFormData({
        name: "",
        email: "",
        rollNo: "",
        role: "Student",
        dept: "",
      });
      setIsEditing(false);
      setEditId(null);
      setShowForm(false);
      fetchUsers();
    } catch (error) {
      console.error("Error creating user:", error.message);
    }
  };
  

  const handleEdit = (user) => {
    setFormData(user);
    setIsEditing(true);
    setEditId(user.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(firestore, "users", id));
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user from Firestore:", error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search by name, email, or roll number"
          className="border px-3 py-2 w-1/2 rounded shadow"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Close" : "Add User"}
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-4 rounded shadow mb-6"
          >
            <div className="grid grid-cols-2 gap-4">
              {["name", "email", "rollNo"].map((field) => (
                <input
                  key={field}
                  type="text"
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  className="border px-3 py-2 rounded"
                  value={formData[field]}
                  onChange={(e) =>
                    setFormData({ ...formData, [field]: e.target.value })
                  }
                />
              ))}
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="border px-3 py-2 rounded"
              >
                <option value="Student">Student</option>
                <option value="Teacher">Teacher</option>
                <option value="Staff">Staff</option>
              </select>
              <select
                value={formData.dept}
                onChange={(e) =>
                  setFormData({ ...formData, dept: e.target.value })
                }
                className="border px-3 py-2 rounded"
              >
                <option value="">Select Department</option>
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <Button onClick={handleSubmit}>
                {isEditing ? "Update User" : "Add User"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Roll No.</th>
              <th className="p-3">Department</th>
              <th className="p-3">Role</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredUsers.map((user) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="p-3">{user.name}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">{user.rollNo}</td>
                  <td className="p-3">{user.dept}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">
                      {user.role}
                    </span>
                  </td>
                  <td className="p-3 space-x-2">
                    <Button variant="outline" onClick={() => handleEdit(user)}>
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(user.id)}
                    >
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
  );
};

export default UserManagement;
