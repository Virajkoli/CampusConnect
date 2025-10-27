import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  deleteDoc,
  doc,
  orderBy,
} from "firebase/firestore";
import { firestore as db, auth } from "../firebase"; // Remove storage import
import { useAuthState } from "react-firebase-hooks/auth";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiFilter } from "react-icons/fi";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const StudyMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("notes");
  const [courseId, setCourseId] = useState("");
  const [courses, setCourses] = useState([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [user] = useAuthState(auth);
  const [isTeacher, setIsTeacher] = useState(false);
  const navigate = useNavigate();

  // Added for branch filtering
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [userDepartment, setUserDepartment] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Check if user is a teacher and get user department
  useEffect(() => {
    const getUserInfo = async () => {
      if (user) {
        try {
          // Check if user is a teacher
          const teacherQuery = query(
            collection(db, "teachers"),
            where("uid", "==", user.uid)
          );
          const teacherSnapshot = await getDocs(teacherQuery);
          const isUserTeacher = !teacherSnapshot.empty;
          setIsTeacher(isUserTeacher);

          if (isUserTeacher) {
            const teacherData = teacherSnapshot.docs[0].data();
            setUserDepartment(teacherData.department || "");
            setSelectedBranch(teacherData.department || "");
          } else {
            // Get student department
            const studentQuery = query(
              collection(db, "students"),
              where("uid", "==", user.uid)
            );
            const studentSnapshot = await getDocs(studentQuery);
            if (!studentSnapshot.empty) {
              const studentData = studentSnapshot.docs[0].data();
              setUserDepartment(studentData.department || "");
              setSelectedBranch(studentData.department || "");
            }
          }

          // Fetch branches
          await fetchBranches();
        } catch (error) {
          console.error("Error getting user info:", error);
        }
      }
    };

    getUserInfo();
  }, [user]);

  // Fetch all branches/departments
  const fetchBranches = async () => {
    try {
      const deptRef = collection(db, "departments");
      const snapshot = await getDocs(deptRef);

      if (snapshot.empty) {
        // Use mock data if no departments found
        const mockBranches = [
          "Computer Engineering",
          "Mechanical Engineering",
          "Electrical Engineering",
        ];
        setBranches(mockBranches);
      } else {
        const branchList = snapshot.docs.map((doc) => doc.data().name);
        setBranches(branchList);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
      // Mock data as fallback
      const mockBranches = [
        "Computer Engineering",
        "Mechanical Engineering",
        "Electrical Engineering",
      ];
      setBranches(mockBranches);
    }
  };

  // Fetch subjects when branch changes
  useEffect(() => {
    const fetchSubjectsForBranch = async () => {
      if (!selectedBranch) return;

      try {
        const deptRef = collection(db, "departments");
        const q = query(deptRef, where("name", "==", selectedBranch));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const deptData = snapshot.docs[0].data();
          setSubjects(deptData.subjects || []);
          if (deptData.subjects && deptData.subjects.length > 0) {
            setSelectedSubject("");
          }
        } else {
          // Mock data if department not found
          const mockSubjects = [
            "Data Structures",
            "Algorithms",
            "Database Management",
            "Computer Networks",
          ];
          setSubjects(mockSubjects);
        }
      } catch (error) {
        console.error("Error fetching subjects:", error);
        // Mock subjects as fallback
        const mockSubjects = [
          "Programming Fundamentals",
          "Data Structures",
          "Algorithms",
        ];
        setSubjects(mockSubjects);
      }
    };

    if (selectedBranch) {
      fetchSubjectsForBranch();
    }
  }, [selectedBranch]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // Try to fetch courses from Firestore
        const coursesCollection = collection(db, "courses");
        const coursesSnapshot = await getDocs(coursesCollection);
        const coursesList = coursesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // If we have courses from Firestore, use them
        if (coursesList.length > 0) {
          setCourses(coursesList);
          setCourseId(coursesList[0].id);
        }
        // If no courses in Firestore, use mock data
        else {
          const mockCourses = [
            { id: "cs101", name: "Introduction to Programming" },
            { id: "cs201", name: "Data Structures and Algorithms" },
            { id: "cs301", name: "Database Management" },
            { id: "cs401", name: "Computer Networks" },
          ];
          setCourses(mockCourses);
          setCourseId(mockCourses[0].id);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        toast.error("Failed to load courses, using mock data");

        // In case of error, still show some mock courses
        const mockCourses = [
          { id: "cs101", name: "Introduction to Programming" },
          { id: "cs201", name: "Data Structures and Algorithms" },
          { id: "cs301", name: "Database Management" },
          { id: "cs401", name: "Computer Networks" },
        ];
        setCourses(mockCourses);
        setCourseId(mockCourses[0].id);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [selectedBranch, selectedSubject]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      let materialsQuery;

      // Build query based on filters
      if (selectedBranch && selectedSubject) {
        // Filter by branch and subject
        materialsQuery = query(
          collection(db, "studyMaterials"),
          where("department", "==", selectedBranch),
          where("subject", "==", selectedSubject),
          orderBy("createdAt", "desc")
        );
      } else if (selectedBranch) {
        // Filter by branch only
        materialsQuery = query(
          collection(db, "studyMaterials"),
          where("department", "==", selectedBranch),
          orderBy("createdAt", "desc")
        );
      } else {
        // No filter, get all materials
        materialsQuery = query(
          collection(db, "studyMaterials"),
          orderBy("createdAt", "desc")
        );
      }

      const materialsSnapshot = await getDocs(materialsQuery);
      const materialsList = materialsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setMaterials(materialsList);
    } catch (error) {
      console.error("Error fetching study materials:", error);
      toast.error("Failed to load study materials");
      setMaterials([]); // Show empty state instead of mock data
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    // Previous upload functionality remains the same
    // ...
  };

  const handleDelete = async (materialId, cloudinaryPublicId) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    try {
      // Get user's ID token for authentication
      const idToken = await user.getIdToken();

      // Delete file from Cloudinary via backend
      if (cloudinaryPublicId) {
        await axios.delete(
          `${API_URL}/api/delete-material/${encodeURIComponent(
            cloudinaryPublicId
          )}`,
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        );
      }

      // Delete document from Firestore
      await deleteDoc(doc(db, "studyMaterials", materialId));

      // Update UI
      setMaterials(materials.filter((material) => material.id !== materialId));
      toast.success("Material deleted successfully");
    } catch (error) {
      console.error("Error deleting material:", error);
      toast.error(
        "Failed to delete material: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "notes":
        return "📝";
      case "assignment":
        return "📋";
      case "reference":
        return "📚";
      case "syllabus":
        return "📄";
      default:
        return "📎";
    }
  };

  const getFileTypeIcon = (fileType) => {
    if (!fileType) return "📎";

    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("word") || fileType.includes("document")) return "📝";
    if (fileType.includes("powerpoint") || fileType.includes("presentation"))
      return "📊";
    if (fileType.includes("excel") || fileType.includes("spreadsheet"))
      return "📊";
    if (fileType.includes("image")) return "🖼️";
    if (fileType.includes("zip") || fileType.includes("rar")) return "📦";
    if (fileType.includes("text")) return "📄";

    return "📎";
  };

  // Filter materials by search query
  const filteredMaterials = materials.filter(
    (material) =>
      material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (material.description &&
        material.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      (material.subject &&
        material.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      material.uploadedByName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Function to handle file download with better UX
  const handleDownload = async (fileURL, fileName) => {
    try {
      const response = await fetch(fileURL);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Download started!");
    } catch (error) {
      console.error("Download error:", error);
      // Fallback to direct download
      window.open(fileURL, "_blank");
    }
  };

  return (
    <div className="container m-6 px-4 py-8">
      <button
        onClick={() =>
          navigate(isTeacher ? "/teacher-dashboard" : "/student-dashboard")
        }
        className="flex items-center my-4 text-red-600 hover:text-green-800 transition-colors"
      >
        <FiArrowLeft className="mr-2" />
        Go Back
      </button>
      <h1 className="text-3xl font-bold mb-6">Study Materials</h1>

      {/* Filter section */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-3 flex items-center">
          <FiFilter className="mr-2" />
          Filter Materials
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-gray-700 mb-2">Course:</label>
            <select
              className="w-full border rounded py-2 px-3 text-gray-700"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">
              Department/Branch:
            </label>
            <select
              className="w-full border rounded py-2 px-3 text-gray-700"
              value={selectedBranch}
              onChange={(e) => {
                setSelectedBranch(e.target.value);
                setSelectedSubject("");
              }}
            >
              <option value="">All Departments</option>
              {branches.map((branch, index) => (
                <option key={index} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Subject:</label>
            <select
              className="w-full border rounded py-2 px-3 text-gray-700"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={!selectedBranch}
            >
              <option value="">All Subjects</option>
              {subjects.map((subject, index) => (
                <option key={index} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Search:</label>
            <input
              type="text"
              className="w-full border rounded py-2 px-3 text-gray-700"
              placeholder="Search materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {isTeacher && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="text-blue-800">
            To upload new materials for your department, please use the
            dedicated
            <a
              href="/teacher-studymaterial"
              className="font-bold underline ml-1 hover:text-blue-600"
            >
              Teacher Study Materials
            </a>{" "}
            page.
          </p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
          <p className="text-lg">Loading materials...</p>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="text-center bg-white p-8 rounded-lg shadow">
          <p className="text-lg">
            {searchQuery
              ? "No materials found matching your search."
              : selectedSubject
              ? `No materials available for ${selectedSubject} in ${
                  selectedBranch || "any department"
                }.`
              : selectedBranch
              ? `No materials available for ${selectedBranch}.`
              : "No materials available for this course yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((material) => (
            <div
              key={material.id}
              className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">
                  {getCategoryIcon(material.category)}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(material.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{material.title}</h3>

              {material.department && (
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    {material.department}
                  </span>
                </div>
              )}

              {material.subject && (
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-sm bg-green-100 text-green-800 px-2 py-0.5 rounded">
                    {material.subject}
                  </span>
                </div>
              )}

              {material.description && (
                <p className="text-gray-600 mb-4">{material.description}</p>
              )}

              <div className="flex justify-between items-center">
                <button
                  onClick={() =>
                    handleDownload(material.fileURL, material.title)
                  }
                  className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded text-sm flex items-center"
                >
                  📥 Download
                </button>
                {isTeacher && material.uploadedBy === user?.uid && (
                  <button
                    onClick={() =>
                      handleDelete(material.id, material.cloudinaryPublicId)
                    }
                    className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
              <div className="mt-3 text-xs text-gray-500">
                Uploaded by: {material.uploadedByName}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudyMaterials;
