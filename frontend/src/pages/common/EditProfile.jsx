import { useEffect, useState } from "react";
import { auth, firestore } from "../../firebase";
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
            doc(firestore, "teachers", currentUser.uid),
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
            doc(firestore, "users", currentUser.uid),
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
              doc(firestore, "students", currentUser.uid),
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
        },
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
    <div className="min-h-screen bg-[#eef2f6] px-3 py-6 sm:px-5 sm:py-8 lg:px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6"
      >
        <div className="mb-6 text-center sm:mb-7">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-[#e9f2ff] sm:h-16 sm:w-16">
            <FiUser className="h-7 w-7 text-[#2f87d9] sm:h-8 sm:w-8" />
          </div>
          <h1 className="mb-1 text-2xl font-semibold text-slate-800 sm:text-3xl">
            Edit Your Profile
          </h1>
          <p className="text-sm text-slate-600">
            Update your personal information
          </p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4 sm:space-y-5">
          {photoPreview && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex justify-center"
            >
              <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100 shadow sm:h-24 sm:w-24">
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

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FiUser className="h-4 w-4 text-[#2f87d9]" />
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-[#2f87d9] focus:outline-none focus:ring-2 focus:ring-[#cfe5ff]"
              placeholder="Enter your full name"
              required
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FiImage className="h-4 w-4 text-[#2f87d9]" />
              Profile Picture
            </label>
            <div className="flex items-center gap-4">
              <label className="flex-1 cursor-pointer">
                <div className="flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-4 py-5 transition hover:border-[#2f87d9]">
                  <FiUpload className="h-6 w-6 text-slate-400" />
                  <span className="text-xs text-slate-600 sm:text-sm">
                    {photoFile ? photoFile.name : "Click to upload image"}
                  </span>
                  <span className="text-[11px] text-slate-500">
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

          {userRole === "student" && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-2 rounded-xl border border-amber-200 bg-amber-50 p-3"
              >
                <p className="flex items-center gap-2 text-xs text-amber-700 sm:text-sm">
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
                <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FiHash className="h-4 w-4 text-emerald-600" />
                  Roll Number
                  <span className="ml-2 text-xs text-slate-400">
                    (Read-only)
                  </span>
                </label>
                <input
                  type="text"
                  value={rollNumber || "Not assigned"}
                  readOnly
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-600"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FiBook className="h-4 w-4 text-[#2f87d9]" />
                  Department
                  <span className="ml-2 text-xs text-slate-400">
                    (Read-only)
                  </span>
                </label>
                <input
                  type="text"
                  value={dept || "Not assigned"}
                  readOnly
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-600"
                />
              </motion.div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    Year
                    <span className="text-xs text-slate-400">(Read-only)</span>
                  </label>
                  <input
                    type="text"
                    value={year ? `${year} Year` : "Not assigned"}
                    readOnly
                    disabled
                    className="w-full cursor-not-allowed rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-600"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    Semester
                    <span className="text-xs text-slate-400">(Read-only)</span>
                  </label>
                  <input
                    type="text"
                    value={semester ? `Semester ${semester}` : "Not assigned"}
                    readOnly
                    disabled
                    className="w-full cursor-not-allowed rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-600"
                  />
                </motion.div>
              </div>
            </>
          )}

          {userRole === "teacher" && (
            <>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FiBriefcase className="h-4 w-4 text-emerald-600" />
                  Employee ID
                </label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-[#2f87d9] focus:outline-none focus:ring-2 focus:ring-[#cfe5ff]"
                  placeholder="Enter your employee ID"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FiBook className="h-4 w-4 text-[#2f87d9]" />
                  Department
                </label>
                <select
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-[#2f87d9] focus:outline-none focus:ring-2 focus:ring-[#cfe5ff]"
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

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => navigate("/profile")}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              <FiArrowLeft className="h-4 w-4" />
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              type="submit"
              disabled={loading || uploading}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                loading || uploading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#2f87d9] text-white hover:bg-[#1f6fb7]"
              }`}
            >
              {loading || uploading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  {uploading ? "Uploading..." : "Saving..."}
                </>
              ) : (
                <>
                  <FiSave className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </motion.button>
          </div>
        </form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-5 rounded-xl bg-[#f4f8ff] p-3"
        >
          <p className="text-center text-xs text-[#1f6fb7] sm:text-sm">
            💡 <strong>Tip:</strong> Use a square image (1:1 ratio) for best
            results
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default EditProfile;
