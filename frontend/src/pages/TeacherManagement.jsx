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
import { FiRefreshCw, FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const departments = [
  "Computer Engineering",
  "Electronics And TeleCommunication Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Instrumentation Engineering",
];

const years = ["1st", "2nd", "3rd", "4th"];

const subjectsList = {
  "Computer Engineering": {
    "1st": [
      "Introduction to Programming",
      "Mathematics I",
      "Physics",
      "Chemistry",
      "Environmental Studies",
    ],
    "2nd": [
      "Data Structures",
      "Algorithms",
      "Computer Networks",
      "Database Systems",
      "Software Engineering",
    ],
    "3rd": [
      "Operating Systems",
      "Database Management",
      "Computer Graphics",
      "Web Development",
      "Mobile App Development",
    ],
    "4th": [
      "Machine Learning",
      "Cloud Computing",
      "Artificial Intelligence",
      "Information Security",
      "Project Management",
    ],
  },
  "Electronics And TeleCommunication Engineering": {
    "1st": [
      "Basic Electronics",
      "Mathematics I",
      "Physics",
      "Chemistry",
      "Environmental Studies",
    ],
    "2nd": [
      "Signals and Systems",
      "Digital Electronics",
      "Circuit Theory",
      "Microprocessors",
      "Communication Principles",
    ],
    "3rd": [
      "Communication Systems",
      "Microprocessors",
      "Control Systems",
      "Digital Signal Processing",
      "Antenna Theory",
    ],
    "4th": [
      "VLSI Design",
      "Wireless Communication",
      "Optical Communication",
      "Embedded Systems",
      "Satellite Communication",
    ],
  },
  "Mechanical Engineering": {
    "1st": [
      "Engineering Mechanics",
      "Mathematics I",
      "Physics",
      "Chemistry",
      "Environmental Studies",
    ],
    "2nd": [
      "Thermodynamics",
      "Fluid Mechanics",
      "Manufacturing Processes",
      "Materials Science",
      "Machine Drawing",
    ],
    "3rd": [
      "Heat Transfer",
      "Machine Design",
      "CAD/CAM",
      "Industrial Engineering",
      "Metrology",
    ],
    "4th": [
      "Robotics",
      "Power Plant Engineering",
      "Automobile Engineering",
      "Refrigeration",
      "Project Management",
    ],
  },
  "Civil Engineering": {
    "1st": [
      "Engineering Drawing",
      "Mathematics I",
      "Physics",
      "Chemistry",
      "Environmental Studies",
    ],
    "2nd": [
      "Structural Mechanics",
      "Fluid Mechanics",
      "Surveying",
      "Building Materials",
      "Geology",
    ],
    "3rd": [
      "Design of Structures",
      "Geotechnical Engineering",
      "Transportation Engineering",
      "Water Resources",
      "Environmental Engineering",
    ],
    "4th": [
      "Construction Management",
      "Advanced Structures",
      "Urban Planning",
      "Earthquake Engineering",
      "Project Management",
    ],
  },
  "Electrical Engineering": {
    "1st": [
      "Basic Electrical",
      "Mathematics I",
      "Physics",
      "Chemistry",
      "Environmental Studies",
    ],
    "2nd": [
      "Circuit Theory",
      "Electromagnetic Fields",
      "Electrical Measurements",
      "Power Systems",
      "Control Systems",
    ],
    "3rd": [
      "Power Electronics",
      "Electrical Machines",
      "Digital Signal Processing",
      "Microprocessors",
      "Renewable Energy",
    ],
    "4th": [
      "High Voltage Engineering",
      "Power System Protection",
      "Electric Drives",
      "Smart Grid",
      "Energy Management",
    ],
  },
  "Instrumentation Engineering": {
    "1st": [
      "Basic Instrumentation",
      "Mathematics I",
      "Physics",
      "Chemistry",
      "Environmental Studies",
    ],
    "2nd": [
      "Transducers",
      "Signal Conditioning",
      "Control Systems",
      "Digital Electronics",
      "Process Control",
    ],
    "3rd": [
      "Industrial Instrumentation",
      "Microprocessors",
      "Digital Signal Processing",
      "Biomedical Instrumentation",
      "Analytical Instrumentation",
    ],
    "4th": [
      "Advanced Control Systems",
      "VLSI Design",
      "Robotics",
      "IoT Systems",
      "Automation",
    ],
  },
};

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    employeeId: "",
    dept: "",
    assignedCourses: [],
    year: null,
    subjects: [],
  });
  const [selectedYears, setSelectedYears] = useState([]);
  const [currentYear, setCurrentYear] = useState("");
  const [currentSubjects, setCurrentSubjects] = useState([]);
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
    setFormData({
      name: teacher.name || "",
      email: teacher.email || "",
      employeeId: teacher.employeeId || "",
      dept: teacher.dept || "",
      assignedCourses: teacher.assignedCourses || [],
    });

    const years = teacher.assignedCourses
      ? teacher.assignedCourses.map((course) => course.year)
      : [];

    setSelectedYears(years);
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

  const handleYearChange = (e) => {
    setCurrentYear(e.target.value);
    setCurrentSubjects([]);
  };

  const handleAddYearSubjects = () => {
    if (!currentYear || currentSubjects.length === 0) {
      setError("Please select a year and at least one subject");
      return;
    }

    const yearExists = formData.assignedCourses.some(
      (course) => course.year === currentYear
    );

    let updatedCourses;
    if (yearExists) {
      updatedCourses = formData.assignedCourses.map((course) => {
        if (course.year === currentYear) {
          return {
            ...course,
            subjects: [...new Set([...course.subjects, ...currentSubjects])],
          };
        }
        return course;
      });
    } else {
      updatedCourses = [
        ...formData.assignedCourses,
        { year: currentYear, subjects: currentSubjects },
      ];
    }

    setFormData({
      ...formData,
      assignedCourses: updatedCourses,
    });

    if (!selectedYears.includes(currentYear)) {
      setSelectedYears([...selectedYears, currentYear]);
    }

    setCurrentYear("");
    setCurrentSubjects([]);
  };

  const handleRemoveYear = (yearToRemove) => {
    const updatedCourses = formData.assignedCourses.filter(
      (course) => course.year !== yearToRemove
    );

    setFormData({
      ...formData,
      assignedCourses: updatedCourses,
    });

    setSelectedYears(selectedYears.filter((year) => year !== yearToRemove));
  };

  const handleSubjectChange = (subject, isChecked) => {
    if (isChecked) {
      setCurrentSubjects([...currentSubjects, subject]);
    } else {
      setCurrentSubjects(currentSubjects.filter((s) => s !== subject));
    }
  };

  const getAvailableSubjects = () => {
    if (formData.dept && currentYear) {
      return subjectsList[formData.dept]?.[currentYear] || [];
    }
    return [];
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    setIsLoading(true);
    try {
      if (!validateEmail(formData.email)) {
        throw new Error("Invalid email address.");
      }

      if (
        !formData.name ||
        !formData.employeeId ||
        !formData.dept ||
        formData.assignedCourses.length === 0
      ) {
        throw new Error(
          "Please fill all required fields and assign at least one course with subjects."
        );
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
        const response = await fetch(
          "http://localhost:5000/api/createTeacher",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          }
        );

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to create teacher.");
        }

        setSuccess("Teacher created successfully!");
      }

      setFormData({
        name: "",
        email: "",
        employeeId: "",
        dept: "",
        assignedCourses: [],
      });
      setSelectedYears([]);
      setCurrentYear("");
      setCurrentSubjects([]);
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

  const navigate = useNavigate();

  const teachersByDept = departments.reduce((acc, dept) => {
    acc[dept] = filteredTeachers.filter(
      (t) => (t.dept || "").trim().toLowerCase() === dept.trim().toLowerCase()
    );
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-blue-100 p-8 text-gray-800">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate("/admin-dashboard")}
            className="mt-20 flex items-center text-red-600 hover:text-green-900 transition-colors text-lg"
          >
            <FiArrowLeft className=" mr-2 text-xl" /> Go Back
          </button>
        </div>

        <h1 className="text-3xl font-bold text-indigo-600">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="border px-3 py-2 rounded w-full"
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
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
                onChange={(e) =>
                  setFormData({ ...formData, dept: e.target.value })
                }
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

            {formData.dept && (
              <div className="border-t pt-4 mb-6">
                <h3 className="text-lg font-semibold mb-3">Assign Courses</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <select
                    value={currentYear}
                    onChange={handleYearChange}
                    className="border px-3 py-2 rounded w-full"
                  >
                    <option value="">Select Year</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year} Year
                      </option>
                    ))}
                  </select>

                  <Button
                    variant="outline"
                    onClick={handleAddYearSubjects}
                    disabled={!currentYear || currentSubjects.length === 0}
                  >
                    Add Selected Subjects
                  </Button>
                </div>

                {currentYear && (
                  <div className="mb-4 border p-4 rounded bg-gray-50">
                    <h4 className="font-medium mb-2">
                      Select Subjects for {currentYear} Year:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {getAvailableSubjects().map((subject) => (
                        <label
                          key={subject}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            value={subject}
                            checked={currentSubjects.includes(subject)}
                            onChange={(e) =>
                              handleSubjectChange(subject, e.target.checked)
                            }
                            className="form-checkbox h-5 w-5 text-indigo-600"
                          />
                          <span>{subject}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {formData.assignedCourses.length > 0 && (
                  <div className="mb-4 border p-4 rounded bg-blue-50">
                    <h4 className="font-medium mb-2">Assigned Courses:</h4>
                    <div className="space-y-4">
                      {formData.assignedCourses.map((course, idx) => (
                        <div key={idx} className="border-b pb-2">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold">
                              {course.year} Year
                            </span>
                            <button
                              onClick={() => handleRemoveYear(course.year)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="pl-4">
                            <span className="text-sm">Subjects: </span>
                            <span className="text-sm font-medium">
                              {course.subjects.join(", ")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4">
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading
                  ? "Saving..."
                  : isEditing
                  ? "Update Teacher"
                  : "Add Teacher"}
              </Button>
            </div>
          </motion.div>
        )}

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
                  {teachersByDept[dept].length} teachers
                </span>
              </div>
              {teachersByDept[dept].length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">
                  No teachers in this department.
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
                          Employee ID
                        </th>
                        <th className="p-2 text-center font-semibold text-gray-600">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {teachersByDept[dept].map((teacher) => (
                        <tr
                          key={teacher.id}
                          className="border-b hover:bg-gray-50 transition"
                        >
                          <td className="p-2 whitespace-nowrap">
                            {teacher.name}
                          </td>
                          <td className="p-2 whitespace-nowrap">
                            {teacher.email}
                          </td>
                          <td className="p-2 whitespace-nowrap">
                            {teacher.employeeId}
                          </td>
                          <td className="p-2">
                            <div className="flex justify-center items-center gap-2">
                              <Button
                                variant="outline"
                                onClick={() => handleEdit(teacher)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleDelete(teacher.id)}
                              >
                                Delete
                              </Button>
                            </div>
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
    </div>
  );
};

export default TeacherManagement;
