import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../components/Button";
import { firestore, auth } from "../firebase";
import { FiRefreshCw, FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const roles = ["Student"];
const departments = [
  "Computer Engineering",
  "Electronics And TeleCommunication Engineering",
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
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      console.log("Starting fetchUsers...");
      const usersCollection = collection(firestore, "users");
      console.log("Collection reference created");

      const querySnapshot = await getDocs(usersCollection);
      console.log("Query snapshot received:", querySnapshot.size, "documents");

      const userList = [];
      const validIds = new Set();

      querySnapshot.forEach((docSnap) => {
        console.log("Processing document:", {
          id: docSnap.id,
          exists: docSnap.exists(),
          data: docSnap.data(),
        });

        if (docSnap.exists()) {
          validIds.add(docSnap.id);
          const userData = { id: docSnap.id, ...docSnap.data() };
          console.log("Adding user to list:", userData);
          userList.push(userData);
        }
      });

      console.log("Final user list:", userList);
      console.log("Valid IDs:", Array.from(validIds));

      // Update state with the new user list
      setUsers(userList);
      setFilteredUsers(userList);
      setError("");

      if (userList.length === 0) {
        console.log("No users found in Firestore");
        setError("No users found in the database");
      }
    } catch (error) {
      console.error("Error in fetchUsers:", error);
      setError("Failed to fetch users: " + error.message);
      // Reset states in case of error
      setUsers([]);
      setFilteredUsers([]);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        user.name?.toLowerCase()?.includes(search.toLowerCase()) ||
        user.rollNo?.includes(search) ||
        user.email?.toLowerCase()?.includes(search.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [search, users]);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleEdit = (user) => {
    console.log("Starting handleEdit with user:", {
      id: user?.id,
      name: user?.name,
      email: user?.email,
      uid: user?.uid,
    });

    if (!user || !user.id) {
      console.error("Invalid user data for editing:", user);
      setError("Invalid user data for editing");
      return;
    }

    // Set the form data immediately for better UX
    setFormData(user);
    setIsEditing(true);
    setEditId(user.id);
    setShowForm(true);
    setError("");

    // Verify the user exists in Firestore in the background
    const userDocRef = doc(firestore, "users", user.id);
    console.log("Checking Firestore for document:", user.id);

    getDoc(userDocRef)
      .then((docSnap) => {
        console.log("Document check result:", {
          exists: docSnap.exists(),
          id: docSnap.id,
          data: docSnap.data(),
        });

        if (!docSnap.exists()) {
          console.warn("User not found in database. Details:", {
            requestedId: user.id,
            currentUsers: users.map((u) => ({ id: u.id, name: u.name })),
          });

          // Check if the user exists in our current state
          const userInState = users.find((u) => u.id === user.id);
          if (!userInState) {
            console.error("User not found in both Firestore and local state");
            setError("User not found in database. Please refresh the page.");
            setIsEditing(false);
            setShowForm(false);
            return;
          }

          setError(
            "Warning: User not found in database. Changes may not be saved."
          );
        }
      })
      .catch((error) => {
        console.error("Error checking user existence:", error);
        setError("Error checking user existence: " + error.message);
        setIsEditing(false);
        setShowForm(false);
      });
  };

  const handleSubmit = async () => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      // Validate email
      if (!validateEmail(formData.email)) {
        throw new Error("Please enter a valid email address");
      }
      if (!formData.rollNo || !formData.dept) {
        throw new Error("Please fill all required fields.");
      }

      if (isEditing && editId) {
        // Verify the document exists before updating
        const userDocRef = doc(firestore, "users", editId);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          throw new Error("User not found in database");
        }

        // Update the document
        await updateDoc(userDocRef, {
          name: formData.name,
          email: formData.email,
          rollNo: formData.rollNo,
          role: formData.role,
          dept: formData.dept,
          updatedAt: new Date().toISOString(),
        });

        setSuccess("User updated successfully!");
      } else {
        const password = Math.random().toString(36).slice(-8); // Generate random password

        // ONLY CALL BACKEND
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:5000"
          }/api/createUser`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              name: formData.name,
              email: formData.email,
              password: password,
              rollNo: formData.rollNo,
              dept: formData.dept,
              role: formData.role,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to create user.");
        }

        setSuccess("User created successfully! Credentials sent to email.");
      }

      // Reset form and fetch updated users
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
      await fetchUsers();
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setError("Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id) {
      setError("Invalid user ID");
      return;
    }

    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        console.log("Starting delete process for user ID:", id);

        // First get the user document to get the uid
        const userDocRef = doc(firestore, "users", id);
        const userDoc = await getDoc(userDocRef);

        console.log("Firestore document check:", {
          exists: userDoc.exists(),
          id: userDoc.id,
          data: userDoc.data(),
        });

        if (!userDoc.exists()) {
          console.log(
            "Document doesn't exist in Firestore, removing from UI only"
          );
          setUsers((prevUsers) => prevUsers.filter((u) => u.id !== id));
          setFilteredUsers((prevFiltered) =>
            prevFiltered.filter((u) => u.id !== id)
          );
          setSuccess("User removed from UI (was not found in database)");
          return;
        }

        const userData = userDoc.data();
        console.log("User data to be deleted:", userData);

        // Delete from Firestore
        await deleteDoc(userDocRef);
        console.log("Successfully deleted from Firestore");

        // Try to delete from Firebase Auth if uid exists
        if (userData.uid) {
          try {
            console.log(
              "Attempting to delete from Firebase Auth with UID:",
              userData.uid
            );
            const response = await fetch(
              `${
                import.meta.env.VITE_API_URL || "http://localhost:5000"
              }/api/deleteUser`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ uid: userData.uid }),
              }
            );

            if (!response.ok) {
              const errorData = await response.json();
              console.warn(
                "Could not delete from Firebase Auth:",
                errorData.error || "API endpoint not available"
              );
              setError(
                "User deleted from Firestore but could not delete from Firebase Auth"
              );
            } else {
              console.log("Successfully deleted from Firebase Auth");
              setSuccess(
                "User deleted successfully from both Firestore and Firebase Auth!"
              );
            }
          } catch (authError) {
            console.warn("Could not connect to delete API:", authError.message);
            setError(
              "User deleted from Firestore but could not connect to Firebase Auth API"
            );
          }
        } else {
          console.warn(
            "No UID found in user document, skipping Firebase Auth deletion"
          );
          setSuccess("User deleted successfully from Firestore!");
        }

        // Update UI state
        setUsers((prevUsers) => prevUsers.filter((u) => u.id !== id));
        setFilteredUsers((prevFiltered) =>
          prevFiltered.filter((u) => u.id !== id)
        );

        // Force a refresh of the data from Firestore
        await fetchUsers();
      } catch (error) {
        console.error("Detailed delete error:", error);
        setError(`Failed to delete user: ${error.message}`);
      }
    }
  };

  const navigate = useNavigate();

  // Group users by department for department-wise cards
  const usersByDept = departments.reduce((acc, dept) => {
    acc[dept] = filteredUsers.filter(
      (u) => (u.dept || "").trim().toLowerCase() === dept.trim().toLowerCase()
    );
    return acc;
  }, {});

  return (
    <div className="p-6 mt-20">
      <div className="mb-4">
        <button
          onClick={() => navigate("/admin-dashboard")}
          className="flex items-center text-red-600 hover:text-green-800 transition-colors"
        >
          <FiArrowLeft className="mr-2" />
          Go Back
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search by name, email, or roll number"
            className="border px-3 py-2 w-1/2 rounded shadow"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button onClick={fetchUsers} className="flex items-center space-x-2">
            <FiRefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
        </div>
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
                  type={field === "email" ? "email" : "text"}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  className="border px-3 py-2 rounded"
                  value={formData[field]}
                  onChange={(e) =>
                    setFormData({ ...formData, [field]: e.target.value })
                  }
                  required
                />
              ))}
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="border px-3 py-2 rounded"
                required
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
                required
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
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading
                  ? "Processing..."
                  : isEditing
                  ? "Update User"
                  : "Add User"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Department-wise Cards UI - Clean & Simple */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {departments.map((dept) => (
          <motion.div
            key={dept}
            className="bg-white rounded-xl shadow-md p-6 border border-indigo-100 flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 120 }}
          >
            <div className="flex items-center mb-4">
              <span className="inline-block w-3 h-3 rounded-full bg-indigo-400 mr-2"></span>
              <h2 className="text-lg font-bold text-indigo-700">{dept}</h2>
              <span className="ml-auto text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">
                {usersByDept[dept].length} students
              </span>
            </div>
            {usersByDept[dept].length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">
                No students in this department.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="min-w-full text-sm divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left font-semibold text-gray-600">
                        Name
                      </th>
                      <th className="p-2 text-left font-semibold text-gray-600">
                        Email
                      </th>
                      <th className="p-2 text-left font-semibold text-gray-600">
                        Roll No.
                      </th>
                      <th className="p-2 text-center font-semibold text-gray-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersByDept[dept].map((user) => (
                      <tr
                        key={user.id}
                        className="border-b hover:bg-gray-50 transition"
                      >
                        <td className="p-2 whitespace-nowrap">{user.name}</td>
                        <td className="p-2 whitespace-nowrap">{user.email}</td>
                        <td className="p-2 whitespace-nowrap">{user.rollNo}</td>
                        <td className="p-2 text-center space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => handleEdit(user)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleDelete(user.id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default UserManagement;
