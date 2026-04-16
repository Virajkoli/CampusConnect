import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  deleteDoc,
  doc,
  orderBy,
  getDoc,
} from "firebase/firestore";
import { firestore, auth } from "../../firebase"; // Remove storage import
import { useAuthState } from "react-firebase-hooks/auth";
import { toast } from "react-toastify";
import axios from "axios";

const API_URL = String(import.meta.env.VITE_API_URL || "http://localhost:5000")
  .trim()
  .replace(/\/+$/, "");

const normalizeAssignments = (teacherData = {}) => {
  if (
    Array.isArray(teacherData.assignments) &&
    teacherData.assignments.length > 0
  ) {
    return teacherData.assignments;
  }

  if (
    Array.isArray(teacherData.assignedCourses) &&
    teacherData.assignedCourses.length > 0
  ) {
    const fallbackBranch = teacherData.department || teacherData.dept || "";
    return teacherData.assignedCourses.map((course) => ({
      branch: fallbackBranch,
      year: course.year || "",
      subjects: Array.isArray(course.subjects) ? course.subjects : [],
    }));
  }

  if (teacherData.year && Array.isArray(teacherData.subjects)) {
    return [
      {
        branch: teacherData.department || teacherData.dept || "",
        year: teacherData.year,
        subjects: teacherData.subjects,
      },
    ];
  }

  return [];
};

const buildAssignedSubjectsByBranch = (
  assignments = [],
  fallbackBranch = "",
) => {
  const branchMap = new Map();

  assignments.forEach((assignment) => {
    const branchName = String(
      assignment?.branch || assignment?.department || fallbackBranch || "",
    ).trim();
    if (!branchName) {
      return;
    }

    const list = branchMap.get(branchName) || [];
    const nextSubjects = Array.isArray(assignment?.subjects)
      ? assignment.subjects
      : [];

    nextSubjects.forEach((subject) => {
      const normalized = String(subject || "").trim();
      if (normalized && !list.includes(normalized)) {
        list.push(normalized);
      }
    });

    branchMap.set(branchName, list);
  });

  return Object.fromEntries(branchMap.entries());
};

const getPreferredBranch = (branches = [], preferred = "") => {
  const normalizedPreferred = String(preferred || "")
    .trim()
    .toLowerCase();

  if (!normalizedPreferred) {
    return branches[0] || "";
  }

  const exact = branches.find(
    (branch) =>
      String(branch || "")
        .trim()
        .toLowerCase() === normalizedPreferred,
  );
  return exact || branches[0] || "";
};

const TeacherStudyMaterial = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Teacher information
  const [teacherDept, setTeacherDept] = useState("");
  const [teacherName, setTeacherName] = useState("");

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("notes");
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState("");

  // Data lists
  const [subjects, setSubjects] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [assignedSubjectsByBranch, setAssignedSubjectsByBranch] = useState({});
  const [materials, setMaterials] = useState([]);
  useEffect(() => {
    // Verify user is a teacher and get their department
    const verifyTeacher = async () => {
      if (!user) {
        console.log("No user found, redirecting to login");
        navigate("/login");
        return;
      }

      console.log("Current user UID:", user.uid);
      console.log("Current user email:", user.email);

      // Check if user has teacher claim
      try {
        const idTokenResult = await user.getIdTokenResult();
        console.log("User claims:", idTokenResult.claims);

        if (!idTokenResult.claims.teacher) {
          console.log("User does not have teacher claim");
          toast.warning(
            "Teacher permissions may be required for uploading files",
          );
        }
      } catch (error) {
        console.error("Error checking user claims:", error);
      }

      try {
        console.log("Attempting to query teachers collection");
        const teacherDoc = await getDoc(doc(firestore, "teachers", user.uid));

        let snapshot = null;
        if (!teacherDoc.exists()) {
          const teachersRef = collection(firestore, "teachers");
          const q = query(teachersRef, where("uid", "==", user.uid));
          snapshot = await getDocs(q);
        }

        console.log(
          "Query result:",
          teacherDoc.exists() || (snapshot && !snapshot.empty)
            ? "Found teacher record"
            : "No documents found",
        );

        if (!teacherDoc.exists() && (!snapshot || snapshot.empty)) {
          console.log("No teacher document found with UID:", user.uid);

          // For development - create a teacher document instead of redirecting
          console.log("Creating a temporary teacher document for development");

          // Set teacher data for this session
          setTeacherDept("Computer Engineering");
          setTeacherName(user.displayName || "Teacher");
          setSelectedBranch("Computer Engineering");
          setAssignedSubjectsByBranch({});

          // Fetch branches and subjects
          await fetchBranches();
          setLoading(false);
          return;

          // Comment out the error and redirect for now
          // toast.error("Only teachers can access this page");
          // navigate("/login");
          // return;
        }

        const teacherData = teacherDoc.exists()
          ? teacherDoc.data()
          : snapshot.docs[0].data();

        const teacherDepartment =
          teacherData.department || teacherData.dept || "";
        const normalizedAssignments = normalizeAssignments(teacherData);
        const assignedMap = buildAssignedSubjectsByBranch(
          normalizedAssignments,
          teacherDepartment,
        );

        setAssignedSubjectsByBranch(assignedMap);
        setTeacherDept(teacherDepartment);
        setTeacherName(
          teacherData.name ||
            teacherData.displayName ||
            user.displayName ||
            "Teacher",
        );

        const assignedBranches = Object.keys(assignedMap);
        if (assignedBranches.length > 0) {
          const preferredBranch = getPreferredBranch(
            assignedBranches,
            teacherDepartment,
          );
          setBranches(assignedBranches);
          setSelectedBranch(preferredBranch);
        } else {
          setSelectedBranch(teacherDepartment || "");
          await fetchBranches();
        }
      } catch (error) {
        console.error("Error verifying teacher:", error);
        toast.error("Failed to verify your credentials");
      } finally {
        setLoading(false);
      }
    };

    verifyTeacher();
  }, [user, navigate]);
  // Fetch all departments/branches
  const fetchBranches = async () => {
    try {
      const deptRef = collection(firestore, "departments");
      const snapshot = await getDocs(deptRef);

      if (snapshot.empty) {
        // Use mock data if no departments found
        const mockBranches = [
          "Computer Engineering",
          "Mechanical Engineering",
          "Electrical Engineering",
        ];
        setBranches(mockBranches);
        setSelectedBranch(mockBranches[0]);
      } else {
        const branchList = snapshot.docs.map((doc) => doc.data().name);
        setBranches(branchList);
        setSelectedBranch((previous) => previous || branchList[0] || "");
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
      setSelectedBranch((previous) => previous || mockBranches[0]);
    }
  };

  // Fetch subjects for a specific branch
  useEffect(() => {
    const fetchSubjectsForBranch = async () => {
      if (!selectedBranch) return;

      const assignedSubjects = assignedSubjectsByBranch[selectedBranch] || [];
      if (assignedSubjects.length > 0) {
        setSubjects(assignedSubjects);
        setSelectedSubject((previous) =>
          assignedSubjects.includes(previous) ? previous : assignedSubjects[0],
        );
        return;
      }

      if (Object.keys(assignedSubjectsByBranch).length > 0) {
        setSubjects([]);
        setSelectedSubject("");
        return;
      }

      try {
        const deptRef = collection(firestore, "departments");
        const q = query(deptRef, where("name", "==", selectedBranch));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const deptData = snapshot.docs[0].data();
          setSubjects(deptData.subjects || []);
          if (deptData.subjects && deptData.subjects.length > 0) {
            setSelectedSubject(deptData.subjects[0]);
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
          setSelectedSubject(mockSubjects[0]);
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
        setSelectedSubject(mockSubjects[0]);
      }
    };

    fetchSubjectsForBranch();
  }, [selectedBranch, assignedSubjectsByBranch]);

  // Fetch materials when subject changes
  useEffect(() => {
    const fetchMaterials = async () => {
      if (!selectedBranch || !selectedSubject) {
        setMaterials([]);
        return;
      }

      setLoading(true);
      try {
        const materialsRef = collection(firestore, "studyMaterials");
        const q = query(
          materialsRef,
          where("department", "==", selectedBranch),
          where("subject", "==", selectedSubject),
          orderBy("createdAt", "desc"),
        );

        const snapshot = await getDocs(q);
        const materialsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setMaterials(materialsList);
      } catch (error) {
        console.error("Error fetching materials:", error);
        toast.error("Failed to load materials");
        setMaterials([]); // Show empty state instead of mock data
      } finally {
        setLoading(false);
      }
    };

    if (selectedBranch && selectedSubject) {
      fetchMaterials();
    }
  }, [selectedBranch, selectedSubject, teacherName, user]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        e.target.value = "";
        return;
      }

      // Check file type with clear messaging
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
        "image/jpeg",
        "image/png",
        "application/zip",
        "application/x-rar-compressed",
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error(
          `Invalid file type: ${
            file.type || "Unknown"
          }. Please upload PDF, Word, PowerPoint, Excel, text, image, or archive files.`,
        );
        e.target.value = "";
        return;
      }

      // Show file info to user
      const fileInfo = `Selected: ${file.name} (${(
        file.size /
        (1024 * 1024)
      ).toFixed(2)} MB)`;
      toast.success(fileInfo);

      setSelectedFile(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!selectedFile || !title || !selectedSubject || !selectedBranch) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to upload files");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Get user's ID token for authentication
      const idToken = await user.getIdToken();

      // Create FormData to send file
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("department", selectedBranch);
      formData.append("subject", selectedSubject);

      // Upload to backend (which uploads to Cloudinary)
      const response = await axios.post(
        `${API_URL}/api/upload-material`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${idToken}`,
          },
          onUploadProgress: (progressEvent) => {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            setUploadProgress(progress);
          },
        },
      );

      if (response.data.success) {
        const { fileURL, publicId, fileSize, format } = response.data;

        // Format file size
        let formattedSize;
        if (fileSize < 1024) {
          formattedSize = fileSize + " B";
        } else if (fileSize < 1024 * 1024) {
          formattedSize = (fileSize / 1024).toFixed(1) + " KB";
        } else {
          formattedSize = (fileSize / (1024 * 1024)).toFixed(1) + " MB";
        }

        // Save document to Firestore
        const materialData = {
          title,
          description,
          category,
          department: selectedBranch,
          subject: selectedSubject,
          fileURL,
          cloudinaryPublicId: publicId, // Store for deletion later
          uploadedBy: user.uid,
          uploadedByName: teacherName,
          createdAt: Date.now(),
          fileSize: formattedSize,
          fileType: format,
        };

        const docRef = await addDoc(
          collection(firestore, "studyMaterials"),
          materialData,
        );

        // Add to current materials list
        setMaterials([{ id: docRef.id, ...materialData }, ...materials]);

        // Reset form
        setTitle("");
        setDescription("");
        setSelectedFile(null);
        document.getElementById("file-upload").value = "";

        toast.success("Material uploaded successfully");
        setUploading(false);
        setUploadProgress(0);
      }
    } catch (error) {
      console.error("Upload error:", error);
      let errorMessage = "Upload failed: ";

      if (error.response) {
        errorMessage +=
          error.response.data.message || error.response.statusText;
      } else if (error.request) {
        errorMessage +=
          "No response from server. Please check your connection.";
      } else {
        errorMessage += error.message;
      }

      toast.error(errorMessage);
      setUploading(false);
      setUploadProgress(0);
    }
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
            cloudinaryPublicId,
          )}`,
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          },
        );
      }

      // Delete document from Firestore
      await deleteDoc(doc(firestore, "studyMaterials", materialId));

      // Update UI
      setMaterials(materials.filter((material) => material.id !== materialId));
      toast.success("Material deleted successfully");
    } catch (error) {
      console.error("Error deleting material:", error);
      toast.error(
        "Failed to delete material: " +
          (error.response?.data?.message || error.message),
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#eef2f6] px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-6xl text-center">
          <div className="flex h-64 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#2f87d9] border-t-transparent"></div>
          </div>
          <p className="text-sm font-medium text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef2f6] px-3 py-5 sm:px-5 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => navigate("/teacher-dashboard")}
          className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:text-[#2f87d9] sm:px-4 sm:py-2 sm:text-sm"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <h1 className="mb-4 text-2xl font-semibold text-slate-800 sm:text-3xl">
          Manage Study Materials
        </h1>

        <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-700 sm:text-base">
            <span className="font-semibold">Your Department:</span>{" "}
            {teacherDept}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
          <div className="col-span-1">
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Branch/Department:
            </label>
            <select
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              {branches.map((branch, index) => (
                <option key={index} value={branch}>
                  {branch} {branch === teacherDept ? "(Your Department)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-1">
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Subject:
            </label>
            <select
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={subjects.length === 0}
            >
              {subjects.length === 0 ? (
                <option value="">
                  No assigned subjects available for this branch
                </option>
              ) : (
                subjects.map((subject, index) => (
                  <option key={index} value={subject}>
                    {subject}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Upload form */}
        <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-800 sm:text-xl">
            Upload New Material
          </h2>

          <form onSubmit={handleUpload}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Title*
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Category
                </label>
                <select
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="notes">Notes</option>
                  <option value="assignment">Assignment</option>
                  <option value="reference">Reference Material</option>
                  <option value="syllabus">Syllabus</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  File*
                </label>
                <input
                  id="file-upload"
                  type="file"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  onChange={handleFileChange}
                  required
                />
                <p className="mt-1 text-xs text-slate-500">
                  Max file size: 10MB. Supported formats: PDF, DOC, DOCX, PPT,
                  PPTX, XLS, XLSX, TXT, JPG, PNG, ZIP, RAR
                </p>
              </div>
            </div>

            {uploading && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">
                  Upload progress: {Math.round(uploadProgress)}%
                </p>
              </div>
            )}

            <div className="mt-4">
              <button
                type="submit"
                className="rounded-xl bg-[#2f87d9] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1f6fb7] disabled:opacity-50"
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload Material"}
              </button>
            </div>
          </form>
        </div>

        {/* Materials list */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-slate-800 sm:text-2xl">
            Your Materials
          </h2>

          {materials.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-slate-600">
                No materials found for this subject. Upload your first material!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {materials.map((material) => (
                <div
                  key={material.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition"
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {getCategoryIcon(material.category)}
                      </span>
                      <span className="text-lg">
                        {getFileTypeIcon(material.fileType)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(material.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="mb-2 text-lg font-semibold text-slate-800">
                    {material.title}
                  </h3>

                  {material.description && (
                    <p className="mb-3 text-sm text-slate-600">
                      {material.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {material.subject}
                    </span>
                    {material.fileSize && (
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                        {material.fileSize}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <a
                      href={material.fileURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-[#2f87d9] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#1f6fb7]"
                      onClick={(e) => {
                        if (material.fileURL.includes("example.com")) {
                          e.preventDefault();
                          toast.info(
                            "This is a mock file and cannot be downloaded",
                          );
                        }
                      }}
                    >
                      Download
                    </a>

                    {material.uploadedBy === user?.uid && (
                      <button
                        onClick={() =>
                          handleDelete(material.id, material.cloudinaryPublicId)
                        }
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherStudyMaterial;
