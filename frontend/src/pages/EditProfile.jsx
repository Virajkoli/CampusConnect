import { useEffect, useState } from "react";
import { auth, firestore } from "../firebase";
import { useNavigate } from "react-router-dom";
import { updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import {
  FiUser,
  FiImage,
  FiArrowLeft,
  FiSave,
  FiUpload,
  FiBook,
  FiHash,
  FiBriefcase,
} from "react-icons/fi";
import axios from "axios";

function EditProfile() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [name, setName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Student fields
  const [rollNumber, setRollNumber] = useState("");
  const [dept, setDept] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");

  // Teacher fields
  const [employeeId, setEmployeeId] = useState("");

  const navigate = useNavigate();

  const departments = [
    "Computer Engineering",
    "Electronics And TeleCommunication Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Electrical Engineering",
    "Instrumentation Engineering",
  ];

  const years = ["1st", "2nd", "3rd", "4th"];
  const semesters = ["1", "2", "3", "4", "5", "6", "7", "8"];

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        navigate("/login");
        return;
      }

      try {
        await currentUser.reload();
        const tokenResult = await currentUser.getIdTokenResult(true);
        const claims = tokenResult.claims;

        setUser(currentUser);
        setName(currentUser.displayName || "");
        setPhotoURL(currentUser.photoURL || "");
        setPhotoPreview(currentUser.photoURL || "");

        // Fetch user data from Firestore based on role
        if (claims.admin) {
          setUserRole("admin");
        } else if (claims.teacher) {
          setUserRole("teacher");
          const teacherDoc = await getDoc(
            doc(firestore, "teachers", currentUser.uid)
          );
          if (teacherDoc.exists()) {
            const data = teacherDoc.data();
            setEmployeeId(data.employeeId || "");
            setDept(data.dept || "");
          }
        } else {
          setUserRole("student");
          // Try users collection first (most common)
          const userDoc = await getDoc(
            doc(firestore, "users", currentUser.uid)
          );
          if (userDoc.exists()) {
            const data = userDoc.data();
            console.log("User data from users collection:", data);
            setRollNumber(data.rollNumber || data.rollNo || "");
            setDept(data.dept || data.department || "");
            setYear(data.year || "");
            setSemester(data.semester || "");
          } else {
            // Fallback to students collection
            const studentDoc = await getDoc(
              doc(firestore, "students", currentUser.uid)
            );
            if (studentDoc.exists()) {
              const data = studentDoc.data();
              console.log("User data from students collection:", data);
              setRollNumber(data.rollNumber || data.rollNo || "");
              setDept(data.dept || data.department || "");
              setYear(data.year || "");
              setSemester(data.semester || "");
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadToCloudinary = async () => {
    if (!photoFile) return photoURL;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", photoFile);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/upload-profile",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setUploading(false);
      return response.data.url;
    } catch (error) {
      console.error("Upload error:", error);
      setUploading(false);
      alert("Failed to upload image. Please try again.");
      return photoURL;
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Upload photo if new file selected
      let finalPhotoURL = photoURL;
      if (photoFile) {
        finalPhotoURL = await uploadToCloudinary();
        if (!finalPhotoURL) {
          setLoading(false);
          return;
        }
      }

      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        displayName: name,
        photoURL: finalPhotoURL,
      });

      // Update Firestore based on role
      if (userRole === "student") {
        // Update users collection (primary) - only name and photo (academic fields are read-only)
        const userDocRef = doc(firestore, "users", user.uid);
        const userDocSnapshot = await getDoc(userDocRef);

        if (userDocSnapshot.exists()) {
          await updateDoc(userDocRef, {
            name: name,
            displayName: name,
            photoURL: finalPhotoURL,
          });
        }

        // Also try to update students collection if it exists
        const studentDocRef = doc(firestore, "students", user.uid);
        const studentDoc = await getDoc(studentDocRef);
        if (studentDoc.exists()) {
          await updateDoc(studentDocRef, {
            name: name,
            displayName: name,
            photoURL: finalPhotoURL,
          });
        }
      } else if (userRole === "teacher") {
        const teacherDocRef = doc(firestore, "teachers", user.uid);
        await updateDoc(teacherDocRef, {
          name: name,
          displayName: name,
          photoURL: finalPhotoURL,
          employeeId: employeeId,
          dept: dept,
        });
      }

      // Reload user data
      await auth.currentUser.reload();
      const updatedUser = auth.currentUser;

      setUser(updatedUser);
      setName(updatedUser.displayName || "");
      setPhotoURL(updatedUser.photoURL || "");

      setLoading(false);
      alert("Profile updated successfully!");
      navigate("/profile");
    } catch (error) {
      console.error("Profile update error:", error);
      alert("Failed to update profile. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <FiUser className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Edit Your Profile
          </h1>
          <p className="text-gray-600">Update your personal information</p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          {/* Profile Preview */}
          {photoPreview && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center mb-6"
            >
              <div className="w-32 h-32 rounded-full ring-4 ring-purple-200 overflow-hidden shadow-lg bg-gray-100">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* Full Name Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
              <FiUser className="w-5 h-5 text-blue-600" />
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
              placeholder="Enter your full name"
              required
            />
          </motion.div>

          {/* Photo Upload Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
              <FiImage className="w-5 h-5 text-purple-600" />
              Profile Picture
            </label>
            <div className="flex items-center gap-4">
              <label className="flex-1 cursor-pointer">
                <div className="w-full border-2 border-dashed border-gray-300 rounded-xl px-4 py-8 hover:border-purple-500 transition-all flex flex-col items-center justify-center gap-2">
                  <FiUpload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {photoFile ? photoFile.name : "Click to upload image"}
                  </span>
                  <span className="text-xs text-gray-400">
                    JPG, PNG or GIF (Max 5MB)
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </motion.div>

          {/* Student-specific fields - READ ONLY */}
          {userRole === "student" && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4"
              >
                <p className="text-amber-700 text-sm flex items-center gap-2">
                  <span>⚠️</span>
                  Academic information is managed by administrators and cannot
                  be edited.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
                  <FiHash className="w-5 h-5 text-green-600" />
                  Roll Number
                  <span className="text-xs text-gray-400 ml-2">
                    (Read-only)
                  </span>
                </label>
                <input
                  type="text"
                  value={rollNumber || "Not assigned"}
                  readOnly
                  disabled
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
                  <FiBook className="w-5 h-5 text-indigo-600" />
                  Department
                  <span className="text-xs text-gray-400 ml-2">
                    (Read-only)
                  </span>
                </label>
                <input
                  type="text"
                  value={dept || "Not assigned"}
                  readOnly
                  disabled
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </motion.div>

              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <label className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
                    Year
                    <span className="text-xs text-gray-400">(Read-only)</span>
                  </label>
                  <input
                    type="text"
                    value={year ? `${year} Year` : "Not assigned"}
                    readOnly
                    disabled
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
                    Semester
                    <span className="text-xs text-gray-400">(Read-only)</span>
                  </label>
                  <input
                    type="text"
                    value={semester ? `Semester ${semester}` : "Not assigned"}
                    readOnly
                    disabled
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </motion.div>
              </div>
            </>
          )}

          {/* Teacher-specific fields */}
          {userRole === "teacher" && (
            <>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
                  <FiBriefcase className="w-5 h-5 text-green-600" />
                  Employee ID
                </label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                  placeholder="Enter your employee ID"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
                  <FiBook className="w-5 h-5 text-indigo-600" />
                  Department
                </label>
                <select
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
                >
                  <option value="">Select Department</option>
                  {departments.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </motion.div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => navigate("/profile")}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all"
            >
              <FiArrowLeft className="w-5 h-5" />
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              type="submit"
              disabled={loading || uploading}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-lg ${
                loading || uploading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              }`}
            >
              {loading || uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {uploading ? "Uploading..." : "Saving..."}
                </>
              ) : (
                <>
                  <FiSave className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </motion.button>
          </div>
        </form>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 p-4 bg-blue-50 rounded-xl"
        >
          <p className="text-sm text-blue-800 text-center">
            💡 <strong>Tip:</strong> Use a square image (1:1 ratio) for best
            results
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default EditProfile;
