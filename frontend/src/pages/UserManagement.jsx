import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../components/button";
import { firestore } from "../firebase";

const roles = ["Student", "Teacher", "Staff"];
const departments = [
  "Computer Engineering",
  "Electronics And Telecommunication Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Instrumentation Engineering",
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
    roleFilter: "",
    deptFilter: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // 🔄 Fetch users from Firestore
  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, "users"));
      const userList = [];
      querySnapshot.forEach((docSnap) => {
        userList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setUsers(userList);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter((user) => {
      const matchSearch =
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.rollNo?.includes(search) ||
        user.email?.toLowerCase().includes(search.toLowerCase());

      const matchRole =
        !formData.roleFilter || user.role === formData.roleFilter;
      const matchDept =
        !formData.deptFilter || user.dept === formData.deptFilter;

      return matchSearch && matchRole && matchDept;
    });

    setFilteredUsers(filtered);
  }, [search, users, formData.roleFilter, formData.deptFilter]);

  // ✅ Submit Form - Create or Update User
  const handleSubmit = async () => {
    try {
      if (isEditing && editId) {
        const originalUser = users.find((u) => u.id === editId);
        const updatedUser = {
          newName: formData.name,
          newEmail: formData.email,
          role: formData.role,
        };

        // Backend call to update Firebase Auth + Firestore
        const res = await fetch(
          `http://192.168.1.11:5000/api/updateUser/${originalUser.email}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updatedUser),
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Update failed");

        // Remove old doc and re-add updated one
        await deleteDoc(doc(firestore, "users", editId));
        await setDoc(doc(firestore, "users", formData.email), formData);


        setIsEditing(false);
        setEditId(null);
      } else {
        const password = Math.random().toString(36).slice(-8);

        // Backend call to create Firebase Auth + send email
        const response = await fetch("http://192.168.1.11:5000/api/createUser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, password }),
        });

        const data = await response.json();
        if (!response.ok)
          throw new Error(data.message || "User creation failed");

        await addDoc(collection(firestore, "users"), formData);
      }

      setFormData({
        name: "",
        email: "",
        rollNo: "",
        role: "Student",
        dept: "",
      });
      setShowForm(false);
      fetchUsers();
    } catch (error) {
      console.error("Error submitting user:", error.message);
    }
  };

  // 📝 Edit user data
  const handleEdit = (user) => {
    setFormData(user);
    setIsEditing(true);
    setEditId(user.id);
    setShowForm(true);
  };

  // ❌ Delete user from Auth + Firestore
  const handleDelete = async (user) => {
    try {
      const res = await fetch(
        `http://192.168.1.11:5000/api/deleteUser/${user.email}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");

      await deleteDoc(doc(firestore, "users", user.id));
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error.message);
    }
  };

  return (
    <div className="p-6">
      {/* Search and Filters */}
      <div className="flex flex-wrap justify-between gap-2 items-center mb-4">
        <input
          type="text"
          placeholder="Search by name, email, or roll number"
          className="border px-3 py-2 w-full sm:w-1/2 rounded shadow"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border px-3 py-2 rounded"
          value={formData.roleFilter || ""}
          onChange={(e) =>
            setFormData({ ...formData, roleFilter: e.target.value })
          }
        >
          <option value="">All Roles</option>
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>

        <select
          className="border px-3 py-2 rounded"
          value={formData.deptFilter || ""}
          onChange={(e) =>
            setFormData({ ...formData, deptFilter: e.target.value })
          }
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>

        <Button
          onClick={() => {
            setFormData({
              name: "",
              email: "",
              rollNo: "",
              role: "Student",
              dept: "",
            });
            setIsEditing(false);
            setEditId(null);
            setShowForm(!showForm);
          }}
        >
          {showForm ? "Close" : "Add User"}
        </Button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-4 rounded shadow mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
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

      {/* Table */}
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
                      onClick={() => handleDelete(user)}
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
