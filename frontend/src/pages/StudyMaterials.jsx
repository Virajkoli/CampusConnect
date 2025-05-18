import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { firestore as db, storage, auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { toast } from "react-toastify";

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

  // Check if user is a teacher
  useEffect(() => {
    const checkTeacherRole = async () => {
      if (user) {
        try {
          const teacherQuery = query(
            collection(db, "teachers"),
            where("uid", "==", user.uid)
          );
          const snapshot = await getDocs(teacherQuery);
          setIsTeacher(!snapshot.empty);
        } catch (error) {
          console.error("Error checking teacher role:", error);
        }
      }
    };

    checkTeacherRole();
  }, [user]);

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
    const fetchMaterials = async () => {
      if (!courseId) return;

      setLoading(true);
      try {
        const materialsQuery = query(
          collection(db, "studyMaterials"),
          where("courseId", "==", courseId)
        );
        const materialsSnapshot = await getDocs(materialsQuery);
        const materialsList = materialsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // If we have materials from Firestore, use them
        if (materialsList.length > 0) {
          setMaterials(materialsList);
        }
        // If no materials in Firestore for this course, use mock data
        else {
          // Generate mock materials based on courseId
          const mockMaterials = [
            {
              id: `mock-${courseId}-1`,
              title: "Course Introduction",
              description: "Overview of the course syllabus and objectives",
              category: "notes",
              courseId: courseId,
              fileURL: "https://example.com/sample.pdf",
              filePath: `materials/${courseId}/sample.pdf`,
              uploadedBy: "teacher123",
              uploadedByName: "Dr. Johnson",
              createdAt: new Date().toISOString(),
            },
            {
              id: `mock-${courseId}-2`,
              title: "Assignment 1",
              description: "First assignment of the semester",
              category: "assignment",
              courseId: courseId,
              fileURL: "https://example.com/assignment.pdf",
              filePath: `materials/${courseId}/assignment.pdf`,
              uploadedBy: "teacher123",
              uploadedByName: "Dr. Johnson",
              createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            },
            {
              id: `mock-${courseId}-3`,
              title: "Reference Book",
              description: "Additional reading material for the course",
              category: "reference",
              courseId: courseId,
              fileURL: "https://example.com/book.pdf",
              filePath: `materials/${courseId}/book.pdf`,
              uploadedBy: "teacher123",
              uploadedByName: "Dr. Johnson",
              createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            },
          ];
          setMaterials(mockMaterials);
        }
      } catch (error) {
        console.error("Error fetching study materials:", error);
        toast.error("Failed to load study materials, showing mock data");

        // In case of error, still show some mock materials
        const mockMaterials = [
          {
            id: `mock-${courseId}-1`,
            title: "Course Introduction",
            description: "Overview of the course syllabus and objectives",
            category: "notes",
            courseId: courseId,
            fileURL: "https://example.com/sample.pdf",
            filePath: `materials/${courseId}/sample.pdf`,
            uploadedBy: "teacher123",
            uploadedByName: "Dr. Johnson",
            createdAt: new Date().toISOString(),
          },
          {
            id: `mock-${courseId}-2`,
            title: "Assignment 1",
            description: "First assignment of the semester",
            category: "assignment",
            courseId: courseId,
            fileURL: "https://example.com/assignment.pdf",
            filePath: `materials/${courseId}/assignment.pdf`,
            uploadedBy: "teacher123",
            uploadedByName: "Dr. Johnson",
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ];
        setMaterials(mockMaterials);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, [courseId]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file || !title || !courseId) {
      toast.error("Please fill all required fields and select a file");
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size should be less than 10MB");
      return;
    }

    // Check allowed file types
    const fileExtension = file.name.split(".").pop().toLowerCase();
    const allowedExtensions = [
      "pdf",
      "doc",
      "docx",
      "ppt",
      "pptx",
      "xls",
      "xlsx",
      "txt",
      "jpg",
      "jpeg",
      "png",
      "zip",
      "rar",
    ];

    if (!allowedExtensions.includes(fileExtension)) {
      toast.error(
        `File type .${fileExtension} is not allowed. Please upload a document, image, or archive file.`
      );
      return;
    }

    toast.info("Upload started. Please wait...");
    setUploadLoading(true);

    try {
      // Upload file to Firebase Storage
      const fileRef = ref(
        storage,
        `materials/${courseId}/${Date.now()}-${file.name}`
      );
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef); // Add material metadata to Firestore
      await addDoc(collection(db, "studyMaterials"), {
        title,
        description,
        category,
        courseId,
        fileURL: downloadURL,
        filePath: fileRef.fullPath,
        uploadedBy: user.uid,
        uploadedByName: user.displayName || "Teacher",
        createdAt: new Date().toISOString(),
      });
      toast.success("Material uploaded successfully");
      setFile(null);
      setTitle("");
      setDescription("");

      // Create a new material object to add to the list immediately
      const newMaterial = {
        id: Date.now().toString(), // Temporary ID until refresh
        title,
        description,
        category,
        courseId,
        fileURL: downloadURL,
        filePath: fileRef.fullPath,
        uploadedBy: user.uid,
        uploadedByName: user.displayName || "Teacher",
        createdAt: new Date().toISOString(),
      };

      // Add the new material to the existing list (show it immediately)
      setMaterials((prevMaterials) => [newMaterial, ...prevMaterials]);

      // Also refresh materials list from database (for complete sync)
      try {
        const materialsQuery = query(
          collection(db, "studyMaterials"),
          where("courseId", "==", courseId)
        );
        const materialsSnapshot = await getDocs(materialsQuery);
        const materialsList = materialsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMaterials(materialsList);
      } catch (refreshError) {
        console.error("Error refreshing materials:", refreshError);
        // We don't show error here as the file is already uploaded and shown in UI
      }
    } catch (error) {
      console.error("Error uploading material:", error);
      toast.error("Failed to upload material");
    } finally {
      setUploadLoading(false);
    }
  };
  const handleDelete = async (materialId, filePath) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    // First immediately update UI to give instant feedback
    setMaterials(materials.filter((material) => material.id !== materialId));

    // Show deletion in progress
    const deleteToastId = toast.info("Deleting material...", {
      autoClose: false,
    });

    try {
      // If it's a mock file, don't try to delete it from storage
      if (!filePath.includes("mock-")) {
        // Delete file from storage
        const fileRef = ref(storage, filePath);
        await deleteObject(fileRef);
      }

      // Delete document from Firestore if not a mock material
      if (!materialId.toString().startsWith("mock-")) {
        await deleteDoc(doc(db, "studyMaterials", materialId));
      }

      // Close the "deleting" toast and show success
      toast.dismiss(deleteToastId);
      toast.success("Material deleted successfully");
    } catch (error) {
      console.error("Error deleting material:", error);
      toast.dismiss(deleteToastId);
      toast.error("Failed to delete material");

      // Revert the UI change by refreshing materials
      try {
        const materialsQuery = query(
          collection(db, "studyMaterials"),
          where("courseId", "==", courseId)
        );
        const materialsSnapshot = await getDocs(materialsQuery);
        const materialsList = materialsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMaterials(materialsList);
      } catch (refreshError) {
        console.error("Error refreshing materials:", refreshError);
      }
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Study Materials</h1>

      <div className="mb-8">
        <label className="block text-gray-700 mb-2">Select Course:</label>
        <select
          className="w-full md:w-1/3 border rounded py-2 px-3 text-gray-700"
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

      {isTeacher && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload New Material</h2>
          <form onSubmit={handleUpload}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Title*</label>
                <input
                  type="text"
                  className="w-full border rounded py-2 px-3 text-gray-700"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Category</label>
                <select
                  className="w-full border rounded py-2 px-3 text-gray-700"
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
                <label className="block text-gray-700 mb-2">Description</label>
                <textarea
                  className="w-full border rounded py-2 px-3 text-gray-700"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2">File*</label>
                <input
                  type="file"
                  className="w-full border rounded py-2 px-3 text-gray-700"
                  onChange={handleFileChange}
                  required
                />
              </div>
            </div>{" "}
            <div className="mt-4 flex flex-col md:flex-row items-center">
              <button
                type="submit"
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline flex items-center justify-center"
                disabled={uploadLoading}
              >
                {uploadLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  "Upload Material"
                )}
              </button>
              {uploadLoading && (
                <div className="mt-2 md:mt-0 md:ml-4 text-sm text-gray-600">
                  Uploading file, please don't close this page...
                </div>
              )}
              {!uploadLoading && (
                <div className="mt-2 md:mt-0 md:ml-4 text-xs text-gray-500">
                  Allowed formats: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT,
                  JPG, PNG, ZIP, RAR (Max 10MB)
                </div>
              )}
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center">
          <p className="text-lg">Loading materials...</p>
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center">
          <p className="text-lg">No materials available for this course yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((material) => (
            <div
              key={material.id}
              className="bg-white p-4 rounded-lg shadow-md"
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
              {material.description && (
                <p className="text-gray-600 mb-4">{material.description}</p>
              )}{" "}
              <div className="flex justify-between items-center">
                <a
                  href={
                    material.fileURL.startsWith("https://example.com")
                      ? "#"
                      : material.fileURL
                  }
                  onClick={(e) => {
                    if (material.fileURL.startsWith("https://example.com")) {
                      e.preventDefault();
                      toast.info(
                        "This is a mock file and cannot be downloaded."
                      );
                    }
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded text-sm"
                >
                  Download
                </a>
                {isTeacher && material.uploadedBy === user?.uid && (
                  <button
                    onClick={() => handleDelete(material.id, material.filePath)}
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
